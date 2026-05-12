import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { sign } from "jsonwebtoken";
import {
  authMiddleware,
  requireRole,
  logAudit,
  AuthUser,
  checkRateLimit,
  recordLoginAttempt,
  validatePassword,
  setAuthCookie,
  setRefreshCookie,
  clearAuthCookies,
  generateCSRFToken,
  setCSRFCookie,
  generateRefreshToken,
  refreshAccessToken,
} from "./auth";
import speakeasy from "speakeasy";

/**
 * API administrativa em `/api/admin/*` (autenticação, MFA, gestão de alertas e utilizadores).
 *
 * @module worker/admin
 */
type Variables = {
  user: AuthUser;
};

const adminRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
  mfa_code: z.string().optional(),
});

const createAdminSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(12, "Senha deve ter no mínimo 12 caracteres"),
  full_name: z.string().min(1, "Nome completo é obrigatório"),
  role: z.enum(["super_admin", "municipal_admin", "operator"]),
  municipality_id: z.number().optional(),
});

// Login endpoint
adminRouter.post("/auth/login", zValidator("json", loginSchema), async (c) => {
  const db = c.env.DB;
  const { email, password, mfa_code } = c.req.valid("json");
  
  try {
    // Check rate limiting
    const rateLimit = await checkRateLimit(c, email);
    if (!rateLimit.allowed) {
      return c.json({ 
        error: `Muitas tentativas de login. Tente novamente em ${rateLimit.lockoutMinutes} minutos.` 
      }, 429);
    }
    
    // Find user by email
    const user = await db
      .prepare("SELECT * FROM admin_users WHERE email = ? AND is_active = 1")
      .bind(email)
      .first();
    
    if (!user) {
      await recordLoginAttempt(c, email, false);
      await logAudit(c, "login_failed", `Email: ${email}`);
      return c.json({ error: "Email ou senha inválidos" }, 401);
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash as string);
    
    if (!isValidPassword) {
      await recordLoginAttempt(c, email, false);
      await logAudit(c, "login_failed", `Email: ${email}`);
      return c.json({ error: "Email ou senha inválidos" }, 401);
    }
    
    // Check if MFA is enabled
    if (user.mfa_enabled) {
      if (!mfa_code) {
        return c.json({ 
          mfa_required: true,
          message: "Código de autenticação de dois fatores necessário"
        }, 200);
      }
      
      // Verify MFA code
      const verified = speakeasy.totp.verify({
        secret: user.mfa_secret as string,
        encoding: 'base32',
        token: mfa_code,
        window: 2 // Allow 2 time steps before and after
      });
      
      if (!verified) {
        await recordLoginAttempt(c, email, false);
        await logAudit(c, "login_failed_mfa", `Email: ${email}`);
        return c.json({ error: "Código de autenticação inválido" }, 401);
      }
    }
    
    // Check if password change is required
    if (user.must_change_password) {
      return c.json({
        must_change_password: true,
        temp_user_id: user.id,
        message: "Você deve alterar sua senha antes de continuar"
      }, 200);
    }
    
    // Generate JWT token
    const jwtSecret = c.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET não configurado");
      return c.json({ error: "Erro de configuração do servidor" }, 500);
    }
    
    const token = sign(
      {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        municipality_id: user.municipality_id,
      },
      jwtSecret,
      { expiresIn: "15m" } // Short-lived access token (15 min)
    );
    
    // Generate refresh token (7 days)
    const refreshToken = generateRefreshToken(user.id as number, jwtSecret);
    
    // Generate CSRF token
    const csrfToken = generateCSRFToken();
    
    // Set httpOnly secure cookies
    setAuthCookie(c, token);
    setRefreshCookie(c, refreshToken);
    setCSRFCookie(c, csrfToken);
    
    // Record successful login
    await recordLoginAttempt(c, email, true);
    
    // Update last login
    await db
      .prepare("UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(user.id)
      .run();
    
    await logAudit(c, "login_success", `User ID: ${user.id}`);
    
    // Return user info only - token is in httpOnly cookie
    return c.json({
      success: true,
      csrf_token: csrfToken, // Send CSRF token to client for header inclusion
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        municipality_id: user.municipality_id,
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return c.json({ error: "Erro ao processar login" }, 500);
  }
});

// Refresh token endpoint
adminRouter.post("/auth/refresh", async (c) => {
  try {
    const result = await refreshAccessToken(c);
    
    if (!result) {
      await logAudit(c, "refresh_token_failed", undefined, "warning");
      return c.json({ error: "Sessão expirada. Faça login novamente." }, 401);
    }
    
    // Set new access token
    setAuthCookie(c, result.token);
    
    // Generate new CSRF token
    const csrfToken = generateCSRFToken();
    setCSRFCookie(c, csrfToken);
    
    await logAudit(c, "token_refreshed", `User ID: ${result.user.id}`);
    
    return c.json({
      success: true,
      csrf_token: csrfToken,
      user: result.user,
    });
  } catch (error) {
    console.error("Erro ao renovar token:", error);
    return c.json({ error: "Erro ao renovar sessão" }, 500);
  }
});

// Whether initial admin setup has already been completed (no auth; read-only)
adminRouter.get("/auth/setup-status", async (c) => {
  const db = c.env.DB;
  if (!db) {
    return c.json({ error: "Database not configured" }, 503);
  }
  try {
    const row = await db.prepare("SELECT COUNT(*) as count FROM admin_users").first();
    const count = Number((row as { count: number } | null)?.count ?? 0);
    return c.json({ configured: count > 0 });
  } catch (error) {
    console.error("setup-status error:", error);
    return c.json({ error: "Failed to check setup status" }, 500);
  }
});

// Create first super admin (no auth required, but only works if no admins exist)
adminRouter.post("/auth/setup", zValidator("json", createAdminSchema), async (c) => {
  const db = c.env.DB;
  const data = c.req.valid("json");
  
  try {
    // Check if any admin users already exist
    const existingAdmin = await db
      .prepare("SELECT COUNT(*) as count FROM admin_users")
      .first();
    
    if (existingAdmin && (existingAdmin.count as number) > 0) {
      return c.json({ error: "Sistema já foi configurado" }, 403);
    }
    
    // Validate password strength
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.valid) {
      return c.json({ 
        error: "Senha não atende aos requisitos de segurança",
        details: passwordValidation.errors
      }, 400);
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);
    
    // Create super admin
    const result = await db
      .prepare(
        `INSERT INTO admin_users (email, password_hash, full_name, role, municipality_id, updated_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
      )
      .bind(
        data.email,
        passwordHash,
        data.full_name,
        "super_admin",
        null
      )
      .run();
    
    await logAudit(c, "admin_created", `First super admin created: ${data.email}`);
    
    return c.json({
      success: true,
      message: "Super admin criado com sucesso",
      userId: result.meta.last_row_id,
    }, 201);
  } catch (error) {
    console.error("Erro ao criar super admin:", error);
    return c.json({ error: "Erro ao criar administrador" }, 500);
  }
});

// Get current user info
adminRouter.get("/auth/me", authMiddleware, async (c) => {
  const user = c.get("user");
  return c.json(user);
});

// Logout endpoint - clears httpOnly cookies
adminRouter.post("/auth/logout", async (c) => {
  clearAuthCookies(c);
  await logAudit(c, "logout", "User logged out");
  return c.json({ success: true, message: "Logout realizado com sucesso" });
});

// Create new admin user (requires super_admin or municipal_admin)
adminRouter.post(
  "/users",
  authMiddleware,
  requireRole("super_admin", "municipal_admin"),
  zValidator("json", createAdminSchema),
  async (c) => {
    const db = c.env.DB;
    const currentUser = c.get("user");
    const data = c.req.valid("json");
    
    try {
      // Municipal admins can only create users for their own municipality
      if (currentUser.role === "municipal_admin") {
        if (data.municipality_id !== currentUser.municipality_id) {
          return c.json({ error: "Você só pode criar usuários para seu município" }, 403);
        }
        
        // Municipal admins cannot create super_admins
        if (data.role === "super_admin") {
          return c.json({ error: "Você não tem permissão para criar super admins" }, 403);
        }
      }
      
      // Check if email already exists
      const existing = await db
        .prepare("SELECT id FROM admin_users WHERE email = ?")
        .bind(data.email)
        .first();
      
      if (existing) {
        return c.json({ error: "Email já está em uso" }, 400);
      }
      
      // Validate password strength
      const passwordValidation = validatePassword(data.password);
      if (!passwordValidation.valid) {
        return c.json({ 
          error: "Senha não atende aos requisitos de segurança",
          details: passwordValidation.errors
        }, 400);
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 12);
      
      // Create user
      const result = await db
        .prepare(
          `INSERT INTO admin_users (email, password_hash, full_name, role, municipality_id, updated_at)
           VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
        )
        .bind(
          data.email,
          passwordHash,
          data.full_name,
          data.role,
          data.municipality_id || null
        )
        .run();
      
      await logAudit(c, "admin_user_created", `Created user: ${data.email} (${data.role})`);
      
      return c.json({
        success: true,
        userId: result.meta.last_row_id,
      }, 201);
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      return c.json({ error: "Erro ao criar usuário" }, 500);
    }
  }
);

// Get all admin users (requires authentication)
adminRouter.get("/users", authMiddleware, async (c) => {
  const db = c.env.DB;
  const currentUser = c.get("user");
  
  try {
    let query = `
      SELECT 
        u.id, u.email, u.full_name, u.role, u.municipality_id, 
        u.is_active, u.last_login_at, u.created_at,
        m.name as municipality_name
      FROM admin_users u
      LEFT JOIN municipalities m ON u.municipality_id = m.id
    `;
    
    const params: any[] = [];
    
    // Municipal admins can only see users from their municipality
    if (currentUser.role === "municipal_admin") {
      query += " WHERE u.municipality_id = ?";
      params.push(currentUser.municipality_id);
    }
    
    query += " ORDER BY u.created_at DESC";
    
    const stmt = params.length > 0 ? db.prepare(query).bind(...params) : db.prepare(query);
    const users = await stmt.all();
    
    return c.json(users.results);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return c.json({ error: "Erro ao buscar usuários" }, 500);
  }
});

// Get all alerts (with filters and user info)
adminRouter.get("/alerts", authMiddleware, async (c) => {
  const db = c.env.DB;
  const currentUser = c.get("user");
  
  try {
    let query = `
      SELECT 
        a.*,
        u.name as user_name,
        u.age as user_age,
        u.notes as user_notes,
        admin.full_name as assigned_to_name,
        (SELECT COUNT(*) FROM alert_notifications WHERE alert_id = a.id) as notifications_count
      FROM alerts a
      LEFT JOIN user_profile u ON u.id = 1
      LEFT JOIN admin_users admin ON a.assigned_to = admin.id
    `;
    
    const params: any[] = [];
    
    // Municipal admins can only see alerts from their municipality
    if (currentUser.role === "municipal_admin") {
      query += " WHERE a.municipality_id = ?";
      params.push(currentUser.municipality_id);
    }
    
    query += " ORDER BY a.created_at DESC";
    
    const stmt = params.length > 0 ? db.prepare(query).bind(...params) : db.prepare(query);
    const alerts = await stmt.all();
    
    return c.json(alerts.results);
  } catch (error) {
    console.error("Erro ao buscar alertas:", error);
    return c.json({ error: "Erro ao buscar alertas" }, 500);
  }
});

// Assign alert to operator
adminRouter.post("/alerts/:id/assign", authMiddleware, async (c) => {
  const db = c.env.DB;
  const currentUser = c.get("user");
  const alertId = c.req.param("id");
  
  try {
    const body = await c.req.json();
    const assignedTo = body.assignedTo;
    
    if (!assignedTo) {
      return c.json({ error: "ID do operador é obrigatório" }, 400);
    }
    
    // Verify the alert exists and user has permission
    const alert = await db
      .prepare("SELECT * FROM alerts WHERE id = ?")
      .bind(alertId)
      .first();
    
    if (!alert) {
      return c.json({ error: "Alerta não encontrado" }, 404);
    }
    
    // Municipal admins can only assign alerts from their municipality
    if (currentUser.role === "municipal_admin" && alert.municipality_id !== currentUser.municipality_id) {
      return c.json({ error: "Você não tem permissão para atribuir este alerta" }, 403);
    }
    
    await db
      .prepare("UPDATE alerts SET assigned_to = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(assignedTo, alertId)
      .run();
    
    await logAudit(c, "alert_assigned", `Alert ${alertId} assigned to user ${assignedTo}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Erro ao atribuir alerta:", error);
    return c.json({ error: "Erro ao atribuir alerta" }, 500);
  }
});

// Get metrics and analytics
adminRouter.get("/metrics", authMiddleware, async (c) => {
  const db = c.env.DB;
  const currentUser = c.get("user");
  
  try {
    // Build base WHERE clause for municipality filtering
    const municipalityFilter = currentUser.role === "municipal_admin" 
      ? `WHERE a.municipality_id = ${currentUser.municipality_id}` 
      : "";
    
    // Get totals
    const totalsQuery = `
      SELECT 
        COUNT(*) as total_alerts,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_alerts,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_alerts,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_alerts,
        AVG(
          CASE 
            WHEN status = 'resolved' AND resolved_at IS NOT NULL 
            THEN (julianday(resolved_at) - julianday(created_at)) * 24 * 60
            ELSE NULL 
          END
        ) as avg_resolution_time_minutes
      FROM alerts a ${municipalityFilter}
    `;
    const totals = await db.prepare(totalsQuery).first();
    
    // Get total operators
    const operatorsQuery = currentUser.role === "municipal_admin"
      ? `SELECT COUNT(*) as count FROM admin_users WHERE municipality_id = ${currentUser.municipality_id} AND is_active = 1`
      : "SELECT COUNT(*) as count FROM admin_users WHERE is_active = 1";
    const operators = await db.prepare(operatorsQuery).first();
    
    // Get total municipalities
    const municipalities = await db.prepare("SELECT COUNT(*) as count FROM municipalities WHERE is_active = 1").first();
    
    // Get user subscription stats
    const userStatsQuery = `
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN subscription_status = 'trial' THEN 1 ELSE 0 END) as trial_users,
        SUM(CASE WHEN subscription_status = 'active' THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN subscription_status = 'expired' THEN 1 ELSE 0 END) as expired_users,
        SUM(CASE WHEN subscription_status = 'active' THEN subscription_amount ELSE 0 END) as annual_revenue
      FROM users
    `;
    const userStats = await db.prepare(userStatsQuery).first();
    
    // Get subscription growth (last 30 days)
    const subscriptionGrowthQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_users,
        SUM(CASE WHEN subscription_status = 'active' THEN 1 ELSE 0 END) as new_subscribers
      FROM users
      WHERE created_at >= DATE('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;
    const subscriptionGrowth = await db.prepare(subscriptionGrowthQuery).all();
    
    // Get daily alerts for last 30 days
    const dailyAlertsQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM alerts a
      ${municipalityFilter}
      WHERE created_at >= DATE('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;
    const dailyAlerts = await db.prepare(dailyAlertsQuery).all();
    
    // Get status distribution
    const statusQuery = `
      SELECT 
        status,
        COUNT(*) as count
      FROM alerts a
      ${municipalityFilter}
      GROUP BY status
    `;
    const statusDist = await db.prepare(statusQuery).all();
    
    // Get top municipalities (only for super_admin)
    let topMunicipalities: any[] = [];
    if (currentUser.role === "super_admin") {
      const topMunQuery = `
        SELECT 
          m.name as municipality_name,
          COUNT(a.id) as alert_count
        FROM alerts a
        LEFT JOIN municipalities m ON a.municipality_id = m.id
        WHERE m.name IS NOT NULL
        GROUP BY m.id, m.name
        ORDER BY alert_count DESC
        LIMIT 10
      `;
      const topMun = await db.prepare(topMunQuery).all();
      topMunicipalities = topMun.results || [];
    }
    
    // Get operator performance
    const operatorPerfQuery = `
      SELECT 
        admin.full_name as operator_name,
        COUNT(a.id) as resolved_count
      FROM alerts a
      INNER JOIN admin_users admin ON a.assigned_to = admin.id
      ${municipalityFilter ? municipalityFilter + " AND" : "WHERE"} a.status = 'resolved'
      GROUP BY admin.id, admin.full_name
      ORDER BY resolved_count DESC
      LIMIT 10
    `;
    const operatorPerf = await db.prepare(operatorPerfQuery).all();
    
    return c.json({
      totals: {
        total_alerts: totals?.total_alerts || 0,
        pending_alerts: totals?.pending_alerts || 0,
        in_progress_alerts: totals?.in_progress_alerts || 0,
        resolved_alerts: totals?.resolved_alerts || 0,
        avg_resolution_time_minutes: totals?.avg_resolution_time_minutes || 0,
        total_operators: operators?.count || 0,
        total_municipalities: municipalities?.count || 0,
      },
      users: {
        total_users: userStats?.total_users || 0,
        trial_users: userStats?.trial_users || 0,
        active_users: userStats?.active_users || 0,
        expired_users: userStats?.expired_users || 0,
        annual_revenue: userStats?.annual_revenue || 0,
      },
      daily_alerts: dailyAlerts.results || [],
      status_distribution: statusDist.results || [],
      subscription_growth: subscriptionGrowth.results || [],
      top_municipalities: topMunicipalities,
      operator_performance: operatorPerf.results || [],
    });
  } catch (error) {
    console.error("Erro ao buscar métricas:", error);
    return c.json({ error: "Erro ao buscar métricas" }, 500);
  }
});

// Update alert status
adminRouter.post("/alerts/:id/status", authMiddleware, async (c) => {
  const db = c.env.DB;
  const currentUser = c.get("user");
  const alertId = c.req.param("id");
  
  try {
    const body = await c.req.json();
    const { status, resolutionNotes } = body;
    
    if (!status) {
      return c.json({ error: "Status é obrigatório" }, 400);
    }
    
    if (!["pending", "in_progress", "resolved"].includes(status)) {
      return c.json({ error: "Status inválido" }, 400);
    }
    
    // Verify the alert exists and user has permission
    const alert = await db
      .prepare("SELECT * FROM alerts WHERE id = ?")
      .bind(alertId)
      .first();
    
    if (!alert) {
      return c.json({ error: "Alerta não encontrado" }, 404);
    }
    
    // Municipal admins can only update alerts from their municipality
    if (currentUser.role === "municipal_admin" && alert.municipality_id !== currentUser.municipality_id) {
      return c.json({ error: "Você não tem permissão para atualizar este alerta" }, 403);
    }
    
    // Update status
    let updateQuery = "UPDATE alerts SET status = ?, updated_at = CURRENT_TIMESTAMP";
    const params: any[] = [status];
    
    if (status === "resolved") {
      updateQuery += ", resolved_at = CURRENT_TIMESTAMP, resolution_notes = ?";
      params.push(resolutionNotes || null);
    }
    
    updateQuery += " WHERE id = ?";
    params.push(alertId);
    
    await db.prepare(updateQuery).bind(...params).run();
    
    await logAudit(c, "alert_status_updated", `Alert ${alertId} status changed to ${status}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar status do alerta:", error);
    return c.json({ error: "Erro ao atualizar status do alerta" }, 500);
  }
});

export default adminRouter;

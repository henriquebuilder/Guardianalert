/**
 * Rotas `/api/user/*`: registo, login, logout e perfil de sessão para utilizadores finais (JWT em cookies httpOnly).
 *
 * @module worker/userAuthOwn
 */
import { Hono } from "hono";
import type { Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { hash, compare } from "bcryptjs";
import { sign, verify } from "jsonwebtoken";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import { checkRateLimit, recordLoginAttempt, validatePassword, logAudit } from "./auth";

/** Payload JWT de access para utilizadores da app (não admin). */
interface UserAppAccessPayload {
  id: string;
  type: string;
  email?: string;
  iat?: number;
  exp?: number;
}

type UserWorkerContext = Context<{ Bindings: Env }>;

const userAuthRouter = new Hono<{ Bindings: Env }>();

const USER_COOKIE_NAME = "user_session";
const USER_REFRESH_COOKIE_NAME = "user_refresh_token";
const ACCESS_TOKEN_EXPIRY = 60 * 60; // 1 hour
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days

/** Define cookie httpOnly do access token do utilizador da app. */
function setUserAuthCookie(c: UserWorkerContext, token: string) {
  setCookie(c, USER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict" as const,
    path: "/",
    maxAge: ACCESS_TOKEN_EXPIRY,
  });
}

/** Define cookie do refresh token do utilizador da app. */
function setUserRefreshCookie(c: UserWorkerContext, token: string) {
  setCookie(c, USER_REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict" as const,
    path: "/",
    maxAge: REFRESH_TOKEN_EXPIRY,
  });
}

/** Remove cookies de sessão do utilizador da app. */
function clearUserAuthCookies(c: UserWorkerContext) {
  deleteCookie(c, USER_COOKIE_NAME, { path: "/" });
  deleteCookie(c, USER_REFRESH_COOKIE_NAME, { path: "/" });
}

// Signup schema
const signupSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
  full_name: z.string().min(1, "Nome completo é obrigatório"),
});

// Login schema
const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

// Signup endpoint
userAuthRouter.post("/signup", zValidator("json", signupSchema), async (c) => {
  try {
    const { email, password, full_name } = c.req.valid("json");
    const db = c.env.DB;
    const jwtSecret = c.env.JWT_SECRET;

    if (!jwtSecret) {
      return c.json({ error: "Configuração do servidor incorreta" }, 500);
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return c.json({ error: passwordValidation.errors[0] }, 400);
    }

    // Check if user already exists
    const existingUser = await db
      .prepare("SELECT id FROM users WHERE email = ?")
      .bind(email.toLowerCase())
      .first();

    if (existingUser) {
      return c.json({ error: "E-mail já cadastrado" }, 400);
    }

    // Hash password
    const passwordHash = await hash(password, 12);

    // Create trial period (7 days)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    // Generate unique ID
    const userId = crypto.randomUUID();

    // Create user
    await db
      .prepare(
        `INSERT INTO users (
          id, email, google_sub, password_hash, full_name, 
          subscription_status, trial_ends_at, 
          email_verified, is_active, 
          created_at, updated_at, last_login_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      )
      .bind(
        userId,
        email.toLowerCase(),
        `email:${userId}`, // Placeholder for google_sub (required column from old schema)
        passwordHash,
        full_name,
        "trial",
        trialEndsAt.toISOString(),
        1, // Email verified immediately (can add verification later)
        1
      )
      .run();

    // Generate tokens
    const accessToken = sign(
      { id: userId, email: email.toLowerCase(), type: "access" },
      jwtSecret,
      { expiresIn: "1h" }
    );

    const refreshToken = sign(
      { id: userId, type: "refresh" },
      jwtSecret,
      { expiresIn: "7d" }
    );

    // Set cookies
    setUserAuthCookie(c, accessToken);
    setUserRefreshCookie(c, refreshToken);

    // Log audit
    await logAudit(c, "user_signup", `User signed up: ${email}`);

    return c.json({
      success: true,
      user: {
        id: userId,
        email: email.toLowerCase(),
        full_name,
        subscription: {
          status: "trial",
          expires_at: trialEndsAt.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("[USER SIGNUP] Error:", error);
    return c.json({ error: "Erro ao criar conta" }, 500);
  }
});

// Login endpoint
userAuthRouter.post("/login", zValidator("json", loginSchema), async (c) => {
  try {
    const { email, password } = c.req.valid("json");
    const db = c.env.DB;
    const jwtSecret = c.env.JWT_SECRET;

    if (!jwtSecret) {
      return c.json({ error: "Configuração do servidor incorreta" }, 500);
    }

    // Check rate limiting
    const rateLimitCheck = await checkRateLimit(c, email);
    if (!rateLimitCheck.allowed) {
      return c.json(
        { error: `Muitas tentativas de login. Tente novamente em ${rateLimitCheck.lockoutMinutes} minutos.` },
        429
      );
    }

    // Get user
    const user = await db
      .prepare("SELECT * FROM users WHERE email = ?")
      .bind(email.toLowerCase())
      .first();

    if (!user || !user.password_hash) {
      await recordLoginAttempt(c, email, false);
      return c.json({ error: "E-mail ou senha incorretos" }, 401);
    }

    // Verify password
    const passwordValid = await compare(password, user.password_hash as string);

    if (!passwordValid) {
      await recordLoginAttempt(c, email, false);
      return c.json({ error: "E-mail ou senha incorretos" }, 401);
    }

    // Check if user is active
    if (!user.is_active) {
      return c.json({ error: "Conta desativada" }, 403);
    }

    // Record successful login
    await recordLoginAttempt(c, email, true);

    // Update last login
    await db
      .prepare("UPDATE users SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(user.id)
      .run();

    // Check subscription status
    const now = new Date();
    let subscriptionValid = false;
    let currentStatus = user.subscription_status as string;

    if (currentStatus === "trial") {
      subscriptionValid = !!(user.trial_ends_at && new Date(user.trial_ends_at as string) > now);
    } else if (currentStatus === "active") {
      subscriptionValid = !!(user.subscription_expires_at && new Date(user.subscription_expires_at as string) > now);
    }

    // Auto-expire if needed
    if (!subscriptionValid && (currentStatus === "trial" || currentStatus === "active")) {
      await db
        .prepare("UPDATE users SET subscription_status = 'expired', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(user.id)
        .run();
      currentStatus = "expired";
    }

    // Generate tokens
    const accessToken = sign(
      { id: user.id, email: user.email, type: "access" },
      jwtSecret,
      { expiresIn: "1h" }
    );

    const refreshToken = sign(
      { id: user.id, type: "refresh" },
      jwtSecret,
      { expiresIn: "7d" }
    );

    // Set cookies
    setUserAuthCookie(c, accessToken);
    setUserRefreshCookie(c, refreshToken);

    // Log audit
    await logAudit(c, "user_login", `User logged in: ${email}`);

    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        subscription: {
          status: currentStatus,
          expires_at: currentStatus === "trial" ? user.trial_ends_at : user.subscription_expires_at,
          amount: user.subscription_amount,
          started_at: user.subscription_started_at,
        },
      },
    });
  } catch (error) {
    console.error("[USER LOGIN] Error:", error);
    return c.json({ error: "Erro ao fazer login" }, 500);
  }
});

// Logout endpoint
userAuthRouter.post("/logout", async (c) => {
  try {
    clearUserAuthCookies(c);
    return c.json({ success: true });
  } catch (error) {
    console.error("[USER LOGOUT] Error:", error);
    return c.json({ error: "Erro ao fazer logout" }, 500);
  }
});

// Get current user endpoint
userAuthRouter.get("/me", async (c) => {
  try {
    const token = getCookie(c, USER_COOKIE_NAME);
    const jwtSecret = c.env.JWT_SECRET;
    const db = c.env.DB;

    if (!token || !jwtSecret) {
      return c.json({ error: "Não autenticado" }, 401);
    }

    // Verify token
    let decoded: UserAppAccessPayload;
    try {
      decoded = verify(token, jwtSecret) as UserAppAccessPayload;
    } catch {
      return c.json({ error: "Token inválido" }, 401);
    }

    if (!decoded || decoded.type !== "access") {
      return c.json({ error: "Token inválido" }, 401);
    }

    // Get user from database
    const user = await db
      .prepare("SELECT * FROM users WHERE id = ?")
      .bind(decoded.id)
      .first();

    if (!user) {
      return c.json({ error: "Usuário não encontrado" }, 404);
    }

    // Check subscription status
    const now = new Date();
    let subscriptionValid = false;
    let currentStatus = user.subscription_status as string;

    if (currentStatus === "trial") {
      subscriptionValid = !!(user.trial_ends_at && new Date(user.trial_ends_at as string) > now);
    } else if (currentStatus === "active") {
      subscriptionValid = !!(user.subscription_expires_at && new Date(user.subscription_expires_at as string) > now);
    }

    // Auto-expire if needed
    if (!subscriptionValid && (currentStatus === "trial" || currentStatus === "active")) {
      await db
        .prepare("UPDATE users SET subscription_status = 'expired', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(user.id)
        .run();
      currentStatus = "expired";
    }

    return c.json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      subscription: {
        status: currentStatus,
        expires_at: currentStatus === "trial" ? user.trial_ends_at : user.subscription_expires_at,
        amount: user.subscription_amount,
        started_at: user.subscription_started_at,
      },
    });
  } catch (error) {
    console.error("[USER ME] Error:", error);
    return c.json({ error: "Não autenticado" }, 401);
  }
});

export default userAuthRouter;

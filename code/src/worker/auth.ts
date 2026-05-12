import { Context } from "hono";
import { verify, sign } from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { randomBytes } from "crypto";

/**
 * Utilitários de autenticação administrativa: cookies httpOnly, CSRF, JWT, rate limit e auditoria.
 *
 * @module worker/auth
 */

export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
  municipality_id: number | null;
}

export interface AuthContext extends Context {
  user?: AuthUser;
}

// Cookie configuration for security
const COOKIE_NAME = "admin_session";
const REFRESH_COOKIE_NAME = "refresh_token";
const CSRF_COOKIE_NAME = "csrf_token";
const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes (shorter for security)
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Opções de cookie com `httpOnly`, `secure`, `sameSite: Strict` e `maxAge` em segundos.
 *
 * @param maxAge - Tempo de vida do cookie em segundos.
 * @returns Objeto passado a `setCookie` do Hono.
 */
export function getSecureCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: true, // Always use secure in production (Cloudflare Workers always HTTPS)
    sameSite: "Strict" as const,
    path: "/",
    maxAge,
  };
}

/**
 * Define o cookie do access token administrativo (`admin_session`).
 *
 * @param c - Contexto Hono.
 * @param token - JWT assinado (curta duração).
 */
export function setAuthCookie(c: Context, token: string) {
  setCookie(c, COOKIE_NAME, token, getSecureCookieOptions(ACCESS_TOKEN_EXPIRY));
}

/**
 * Define o cookie do refresh token (`refresh_token`).
 *
 * @param c - Contexto Hono.
 * @param token - JWT tipo refresh.
 */
export function setRefreshCookie(c: Context, token: string) {
  setCookie(c, "refresh_token", token, getSecureCookieOptions(REFRESH_TOKEN_EXPIRY));
}

/**
 * Remove cookies de sessão admin, refresh e CSRF.
 *
 * @param c - Contexto Hono.
 */
export function clearAuthCookies(c: Context) {
  deleteCookie(c, COOKIE_NAME, { path: "/" });
  deleteCookie(c, REFRESH_COOKIE_NAME, { path: "/" });
  deleteCookie(c, CSRF_COOKIE_NAME, { path: "/" });
}

/**
 * Gera token hexadecimal para proteção CSRF (32 bytes).
 *
 * @returns String hex de 64 caracteres.
 */
export function generateCSRFToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Grava o CSRF em cookie **não** httpOnly para o cliente enviar no header `X-CSRF-Token`.
 *
 * @param c - Contexto Hono.
 * @param token - Valor retornado por {@link generateCSRFToken}.
 */
export function setCSRFCookie(c: Context, token: string) {
  setCookie(c, CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be readable by JS to include in requests
    secure: true,
    sameSite: "Strict" as const,
    path: "/",
    maxAge: ACCESS_TOKEN_EXPIRY,
  });
}

/**
 * Compara cookie CSRF com o header `X-CSRF-Token`.
 *
 * @param c - Contexto Hono.
 * @returns `true` se coincidirem e existirem ambos.
 */
export function verifyCSRFToken(c: Context): boolean {
  const cookieToken = getCookie(c, CSRF_COOKIE_NAME);
  const headerToken = c.req.header("X-CSRF-Token");
  
  if (!cookieToken || !headerToken) {
    return false;
  }
  
  return cookieToken === headerToken;
}

/**
 * Emite JWT de refresh (7 dias) com `jti` aleatório.
 *
 * @param userId - ID do admin em `admin_users`.
 * @param jwtSecret - Segredo compartilhado com access token.
 * @returns JWT string.
 */
export function generateRefreshToken(userId: number, jwtSecret: string): string {
  return sign(
    { id: userId, type: "refresh", jti: randomBytes(16).toString("hex") },
    jwtSecret,
    { expiresIn: "7d" }
  );
}

/**
 * Valida cookie `refresh_token`, confere tipo `refresh` e devolve novo access token + dados do utilizador.
 *
 * @param c - Contexto Hono com `JWT_SECRET` e `DB`.
 * @returns Par `{ token, user }` ou `null` se inválido/expirado.
 */
export async function refreshAccessToken(c: Context): Promise<{ token: string; user: AuthUser } | null> {
  const refreshToken = getCookie(c, REFRESH_COOKIE_NAME);
  
  if (!refreshToken) {
    return null;
  }
  
  try {
    const jwtSecret = c.env.JWT_SECRET;
    if (!jwtSecret) return null;
    
    const decoded = verify(refreshToken, jwtSecret) as { id: number; type: string } & JwtPayload;
    
    if (decoded.type !== "refresh") {
      return null;
    }
    
    // Verify user still exists and is active
    const db = c.env.DB;
    const user = await db
      .prepare("SELECT id, email, full_name, role, municipality_id, is_active FROM admin_users WHERE id = ?")
      .bind(decoded.id)
      .first();
    
    if (!user || !user.is_active) {
      return null;
    }
    
    const authUser: AuthUser = {
      id: user.id as number,
      email: user.email as string,
      full_name: user.full_name as string,
      role: user.role as string,
      municipality_id: user.municipality_id as number | null,
    };
    
    // Generate new access token
    const newToken = sign(authUser, jwtSecret, { expiresIn: "15m" });
    
    return { token: newToken, user: authUser };
  } catch {
    return null;
  }
}

/**
 * Middleware: lê JWT do cookie `admin_session` (ou header `Authorization: Bearer`), valida e define `c.set("user", …)`.
 *
 * @param c - Contexto Hono.
 * @param next - Próximo handler.
 */
export async function authMiddleware(c: Context, next: () => Promise<void>) {
  // Read token from httpOnly cookie (primary) or fallback to Authorization header for migration
  const cookieToken = getCookie(c, COOKIE_NAME);
  const authHeader = c.req.header("Authorization");
  
  const token = cookieToken || (authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null);
  
  if (!token) {
    return c.json({ error: "Não autorizado" }, 401);
  }
  
  try {
    const jwtSecret = c.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET não configurado");
      return c.json({ error: "Erro de configuração do servidor" }, 500);
    }
    
    const decoded = verify(token, jwtSecret) as AuthUser & JwtPayload;
    
    // Verify user still exists and is active
    const db = c.env.DB;
    const user = await db
      .prepare("SELECT id, email, full_name, role, municipality_id, is_active FROM admin_users WHERE id = ?")
      .bind(decoded.id)
      .first();
    
    if (!user || !user.is_active) {
      return c.json({ error: "Usuário inativo ou não encontrado" }, 401);
    }
    
    // Attach user to context
    const authUser: AuthUser = {
      id: user.id as number,
      email: user.email as string,
      full_name: user.full_name as string,
      role: user.role as string,
      municipality_id: user.municipality_id as number | null,
    };
    c.set("user", authUser);
    
    await next();
  } catch (error) {
    console.error("Erro na verificação do token:", error);
    return c.json({ error: "Token inválido" }, 401);
  }
}

/**
 * Fábrica de middleware que exige uma das `allowedRoles` no utilizador autenticado.
 *
 * @param allowedRoles - Lista de roles permitidas (ex.: `super_admin`).
 * @returns Middleware Hono assíncrono.
 */
export function requireRole(...allowedRoles: string[]) {
  return async (c: Context, next: () => Promise<void>) => {
    const user = c.get("user") as AuthUser | undefined;
    
    if (!user) {
      return c.json({ error: "Não autorizado" }, 401);
    }
    
    if (!allowedRoles.includes(user.role)) {
      return c.json({ error: "Acesso negado - permissão insuficiente" }, 403);
    }
    
    await next();
  };
}

/**
 * Regista entrada na tabela `audit_logs` com IP, user-agent e metadados JSON.
 *
 * @param c - Contexto (opcionalmente com `user` admin).
 * @param action - Identificador curto da ação.
 * @param details - Texto legível ou mensagem curta.
 * @param severity - Nível de severidade.
 * @param metadata - Objeto serializado no JSON de detalhe.
 */
export async function logAudit(
  c: Context,
  action: string,
  details?: string,
  severity: "info" | "warning" | "critical" = "info",
  metadata?: Record<string, unknown>
) {
  const user = c.get("user") as AuthUser | undefined;
  const db = c.env.DB;
  
  const ip = c.req.header("CF-Connecting-IP") || c.req.header("X-Forwarded-For") || "unknown";
  const userAgent = c.req.header("User-Agent") || "unknown";
  const country = c.req.header("CF-IPCountry") || "unknown";
  const requestId = c.req.header("CF-Ray") || randomBytes(8).toString("hex");
  const method = c.req.method;
  const path = c.req.path;
  
  // Build enhanced details JSON
  const enhancedDetails = JSON.stringify({
    message: details || null,
    severity,
    request: { method, path, requestId },
    geo: { country },
    metadata: metadata || null,
    timestamp: new Date().toISOString(),
  });
  
  await db
    .prepare(
      `INSERT INTO audit_logs (user_id, action, details, ip_address, user_agent, updated_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    )
    .bind(
      user?.id || null,
      action,
      enhancedDetails,
      ip,
      userAgent
    )
    .run();
}

const publicRateLimits = new Map<string, { count: number; resetAt: number }>();

/**
 * Rate limit em memória por IP + chave de rota (adequado a Workers com tráfego moderado).
 *
 * @param c - Contexto (headers `CF-Connecting-IP` / `X-Forwarded-For`).
 * @param routeKey - Identificador lógico (ex.: `alerts`).
 * @param maxRequests - Máximo de pedidos na janela.
 * @param windowSeconds - Duração da janela em segundos.
 * @returns `{ allowed, remaining, resetIn }`.
 */
export async function checkPublicRateLimit(
  c: Context,
  routeKey: string,
  maxRequests: number = 30,
  windowSeconds: number = 60
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const ip = c.req.header("CF-Connecting-IP") || c.req.header("X-Forwarded-For") || "unknown";
  const key = `${routeKey}:${ip}`;
  const now = Date.now();
  
  let entry = publicRateLimits.get(key);
  
  // Reset if window expired
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowSeconds * 1000 };
  }
  
  entry.count++;
  publicRateLimits.set(key, entry);
  
  // Cleanup old entries periodically
  if (publicRateLimits.size > 10000) {
    for (const [k, v] of publicRateLimits.entries()) {
      if (now > v.resetAt) publicRateLimits.delete(k);
    }
  }
  
  const remaining = Math.max(0, maxRequests - entry.count);
  const resetIn = Math.ceil((entry.resetAt - now) / 1000);
  
  return {
    allowed: entry.count <= maxRequests,
    remaining,
    resetIn,
  };
}

/**
 * Heurísticas anti-bot para criação de alertas (honeypot, tempo do pedido, user-agent).
 *
 * @param c - Contexto da requisição.
 * @param body - Corpo parcial com `timestamp` e `honeypot`.
 * @returns `{ valid: true }` ou `{ valid: false, reason }`.
 */
export function validateAlertRequest(
  c: Context,
  body: { timestamp?: number; honeypot?: string }
): { valid: boolean; reason?: string } {
  // Check honeypot field (should be empty)
  if (body.honeypot && body.honeypot.length > 0) {
    return { valid: false, reason: "bot_detected_honeypot" };
  }
  
  // Check timestamp (request should be made within reasonable time)
  if (body.timestamp) {
    const now = Date.now();
    const requestTime = body.timestamp;
    const timeDiff = now - requestTime;
    
    // If form was submitted in less than 1 second, likely a bot
    if (timeDiff < 1000) {
      return { valid: false, reason: "bot_detected_timing" };
    }
    
    // If timestamp is more than 5 minutes old, reject
    if (timeDiff > 5 * 60 * 1000) {
      return { valid: false, reason: "request_expired" };
    }
  }
  
  // Check user agent
  const userAgent = c.req.header("User-Agent") || "";
  if (!userAgent || userAgent.length < 10) {
    return { valid: false, reason: "invalid_user_agent" };
  }
  
  // Block known bot user agents
  const botPatterns = /bot|crawler|spider|scraper|curl|wget|python|axios/i;
  if (botPatterns.test(userAgent)) {
    return { valid: false, reason: "bot_user_agent" };
  }
  
  return { valid: true };
}

/**
 * Exige header `X-CSRF-Token` alinhado ao cookie CSRF em métodos mutáveis (exceto login/setup).
 *
 * @param c - Contexto Hono.
 * @param next - Próximo handler.
 */
export async function csrfMiddleware(c: Context, next: () => Promise<void>) {
  // Only check for state-changing methods
  const method = c.req.method;
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    // Skip CSRF for login/setup (no cookie yet)
    const path = c.req.path;
    if (path.includes("/auth/login") || path.includes("/auth/setup")) {
      await next();
      return;
    }
    
    if (!verifyCSRFToken(c)) {
      await logAudit(c, "csrf_validation_failed", undefined, "warning");
      return c.json({ error: "Token CSRF inválido" }, 403);
    }
  }
  
  await next();
}

/**
 * Bloqueia login após falhas repetidas (email ou IP) numa janela de 15 minutos.
 *
 * @param c - Contexto com `DB`.
 * @param email - Email tentado no login.
 * @returns `allowed`, `remainingAttempts` e opcionalmente `lockoutMinutes` quando bloqueado.
 */
export async function checkRateLimit(
  c: Context,
  email: string
): Promise<{ allowed: boolean; remainingAttempts?: number; lockoutMinutes?: number }> {
  const db = c.env.DB;
  const ip = c.req.header("CF-Connecting-IP") || c.req.header("X-Forwarded-For") || "unknown";
  
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_MINUTES = 15;
  const WINDOW_MINUTES = 15;
  
  // Count failed attempts in the last window
  const failedAttempts = await db
    .prepare(
      `SELECT COUNT(*) as count 
       FROM login_attempts 
       WHERE (email = ? OR ip_address = ?) 
       AND is_successful = 0 
       AND attempt_at > datetime('now', '-${WINDOW_MINUTES} minutes')`
    )
    .bind(email, ip)
    .first();
  
  const count = (failedAttempts?.count as number) || 0;
  
  if (count >= MAX_ATTEMPTS) {
    return { 
      allowed: false, 
      lockoutMinutes: LOCKOUT_MINUTES,
      remainingAttempts: 0
    };
  }
  
  return { 
    allowed: true, 
    remainingAttempts: MAX_ATTEMPTS - count 
  };
}

/**
 * Insere linha em `login_attempts` e remove registos com mais de 24 horas.
 *
 * @param c - Contexto com `DB`.
 * @param email - Email associado à tentativa.
 * @param isSuccessful - Se a autenticação foi bem-sucedida.
 */
export async function recordLoginAttempt(
  c: Context,
  email: string,
  isSuccessful: boolean
) {
  const db = c.env.DB;
  const ip = c.req.header("CF-Connecting-IP") || c.req.header("X-Forwarded-For") || "unknown";
  
  await db
    .prepare(
      `INSERT INTO login_attempts (email, ip_address, is_successful, attempt_at, updated_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    )
    .bind(email, ip, isSuccessful ? 1 : 0)
    .run();
  
  // Clean up old attempts (older than 24 hours)
  await db
    .prepare(`DELETE FROM login_attempts WHERE attempt_at < datetime('now', '-24 hours')`)
    .run();
}

/**
 * Valida política de senha forte (12+ caracteres, maiúsculas, minúsculas, dígitos, especiais).
 *
 * @param password - Senha em texto plano.
 * @returns `{ valid, errors }`.
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 12) {
    errors.push("Senha deve ter no mínimo 12 caracteres");
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("Senha deve conter pelo menos uma letra maiúscula");
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("Senha deve conter pelo menos uma letra minúscula");
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push("Senha deve conter pelo menos um número");
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("Senha deve conter pelo menos um caractere especial");
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

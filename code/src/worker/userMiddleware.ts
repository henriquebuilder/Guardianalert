import type { Context } from "hono";
import { verify } from "jsonwebtoken";
import { getCookie } from "hono/cookie";

const USER_COOKIE_NAME = "user_session";

/** Payload mínimo esperado no JWT de sessão do usuário final (`type: "access"`). */
interface UserAccessJwtPayload {
  id: string;
  type: string;
  email?: string;
  iat?: number;
  exp?: number;
}

export interface UserContext {
  id: string;
  email: string;
  subscription_status: string;
  subscription_expires_at: string | null;
}

/**
 * Valida o cookie `user_session`, verifica o JWT com `JWT_SECRET` e carrega o usuário no D1.
 * Preenche `userId`, `userEmail`, `subscriptionStatus` e `subscriptionExpires` no contexto Hono.
 *
 * @param c - Contexto Hono (bindings: `DB`, `JWT_SECRET`).
 * @param next - Próximo handler na cadeia.
 * @returns JSON 401 em falha de token/segredo/usuário; caso contrário delega a `next`.
 */
export async function userAuthMiddleware(c: Context, next: () => Promise<void>) {
  const token = getCookie(c, USER_COOKIE_NAME);
  const jwtSecret = c.env.JWT_SECRET;

  if (!token || !jwtSecret) {
    return c.json({ error: "Não autenticado" }, 401);
  }

  try {
    const decoded = verify(token, jwtSecret) as UserAccessJwtPayload;

    if (!decoded || decoded.type !== "access" || !decoded.id) {
      return c.json({ error: "Token inválido" }, 401);
    }

    const db = c.env.DB;
    const user = await db
      .prepare(
        "SELECT id, email, subscription_status, subscription_expires_at, trial_ends_at FROM users WHERE id = ? AND is_active = 1"
      )
      .bind(decoded.id)
      .first();

    if (!user) {
      return c.json({ error: "Usuário não encontrado ou inativo" }, 401);
    }

    const now = new Date();
    let currentStatus = user.subscription_status as string;

    if (currentStatus === "trial") {
      const trialValid = !!(user.trial_ends_at && new Date(user.trial_ends_at as string) > now);
      if (!trialValid) {
        await db
          .prepare(
            "UPDATE users SET subscription_status = 'expired', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
          )
          .bind(user.id)
          .run();
        currentStatus = "expired";
      }
    } else if (currentStatus === "active") {
      const subValid = !!(
        user.subscription_expires_at && new Date(user.subscription_expires_at as string) > now
      );
      if (!subValid) {
        await db
          .prepare(
            "UPDATE users SET subscription_status = 'expired', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
          )
          .bind(user.id)
          .run();
        currentStatus = "expired";
      }
    }

    c.set("userId", user.id as string);
    c.set("userEmail", user.email as string);
    c.set("subscriptionStatus", currentStatus);
    c.set(
      "subscriptionExpires",
      currentStatus === "trial" ? user.trial_ends_at : user.subscription_expires_at
    );

    await next();
  } catch (error) {
    console.error("[USER AUTH] Error:", error);
    return c.json({ error: "Token inválido ou expirado" }, 401);
  }
}

/**
 * Bloqueia rotas para usuários com assinatura/trial expirados (`subscriptionStatus === "expired"`).
 * Deve rodar depois de {@link userAuthMiddleware}.
 *
 * @param c - Contexto Hono com variáveis de utilizador já definidas.
 * @param next - Próximo handler.
 * @returns JSON 403 se expirado; caso contrário chama `next`.
 */
export async function requireActiveSubscription(c: Context, next: () => Promise<void>) {
  const subscriptionStatus = c.get("subscriptionStatus") as string;

  if (subscriptionStatus === "expired") {
    return c.json(
      {
        error: "Assinatura expirada. Renove sua assinatura para continuar usando o GuardianAlert.",
        subscription_status: "expired",
      },
      403
    );
  }

  await next();
}

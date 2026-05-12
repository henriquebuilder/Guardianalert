import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware, logAudit, AuthUser } from "./auth";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

/**
 * Endpoints `/api/mfa/*` para configurar e confirmar TOTP em contas administrativas.
 *
 * @module worker/mfa
 */
type Variables = {
  user: AuthUser;
};

const mfaRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// Generate MFA secret and QR code
mfaRouter.post("/setup", authMiddleware, async (c) => {
  const user = c.get("user");
  const db = c.env.DB;
  
  try {
    // Check if MFA is already enabled
    const adminUser = await db
      .prepare("SELECT mfa_enabled FROM admin_users WHERE id = ?")
      .bind(user.id)
      .first();
    
    if (adminUser?.mfa_enabled) {
      return c.json({ error: "MFA já está ativado" }, 400);
    }
    
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `GuardianAlert (${user.email})`,
      issuer: "GuardianAlert",
    });
    
    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);
    
    // Store secret temporarily (will be confirmed when user verifies the code)
    await db
      .prepare("UPDATE admin_users SET mfa_secret = ? WHERE id = ?")
      .bind(secret.base32, user.id)
      .run();
    
    await logAudit(c, "mfa_setup_started", `User ID: ${user.id}`);
    
    return c.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
    });
  } catch (error) {
    console.error("Erro ao configurar MFA:", error);
    return c.json({ error: "Erro ao configurar MFA" }, 500);
  }
});

// Verify and enable MFA
mfaRouter.post(
  "/verify",
  authMiddleware,
  zValidator("json", z.object({ code: z.string().min(6).max(6) })),
  async (c) => {
    const user = c.get("user");
    const db = c.env.DB;
    const { code } = c.req.valid("json");
    
    try {
      // Get user's secret
      const adminUser = await db
        .prepare("SELECT mfa_secret, mfa_enabled FROM admin_users WHERE id = ?")
        .bind(user.id)
        .first();
      
      if (!adminUser?.mfa_secret) {
        return c.json({ error: "MFA não foi configurado" }, 400);
      }
      
      // Verify the code
      const verified = speakeasy.totp.verify({
        secret: adminUser.mfa_secret as string,
        encoding: 'base32',
        token: code,
        window: 2,
      });
      
      if (!verified) {
        return c.json({ error: "Código inválido" }, 401);
      }
      
      // Enable MFA
      await db
        .prepare("UPDATE admin_users SET mfa_enabled = 1 WHERE id = ?")
        .bind(user.id)
        .run();
      
      await logAudit(c, "mfa_enabled", `User ID: ${user.id}`);
      
      return c.json({ success: true, message: "MFA ativado com sucesso" });
    } catch (error) {
      console.error("Erro ao verificar MFA:", error);
      return c.json({ error: "Erro ao verificar código" }, 500);
    }
  }
);

// Disable MFA
mfaRouter.post(
  "/disable",
  authMiddleware,
  zValidator("json", z.object({ code: z.string().min(6).max(6) })),
  async (c) => {
    const user = c.get("user");
    const db = c.env.DB;
    const { code } = c.req.valid("json");
    
    try {
      // Get user's secret
      const adminUser = await db
        .prepare("SELECT mfa_secret, mfa_enabled FROM admin_users WHERE id = ?")
        .bind(user.id)
        .first();
      
      if (!adminUser?.mfa_enabled) {
        return c.json({ error: "MFA não está ativado" }, 400);
      }
      
      // Verify the code before disabling
      const verified = speakeasy.totp.verify({
        secret: adminUser.mfa_secret as string,
        encoding: 'base32',
        token: code,
        window: 2,
      });
      
      if (!verified) {
        return c.json({ error: "Código inválido" }, 401);
      }
      
      // Disable MFA
      await db
        .prepare("UPDATE admin_users SET mfa_enabled = 0, mfa_secret = NULL WHERE id = ?")
        .bind(user.id)
        .run();
      
      await logAudit(c, "mfa_disabled", `User ID: ${user.id}`);
      
      return c.json({ success: true, message: "MFA desativado com sucesso" });
    } catch (error) {
      console.error("Erro ao desativar MFA:", error);
      return c.json({ error: "Erro ao desativar MFA" }, 500);
    }
  }
);

// Get MFA status
mfaRouter.get("/status", authMiddleware, async (c) => {
  const user = c.get("user");
  const db = c.env.DB;
  
  try {
    const adminUser = await db
      .prepare("SELECT mfa_enabled FROM admin_users WHERE id = ?")
      .bind(user.id)
      .first();
    
    return c.json({
      mfa_enabled: adminUser?.mfa_enabled === 1,
    });
  } catch (error) {
    console.error("Erro ao verificar status do MFA:", error);
    return c.json({ error: "Erro ao verificar status" }, 500);
  }
});

export default mfaRouter;

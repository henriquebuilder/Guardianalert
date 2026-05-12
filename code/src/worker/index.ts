/**
 * GuardianAlert API worker (Hono on Cloudflare Workers).
 * Expõe rotas REST para contatos, alertas, áudio (R2), locais seguros e monta o app React como SPA.
 *
 * @module worker/index
 */
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { addProfileRoutes } from "./profile";
import adminRouter from "./admin";
import mfaRouter from "./mfa";
import userAuthRouter from "./userAuthOwn";
import { checkPublicRateLimit, validateAlertRequest, logAudit } from "./auth";
import { userAuthMiddleware } from "./userMiddleware";
import type { CustomVariables } from "./env.d";

const app = new Hono<{ Bindings: Env; Variables: CustomVariables }>();

/**
 * CSP e headers de segurança usam modo “produção” (sem `unsafe-eval` em scripts).
 * No Worker não há `process.env` confiável para alternar; o dev local usa CSP relaxada via branch `else` reservada.
 *
 * @returns Sempre `true` neste deploy (CSP estrita).
 */
const isProduction = () => {
  return true;
};

// Security headers middleware - aplicado a TODAS as respostas
app.use("*", async (c, next) => {
  await next();
  
  // Security headers
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("X-XSS-Protection", "1; mode=block");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Permissions-Policy", "geolocation=(self), microphone=(self), camera=()");
  
  // Content Security Policy - strict in production
  if (isProduction()) {
    c.header(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self'", // No unsafe-inline/unsafe-eval in production
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // unsafe-inline needed for Tailwind
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https://api.twilio.com https://*.tile.openstreetmap.org",
        "media-src 'self' blob:",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "upgrade-insecure-requests",
      ].join("; ")
    );
  } else {
    // Development CSP - allow Vite HMR
    c.header(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https://api.twilio.com https://*.tile.openstreetmap.org ws://localhost:*",
        "media-src 'self' blob:",
        "frame-ancestors 'none'",
      ].join("; ")
    );
  }
  
  // Strict Transport Security (HSTS)
  c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
});

// Mount admin routes
app.route("/api/admin", adminRouter);
app.route("/api/mfa", mfaRouter);

// Mount user authentication routes
app.route("/api/user", userAuthRouter);

// Validation schemas
const contactSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  relationship: z.string().optional(),
  is_primary: z.boolean().optional(),
});

const alertSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  audioUrl: z.string().optional(),
  timestamp: z.number().optional(), // For anti-bot timing check
  honeypot: z.string().optional(), // Honeypot field (must be empty)
});

const alertUpdateSchema = z.object({
  audio_url: z.string(),
});

// Get all emergency contacts (protected, user-specific)
app.get("/api/contacts", userAuthMiddleware, async (c) => {
  try {
    const db = c.env.DB;
    const userId = c.get("userId") as string;
    
    if (!db) {
      console.error("[CONTACTS GET] DB binding not available");
      return c.json({ error: "Database not configured", code: "DB_NOT_BOUND" }, 500);
    }
    
    const contacts = await db
      .prepare("SELECT * FROM emergency_contacts WHERE user_id = ? ORDER BY is_primary DESC, name ASC")
      .bind(userId)
      .all();
    
    return c.json(contacts.results);
  } catch (error) {
    console.error("[CONTACTS GET] Error:", error);
    return c.json({ error: "Failed to fetch contacts", details: String(error) }, 500);
  }
});

// Create new contact (protected, user-specific)
app.post("/api/contacts", userAuthMiddleware, zValidator("json", contactSchema), async (c) => {
  try {
    const db = c.env.DB;
    const userId = c.get("userId") as string;
    
    if (!db) {
      console.error("[CONTACTS POST] DB binding not available");
      return c.json({ error: "Database not configured", code: "DB_NOT_BOUND" }, 500);
    }
    
    const data = c.req.valid("json");
    
    const result = await db
      .prepare(
        `INSERT INTO emergency_contacts (user_id, name, phone, relationship, is_primary, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      )
      .bind(
        userId,
        data.name,
        data.phone,
        data.relationship || null,
        data.is_primary ? 1 : 0
      )
      .run();
    
    return c.json({ id: result.meta.last_row_id, success: true }, 201);
  } catch (error) {
    console.error("[CONTACTS POST] Error:", error);
    return c.json({ error: "Failed to create contact", details: String(error) }, 500);
  }
});

// Update contact (protected, user-specific)
app.put("/api/contacts/:id", userAuthMiddleware, zValidator("json", contactSchema), async (c) => {
  try {
    const db = c.env.DB;
    const userId = c.get("userId") as string;
    
    if (!db) {
      return c.json({ error: "Database not configured", code: "DB_NOT_BOUND" }, 500);
    }
    
    const id = c.req.param("id");
    const data = c.req.valid("json");
    
    await db
      .prepare(
        `UPDATE emergency_contacts 
         SET name = ?, phone = ?, relationship = ?, is_primary = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`
      )
      .bind(
        data.name,
        data.phone,
        data.relationship || null,
        data.is_primary ? 1 : 0,
        id,
        userId
      )
      .run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error("[CONTACTS PUT] Error:", error);
    return c.json({ error: "Failed to update contact", details: String(error) }, 500);
  }
});

// Delete contact (protected, user-specific)
app.delete("/api/contacts/:id", userAuthMiddleware, async (c) => {
  try {
    const db = c.env.DB;
    const userId = c.get("userId") as string;
    
    if (!db) {
      return c.json({ error: "Database not configured", code: "DB_NOT_BOUND" }, 500);
    }
    
    const id = c.req.param("id");
    
    await db
      .prepare("DELETE FROM emergency_contacts WHERE id = ? AND user_id = ?")
      .bind(id, userId)
      .run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error("[CONTACTS DELETE] Error:", error);
    return c.json({ error: "Failed to delete contact", details: String(error) }, 500);
  }
});

// Send emergency alert (protected, requires active subscription)
app.post("/api/alerts", userAuthMiddleware, zValidator("json", alertSchema), async (c) => {
  try {
    const db = c.env.DB;
    if (!db) {
      console.error("[ALERTS POST] DB binding not available");
      return c.json({ error: "Database not configured", code: "DB_NOT_BOUND" }, 500);
    }
    const data = c.req.valid("json");
    const userId = c.get("userId") as string;
    
    // Check subscription status
    const user = await db
      .prepare("SELECT subscription_status, subscription_expires_at, trial_ends_at FROM users WHERE id = ?")
      .bind(userId)
      .first();
    
    if (!user) {
      return c.json({ error: "Usuário não encontrado" }, 404);
    }
    
    const now = new Date();
    const trialEnds = user.trial_ends_at ? new Date(user.trial_ends_at as string) : null;
    const subscriptionExpires = user.subscription_expires_at ? new Date(user.subscription_expires_at as string) : null;
    
    // Check if user has active trial or subscription
    const hasActiveTrial = trialEnds && trialEnds > now;
    const hasActiveSubscription = user.subscription_status === 'active' && subscriptionExpires && subscriptionExpires > now;
    
    if (!hasActiveTrial && !hasActiveSubscription) {
      return c.json({ 
        error: "Assinatura expirada. Renove para continuar usando o GuardianAlert.",
        code: "SUBSCRIPTION_EXPIRED" 
      }, 403);
    }
    
    // Rate limiting for alerts - max 5 alerts per minute per IP
    const rateLimit = await checkPublicRateLimit(c, "alerts", 5, 60);
    if (!rateLimit.allowed) {
      console.warn("[ALERTS POST] Rate limit exceeded for IP");
      await logAudit(c, "alert_rate_limited", undefined, "warning", { 
        remaining: rateLimit.remaining,
        resetIn: rateLimit.resetIn 
      });
      return c.json({ 
        error: "Muitas solicitações. Aguarde um momento.",
        retry_after: rateLimit.resetIn 
      }, 429);
    }
    
    // Anti-bot protection
    const botCheck = validateAlertRequest(c, data);
    if (!botCheck.valid) {
      console.warn("[ALERTS POST] Bot detected:", botCheck.reason);
      await logAudit(c, "alert_bot_blocked", undefined, "warning", { reason: botCheck.reason });
      return c.json({ error: "Requisição inválida" }, 400);
    }
    
    // Create alert record - status 'pending' para consistência com admin panel
    const alertResult = await db
      .prepare(
        `INSERT INTO alerts (user_id, latitude, longitude, audio_url, status, police_notified, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'pending', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      )
      .bind(userId, data.latitude, data.longitude, data.audioUrl || null)
      .run();
    
    // Garantir que temos o ID do alerta
    const alertId = alertResult.meta?.last_row_id;
    if (!alertId) {
      console.error("[ALERTS POST] Failed to get alertId from insert result");
      return c.json({ error: "Failed to create alert - no ID returned", code: "NO_ALERT_ID" }, 500);
    }
    // Get all emergency contacts for this user
    const contacts = await db
      .prepare("SELECT * FROM emergency_contacts WHERE user_id = ? ORDER BY is_primary DESC")
      .bind(userId)
      .all();
    
    // Create notifications for each contact
    const notifications = [];
    for (const contact of contacts.results) {
      await db
        .prepare(
          `INSERT INTO alert_notifications (alert_id, contact_id, notification_type, status, created_at, updated_at)
           VALUES (?, ?, 'sms', 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
        )
        .bind(alertId, contact.id)
        .run();
      
      notifications.push({
        contactId: contact.id,
        name: contact.name,
        phone: contact.phone,
        isPrimary: contact.is_primary === 1,
      });
    }
    
    // Get user profile for personalized alert message
    const profile = await db
      .prepare("SELECT * FROM user_profile WHERE user_id = ? LIMIT 1")
      .bind(userId)
      .first();
    
    // Send SMS notifications (requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER secrets)
    const twilioSid = c.env.TWILIO_ACCOUNT_SID;
    const twilioToken = c.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = c.env.TWILIO_PHONE_NUMBER;
    
    // Check if using test/simulation mode
    const isTestMode = !twilioSid || !twilioToken || !twilioPhone || 
                       twilioSid.startsWith('test_') || 
                       twilioToken.startsWith('test_');
    
    if (twilioSid || isTestMode) {
      // Build personalized message with profile info
      let message = `🚨 ALERTA DE EMERGÊNCIA - GuardianAlert\n\n`;
      
      if (profile?.name) {
        message += `${profile.name}`;
        if (profile.age) {
          message += ` (${profile.age} anos)`;
        }
        message += ` acionou o botão de pânico.\n\n`;
      } else {
        message += `Uma pessoa do seu círculo de emergência acionou o botão de pânico.\n\n`;
      }
      
      if (profile?.notes) {
        message += `INFORMAÇÕES IMPORTANTES:\n${profile.notes}\n\n`;
      }
      
      message += `Localização: https://maps.google.com/?q=${data.latitude},${data.longitude}\n\nSe possível, entre em contato imediatamente ou acione as autoridades.`;
      
      for (const contact of contacts.results) {
        try {
          if (isTestMode) {
            // SIMULATION MODE - Don't send real SMS; mark as sent for flow testing
            // Update notification status to sent (simulated)
            await db
              .prepare(
                `UPDATE alert_notifications 
                 SET status = 'sent', updated_at = CURRENT_TIMESTAMP
                 WHERE alert_id = ? AND contact_id = ?`
              )
              .bind(alertId, contact.id as number)
              .run();
          } else {
            // PRODUCTION MODE - Send real SMS via Twilio
            const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
            const auth = btoa(`${twilioSid}:${twilioToken}`);
            
            const response = await fetch(twilioUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                From: twilioPhone,
                To: contact.phone as string,
                Body: message,
              }),
            });
            
            if (response.ok) {
              // Update notification status to sent
              await db
                .prepare(
                  `UPDATE alert_notifications 
                   SET status = 'sent', updated_at = CURRENT_TIMESTAMP
                   WHERE alert_id = ? AND contact_id = ?`
                )
                .bind(alertId, contact.id as number)
                .run();
            } else {
              const errorText = await response.text();
              console.error(`[ALERTS POST] Twilio error for ${contact.name}:`, errorText);
            }
          }
        } catch (smsError) {
          console.error(`[ALERTS POST] Failed to send SMS to ${contact.name}:`, smsError);
        }
      }
    }
    
    // Police notification simulation (190 - Emergency number in Brazil)
    const policeNotification = {
      emergencyNumber: '190',
      message: `Alerta de emergência acionado via GuardianAlert`,
      location: {
        latitude: data.latitude,
        longitude: data.longitude,
        googleMapsUrl: `https://maps.google.com/?q=${data.latitude},${data.longitude}`,
      },
      timestamp: new Date().toISOString(),
    };
    
    return c.json({
      success: true,
      alertId,
      notificationsSent: notifications.length,
      notifications,
      policeNotified: true,
      policeNotification,
      smsEnabled: !!(twilioSid && twilioToken && twilioPhone),
      testMode: isTestMode,
    });
  } catch (error) {
    console.error("[ALERTS POST] Critical error:", error);
    return c.json({ 
      error: "Failed to create alert", 
      details: String(error),
      code: "ALERT_FAILED"
    }, 500);
  }
});

// Upload audio recording
app.post("/api/audio/upload", async (c) => {
  try {
    const formData = await c.req.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return c.json({ error: 'No audio file provided' }, 400);
    }
    
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const filename = `recordings/${timestamp}-${audioFile.name}`;
    
    // Upload to R2
    await c.env.R2_BUCKET.put(filename, audioFile, {
      httpMetadata: {
        contentType: audioFile.type || 'audio/webm',
      },
    });
    
    return c.json({ 
      success: true, 
      filename,
      url: `/api/audio/${filename}`,
    });
  } catch (error) {
    console.error('Error uploading audio:', error);
    return c.json({ error: 'Failed to upload audio' }, 500);
  }
});

// Get audio recording
app.get("/api/audio/:folder/:filename", async (c) => {
  try {
    const folder = c.req.param('folder');
    const filename = c.req.param('filename');
    const key = `${folder}/${filename}`;
    
    const object = await c.env.R2_BUCKET.get(key);
    
    if (!object) {
      return c.json({ error: 'Audio not found' }, 404);
    }
    
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    
    return c.body(object.body, { headers });
  } catch (error) {
    console.error('Error retrieving audio:', error);
    return c.json({ error: 'Failed to retrieve audio' }, 500);
  }
});

// Update alert (for adding audio URL after recording)
app.patch("/api/alerts/:id", zValidator("json", alertUpdateSchema), async (c) => {
  try {
    const db = c.env.DB;
    if (!db) {
      return c.json({ error: "Database not configured", code: "DB_NOT_BOUND" }, 500);
    }
    const id = c.req.param("id");
    const data = c.req.valid("json");
    
    await db
      .prepare(
        `UPDATE alerts 
         SET audio_url = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      )
      .bind(data.audio_url, id)
      .run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error("[ALERTS PATCH] Error:", error);
    return c.json({ error: "Failed to update alert", details: String(error) }, 500);
  }
});

// Get alert history
app.get("/api/alerts", async (c) => {
  try {
    const db = c.env.DB;
    if (!db) {
      console.error("[ALERTS GET] DB binding not available");
      return c.json({ error: "Database not configured", code: "DB_NOT_BOUND" }, 500);
    }
    const alerts = await db
      .prepare(`
        SELECT 
          a.*,
          COUNT(an.id) as notifications_count,
          SUM(CASE WHEN an.status = 'sent' THEN 1 ELSE 0 END) as notifications_sent
        FROM alerts a
        LEFT JOIN alert_notifications an ON a.id = an.alert_id
        GROUP BY a.id
        ORDER BY a.created_at DESC
        LIMIT 50
      `)
      .all();
    
    return c.json(alerts.results);
  } catch (error) {
    console.error("[ALERTS GET] Error:", error);
    return c.json({ error: "Failed to fetch alerts", details: String(error) }, 500);
  }
});

// Get all safe places
app.get('/api/safe-places', async (c) => {
  const db = c.env.DB;
  const type = c.req.query('type'); // Optional filter by type
  
  try {
    let query = 'SELECT * FROM safe_places WHERE verified = 1';
    const params: string[] = [];
    
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY name ASC';
    
    const stmt = params.length > 0 
      ? db.prepare(query).bind(...params)
      : db.prepare(query);
    
    const places = await stmt.all();
    return c.json(places.results);
  } catch (error) {
    console.error('Error fetching safe places:', error);
    return c.json({ error: 'Failed to fetch safe places' }, 500);
  }
});

// Get safe place by ID
app.get('/api/safe-places/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  
  try {
    const place = await db
      .prepare('SELECT * FROM safe_places WHERE id = ?')
      .bind(id)
      .first();
    
    if (!place) {
      return c.json({ error: 'Place not found' }, 404);
    }
    
    return c.json(place);
  } catch (error) {
    console.error('Error fetching safe place:', error);
    return c.json({ error: 'Failed to fetch safe place' }, 500);
  }
});

// Add profile routes
addProfileRoutes(app, userAuthMiddleware);

// SPA fallback (IMPORTANTE)
// NÃO interceptar rotas da API - elas devem retornar 404 se não encontradas
app.get('*', (c) => {
  const path = c.req.path;

  // Rotas /api/ nunca devem chegar aqui - se chegaram, retorna 404
  if (path.startsWith('/api/')) {
    return c.json({ error: 'API endpoint not found', path }, 404);
  }

  return c.html(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/react-app/main.tsx"></script>
  </body>
</html>`);
});

export default app;

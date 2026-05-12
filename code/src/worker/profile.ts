import { Hono } from "hono";
import type { MiddlewareHandler } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { CustomVariables } from "./env.d";

const updateProfileSchema = z.object({
  name: z.string().nullable(),
  age: z.number().nullable(),
  notes: z.string().nullable(),
});

/**
 * Regista rotas `GET/PUT /api/profile` no app principal, protegidas pelo mesmo middleware de utilizador.
 *
 * @param app - Instância Hono com bindings `Env` e variáveis `CustomVariables`.
 * @param userAuthMiddleware - Middleware que define `userId` no contexto.
 */
export function addProfileRoutes(
  app: Hono<{ Bindings: Env; Variables: CustomVariables }>,
  userAuthMiddleware: MiddlewareHandler
) {
  // Get profile (protected, user-specific)
  app.get("/api/profile", userAuthMiddleware, async (c) => {
    const db = c.env.DB;
    const userId = c.get("userId") as string;
    
    const result = await db
      .prepare("SELECT * FROM user_profile WHERE user_id = ? LIMIT 1")
      .bind(userId)
      .first();
    
    return c.json(result || { name: null, age: null, notes: null });
  });

  // Update profile (protected, user-specific)
  app.put("/api/profile", userAuthMiddleware, zValidator("json", updateProfileSchema), async (c) => {
    const db = c.env.DB;
    const userId = c.get("userId") as string;
    const data = c.req.valid("json");
    
    // Check if profile exists
    const existing = await db
      .prepare("SELECT id FROM user_profile WHERE user_id = ? LIMIT 1")
      .bind(userId)
      .first();
    
    if (existing) {
      // Update existing profile
      await db
        .prepare(
          `UPDATE user_profile 
           SET name = ?, age = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = ?`
        )
        .bind(data.name, data.age, data.notes, userId)
        .run();
    } else {
      // Create new profile
      await db
        .prepare(
          `INSERT INTO user_profile (user_id, name, age, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
        )
        .bind(userId, data.name, data.age, data.notes)
        .run();
    }
    
    return c.json({ success: true });
  });
}

import type { Context as HonoContext } from "hono";

// Custom variables that can be set on Hono context
export interface CustomVariables {
  userId: string;
  userEmail: string;
  subscriptionStatus: string;
  subscriptionExpires: string | null;
}

export type Context = HonoContext<{ Bindings: Env; Variables: CustomVariables }>;

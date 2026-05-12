/// <reference path="../../worker-configuration.d.ts" />

/** Secrets e variáveis definidas no Dashboard / `.dev.vars` (não aparecem em wrangler.json). */
interface Env {
  JWT_SECRET?: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_PHONE_NUMBER?: string;
}

import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}

export const env = {
  get baseUrl() {
    return (process.env.APP_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  },
  get supabaseUrl() {
    return required("SUPABASE_URL");
  },
  get supabasePublishableKey() {
    return required("SUPABASE_PUBLISHABLE_KEY");
  },
  get supabaseSecretKey() {
    return process.env.SUPABASE_SECRET_KEY || required("SUPABASE_SERVICE_ROLE_KEY");
  },
  get whopApiKey() {
    return required("WHOP_API_KEY");
  },
  get whopPlanId() {
    return required("WHOP_PLAN_ID");
  },
  get whopWebhookSecret() {
    return required("WHOP_WEBHOOK_SECRET");
  },
  get voterHashSalt() {
    return required("VOTER_HASH_SALT");
  },
  get teracCallbackUrl() {
    return process.env.TERAC_CALLBACK_URL || null;
  },
  /** Checkout is offered only when the webhook can confirm payments, so nobody pays into a dead end. */
  get whopConfigured() {
    return Boolean(process.env.WHOP_API_KEY && process.env.WHOP_PLAN_ID && process.env.WHOP_WEBHOOK_SECRET);
  },
};

import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

const opts = { auth: { persistSession: false, autoRefreshToken: false } } as const;
let publicClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

/** Publishable key (anon role): can only call the public RPCs. Tables are closed by RLS. */
export function dbPublic(): SupabaseClient {
  publicClient ??= createClient(env.supabaseUrl, env.supabasePublishableKey, opts);
  return publicClient;
}

/** Secret key (service_role): needed for votes, payment status and webhook dedupe. Server only. */
export function dbAdmin(): SupabaseClient {
  adminClient ??= createClient(env.supabaseUrl, env.supabaseSecretKey, opts);
  return adminClient;
}

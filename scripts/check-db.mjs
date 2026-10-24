// Verifies the Supabase migration from the outside, using only the app's own keys.
// Usage: node --env-file=.env.local scripts/check-db.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const pub = process.env.SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const opts = { auth: { persistSession: false } };
const anon = createClient(url, pub, opts);
const admin = createClient(url, secret, opts);

let failed = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
  if (!ok) failed++;
};

// RLS: the publishable key must not read or write tables directly.
for (const table of ["orders", "features", "votes", "vote_rankings", "webhook_events"]) {
  const { data, error } = await anon.from(table).select("*").limit(1);
  check(`anon cannot read ${table}`, !!error || (data ?? []).length === 0, error?.code ?? "empty");
}
const ins = await anon.from("orders").insert({ company_name: "x", description: "xxxxxxxxxxxx" });
check("anon cannot insert orders", !!ins.error, ins.error?.code);

// Public RPCs work with the publishable key.
const created = await anon.rpc("create_order", {
  p_company_name: "DB check (delete me)",
  p_description: "Created by scripts/check-db.mjs",
  p_features: ["Alpha", "Beta", "Gamma"],
});
check("anon can create_order", !created.error && typeof created.data === "string", created.error?.message);
const orderId = created.data;

const order = await anon.rpc("get_order", { p_id: orderId });
check("get_order returns features in order", order.data?.features?.join(",") === "Alpha,Beta,Gamma");
check("new order is pending_payment", order.data?.status === "pending_payment");

// Privileged RPCs are closed to the publishable key.
for (const [fn, args] of [
  ["mark_test", { p_order_id: orderId }],
  ["mark_paid", { p_order_id: orderId, p_payment_id: "pay_fake" }],
  ["cast_vote", { p_order_id: orderId, p_ranking: [0, 1, 2], p_reason: "nope", p_voter_key: "a".repeat(64) }],
]) {
  const r = await anon.rpc(fn, args);
  check(`anon cannot call ${fn}`, !!r.error, r.error?.code);
}

// Server path: locked until unlocked, then one vote per voter.
const vote = (key, ranking = [1, 0, 2]) =>
  admin.rpc("cast_vote", { p_order_id: orderId, p_ranking: ranking, p_reason: "check script", p_voter_key: key });
check("vote on locked order is refused", (await vote("b".repeat(64))).data === "locked");
check("admin can mark_test", (await admin.rpc("mark_test", { p_order_id: orderId })).data === true);
check("first vote ok", (await vote("c".repeat(64))).data === "ok");
check("duplicate vote refused", (await vote("c".repeat(64))).data === "duplicate");
check("invalid ranking refused", (await vote("d".repeat(64), [0, 0, 1])).data === "invalid");

const results = await anon.rpc("get_results", { p_order_id: orderId });
const beta = results.data?.find((r) => r.label === "Beta");
check("results count the vote (Beta = 2 pts, 1 first place)", beta?.points === 2 && beta?.first_place_votes === 1);

// Clean up the check order (cascades to features, votes, rankings).
const del = await admin.from("orders").delete().eq("id", orderId);
check("cleanup", !del.error, del.error?.message);

console.log(failed ? `\n${failed} check(s) failed` : "\nAll database checks passed");
process.exit(failed ? 1 : 0);

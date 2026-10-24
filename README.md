# PitchTest

Founders submit a pitch and 3–5 candidate features, pay $5, and get a public voting link.
Recruited participants (via Terac) rank the features and give a one-line reason. The results
page shows a Borda-count ranking and a **Build This First** recommendation from the real votes,
and Round 2 (an improved pitch) is compared side by side with Round 1.

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase · Whop · Vercel

## Routes

| Route | Purpose |
|---|---|
| `/submit` (`?parent=<orderId>` for Round N+1) | Founder form |
| `/order/[orderId]` | Payment status, $5 checkout, judge-demo unlock, vote link |
| `/vote/[orderId]` | Public voting page (Terac participants land here) |
| `/results/[orderId]` | Ranking, reasons, Build This First, round comparison |
| `POST /api/orders` · `POST /api/votes` · `POST /api/orders/[id]/demo-unlock` · `POST /api/checkout` | Server routes |
| `POST /api/webhooks/whop` | Signed Whop webhook; the only way an order becomes `paid` |

## Database

`supabase/migrations/20261024000000_init.sql` creates `orders`, `features`, `votes`,
`vote_rankings`, `webhook_events` and the `feature_results` view.

- RLS is on for every table with **no policies**, so the publishable key can't touch tables.
- The publishable key can call only `create_order`, `get_order`, `get_child_order_ids`,
  `get_results`, `get_vote_reasons`.
- `cast_vote`, `mark_paid`, `mark_test`, `set_checkout_id`, `record_webhook_event` are granted
  to `service_role` only, so they need the secret key, which exists only in server env vars.
- `cast_vote` re-validates in Postgres: order unlocked, ranking is a full permutation, reason
  length, and `unique (order_id, voter_key)` blocks duplicate votes.

Apply it in the Supabase SQL editor (paste the file and run), then verify:

```bash
node --env-file=.env.local scripts/check-db.mjs
```

## Environment variables

See `.env.example`. None use `NEXT_PUBLIC_`, so nothing reaches the browser.
Set them in Vercel → Project → Settings → Environment Variables.

## Judge demo (TEST_MODE)

Only active when `TEST_MODE=true` **and** `DEMO_ACCESS_CODE` (8+ chars) is set. A judge enters the
code on an order page. The order becomes `test` (never `paid`) and is labelled
"TEST ORDER (not paid)" on every page. There is no public bypass.

## Payments (Whop)

`POST /api/checkout` creates a Whop checkout configuration for `WHOP_PLAN_ID` with
`metadata.order_id`, and redirects back to `/order/[orderId]`. It never marks anything paid.

`POST /api/webhooks/whop` verifies the Standard Webhooks signature and timestamp on the raw body
with `WHOP_WEBHOOK_SECRET` (the full `ws_...` value). It acts only on `payment.succeeded` for
`WHOP_PLAN_ID` with a valid `order_id`, then calls `mark_paid`, which only moves
`pending_payment` → `paid`, so retries and test orders are safe.

Setup: in Whop → Developer → Webhooks, add `https://<your domain>/api/webhooks/whop` with the
`payment.succeeded` event, then set `WHOP_API_KEY`, `WHOP_PLAN_ID` and `WHOP_WEBHOOK_SECRET` in
Vercel and redeploy.

## Scripts

```bash
npm run dev        # local dev
npm test           # unit tests (vitest)
npm run typecheck
npm run build
```

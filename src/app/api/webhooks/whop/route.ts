import { z } from "zod";
import { markPaid, recordWebhookEvent } from "@/lib/orders";
import { isSucceeded, verifyWebhook, type WhopEvent } from "@/lib/whop";
import { jsonError } from "@/lib/http";

const orderId = z.uuid();

// The only path to status "paid". Whop retries on non-2xx, and mark_paid is idempotent
// (pending_payment -> paid only), so the event is recorded after the order is updated.
export async function POST(req: Request) {
  const secret = process.env.WHOP_WEBHOOK_SECRET;
  if (!secret) return jsonError("Webhooks aren't configured", 503);

  const raw = await req.text();
  let event: WhopEvent;
  try {
    event = verifyWebhook(raw, req.headers, secret);
  } catch {
    return jsonError("Invalid signature", 401);
  }

  const ignore = (why: string) => Response.json({ ok: true, ignored: why });
  if (event.type !== "payment.succeeded") return ignore("event type");

  const payment = event.data;
  const id = orderId.safeParse(payment?.metadata?.order_id);
  if (!payment?.id || !id.success) return ignore("no PitchTest order");
  if (payment.plan?.id !== process.env.WHOP_PLAN_ID) return ignore("different plan");
  if (!isSucceeded(payment)) return ignore("payment not succeeded");

  const updated = await markPaid(id.data, payment.id);
  if (!updated) console.warn(`Whop payment ${payment.id} for order ${id.data}: order was not pending`);
  await recordWebhookEvent(req.headers.get("webhook-id")!, event.type);
  return Response.json({ ok: true, updated });
}

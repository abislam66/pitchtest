import { z } from "zod";
import { getOrder, isUnlocked, setCheckoutId } from "@/lib/orders";
import { createCheckout } from "@/lib/whop";
import { env } from "@/lib/env";
import { jsonError } from "@/lib/http";

// Starts a Whop checkout. This never marks anything paid: only the signed webhook does.
export async function POST(req: Request) {
  if (!env.whopConfigured) return jsonError("Checkout isn't configured on this deployment yet", 503);

  const parsed = z.object({ orderId: z.uuid() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid order", 400);
  const { orderId } = parsed.data;

  const order = await getOrder(orderId);
  if (!order) return jsonError("Order not found", 404);
  if (isUnlocked(order)) return jsonError("Order is already unlocked", 409);

  try {
    const checkout = await createCheckout(orderId);
    await setCheckoutId(orderId, checkout.id);
    return Response.json({ url: checkout.url });
  } catch (err) {
    console.error(err);
    return jsonError("Could not start checkout. Try again in a moment.", 502);
  }
}

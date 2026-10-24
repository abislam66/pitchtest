import "server-only";
import { Webhook } from "standardwebhooks";
import { env } from "./env";

const API = "https://api.whop.com/api/v1";

/** Creates a $5 checkout for one order. The order id rides along as metadata to the webhook. */
export async function createCheckout(orderId: string): Promise<{ id: string; url: string }> {
  const res = await fetch(`${API}/checkout_configurations`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.whopApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "payment",
      plan_id: env.whopPlanId,
      redirect_url: `${env.baseUrl}/order/${orderId}`,
      metadata: { order_id: orderId },
    }),
  });
  if (!res.ok) throw new Error(`Whop checkout failed: ${res.status} ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { id: string; purchase_url: string };
  // purchase_url may be relative ("/checkout/ch_.../").
  return { id: data.id, url: new URL(data.purchase_url, "https://whop.com").toString() };
}

export type WhopPayment = {
  id: string;
  status?: string | null;
  substatus?: string | null;
  metadata?: Record<string, unknown> | null;
  plan?: { id: string } | null;
};
export type WhopEvent = { id?: string; type: string; data: WhopPayment };

/**
 * Whop HMACs with the literal bytes of the whole `ws_...` secret, while standardwebhooks
 * base64-decodes the key it is given, so hand it the secret base64-encoded (prefix included).
 */
const hmacKey = (secret: string) => Buffer.from(secret, "utf8").toString("base64");

/** Verifies signature + timestamp (5 min tolerance) on the raw body. Throws if invalid. */
export function verifyWebhook(rawBody: string, headers: Headers, secret = env.whopWebhookSecret): WhopEvent {
  return new Webhook(hmacKey(secret)).verify(rawBody, {
    "webhook-id": headers.get("webhook-id") ?? "",
    "webhook-timestamp": headers.get("webhook-timestamp") ?? "",
    "webhook-signature": headers.get("webhook-signature") ?? "",
  }) as WhopEvent;
}

export const isSucceeded = (p: WhopPayment) => p.substatus === "succeeded" || p.status === "paid";

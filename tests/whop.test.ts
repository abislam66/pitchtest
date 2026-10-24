import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const orders = vi.hoisted(() => ({
  getOrder: vi.fn(),
  markPaid: vi.fn(),
  recordWebhookEvent: vi.fn(),
  setCheckoutId: vi.fn(),
}));
vi.mock("@/lib/orders", async (orig) => ({ ...(await orig<typeof import("@/lib/orders")>()), ...orders }));

import { POST as webhook } from "@/app/api/webhooks/whop/route";
import { POST as checkout } from "@/app/api/checkout/route";

const SECRET = "ws_test_secret_value_123";
const PLAN = "plan_pitchtest5";
const ORDER_ID = "00000000-0000-4000-8000-000000000002";

// Signs like Whop's backend: HMAC-SHA256 keyed with the literal secret bytes.
function signed(body: unknown, { secret = SECRET, ts = Math.floor(Date.now() / 1000), id = "msg_1" } = {}) {
  const raw = JSON.stringify(body);
  const sig = createHmac("sha256", secret).update(`${id}.${ts}.${raw}`).digest("base64");
  return new Request("http://x/api/webhooks/whop", {
    method: "POST",
    headers: { "webhook-id": id, "webhook-timestamp": String(ts), "webhook-signature": `v1,${sig}` },
    body: raw,
  });
}
const paymentEvent = (data: Record<string, unknown> = {}, type = "payment.succeeded") => ({
  type,
  data: { id: "pay_1", status: "paid", substatus: "succeeded", metadata: { order_id: ORDER_ID }, plan: { id: PLAN }, ...data },
});

beforeEach(() => {
  vi.stubEnv("WHOP_WEBHOOK_SECRET", SECRET);
  vi.stubEnv("WHOP_PLAN_ID", PLAN);
  vi.stubEnv("WHOP_API_KEY", "key");
  vi.stubEnv("APP_BASE_URL", "https://pitchtest.example");
  orders.markPaid.mockResolvedValue(true);
  orders.recordWebhookEvent.mockResolvedValue(true);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("Whop webhook", () => {
  it("marks the order paid for a verified payment.succeeded", async () => {
    const res = await webhook(signed(paymentEvent()));
    expect(res.status).toBe(200);
    expect(orders.markPaid).toHaveBeenCalledWith(ORDER_ID, "pay_1");
    expect(orders.recordWebhookEvent).toHaveBeenCalledWith("msg_1", "payment.succeeded");
  });

  it("rejects a wrong secret, a tampered body and a stale timestamp", async () => {
    expect((await webhook(signed(paymentEvent(), { secret: "ws_other" }))).status).toBe(401);

    const req = signed(paymentEvent());
    const tampered = new Request(req.url, {
      method: "POST",
      headers: req.headers,
      body: (await req.text()).replace(ORDER_ID, "00000000-0000-4000-8000-000000000009"),
    });
    expect((await webhook(tampered)).status).toBe(401);

    expect((await webhook(signed(paymentEvent(), { ts: Math.floor(Date.now() / 1000) - 3600 }))).status).toBe(401);
    expect((await webhook(new Request("http://x", { method: "POST", body: "{}" }))).status).toBe(401);
    expect(orders.markPaid).not.toHaveBeenCalled();
  });

  it("ignores other events, other plans, unsucceeded payments and missing order ids", async () => {
    for (const ev of [
      paymentEvent({}, "payment.failed"),
      paymentEvent({ plan: { id: "plan_cheaper" } }),
      paymentEvent({ status: "open", substatus: "pending" }),
      paymentEvent({ metadata: {} }),
      paymentEvent({ metadata: { order_id: "not-a-uuid" } }),
    ]) {
      expect((await webhook(signed(ev))).status).toBe(200);
    }
    expect(orders.markPaid).not.toHaveBeenCalled();
  });

  it("returns 500 so Whop retries when the database fails, without recording the event", async () => {
    orders.markPaid.mockRejectedValue(new Error("db down"));
    await expect(webhook(signed(paymentEvent()))).rejects.toThrow();
    expect(orders.recordWebhookEvent).not.toHaveBeenCalled();
  });

  it("is closed when no webhook secret is configured", async () => {
    vi.stubEnv("WHOP_WEBHOOK_SECRET", "");
    expect((await webhook(signed(paymentEvent()))).status).toBe(503);
  });
});

describe("checkout route", () => {
  const post = (body: unknown) => checkout(new Request("http://x/api/checkout", { method: "POST", body: JSON.stringify(body) }));

  it("creates a Whop checkout for a pending order with the order id as metadata", async () => {
    orders.getOrder.mockResolvedValue({ id: ORDER_ID, status: "pending_payment" });
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ id: "ch_1", purchase_url: "/checkout/ch_1/" }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await post({ orderId: ORDER_ID });
    expect(await res.json()).toEqual({ url: "https://whop.com/checkout/ch_1/" });
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sent).toMatchObject({ mode: "payment", plan_id: PLAN, metadata: { order_id: ORDER_ID } });
    expect(sent.redirect_url).toBe(`https://pitchtest.example/order/${ORDER_ID}`);
    expect(orders.setCheckoutId).toHaveBeenCalledWith(ORDER_ID, "ch_1");
  });

  it("refuses unlocked orders, bad ids and an unconfigured deployment", async () => {
    orders.getOrder.mockResolvedValue({ id: ORDER_ID, status: "test" });
    expect((await post({ orderId: ORDER_ID })).status).toBe(409);
    expect((await post({ orderId: "nope" })).status).toBe(400);
    vi.stubEnv("WHOP_PLAN_ID", "");
    expect((await post({ orderId: ORDER_ID })).status).toBe(503);
  });
});

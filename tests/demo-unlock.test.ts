import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const orders = vi.hoisted(() => ({
  getOrder: vi.fn(),
  markTest: vi.fn(),
  castVote: vi.fn(),
}));
vi.mock("@/lib/orders", async (orig) => ({ ...(await orig<typeof import("@/lib/orders")>()), ...orders }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "user-agent": "UA" }) }));

import { POST as demoUnlock } from "@/app/api/orders/[orderId]/demo-unlock/route";
import { POST as vote } from "@/app/api/votes/route";

const ORDER_ID = "00000000-0000-4000-8000-000000000001";
const CODE = "judge-demo-code-0001";
const order = (status: string) => ({ id: ORDER_ID, status, features: ["A", "B", "C"] });

const unlock = (code: unknown) =>
  demoUnlock(
    new Request("http://x/api", { method: "POST", body: JSON.stringify({ code }) }),
    { params: Promise.resolve({ orderId: ORDER_ID }) },
  );

beforeEach(() => {
  vi.stubEnv("TEST_MODE", "true");
  vi.stubEnv("DEMO_ACCESS_CODE", CODE);
  vi.stubEnv("VOTER_HASH_SALT", "salt");
  orders.getOrder.mockResolvedValue(order("pending_payment"));
  orders.markTest.mockResolvedValue(true);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("demo unlock route", () => {
  it("marks a pending order as test with the right code", async () => {
    const res = await unlock(CODE);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, status: "test" });
    expect(orders.markTest).toHaveBeenCalledWith(ORDER_ID);
  });

  it("refuses a wrong or missing code without touching the order", async () => {
    for (const code of ["wrong-code-000000000", "", undefined, 12345678]) {
      expect((await unlock(code)).status).toBe(403);
    }
    expect(orders.getOrder).not.toHaveBeenCalled();
    expect(orders.markTest).not.toHaveBeenCalled();
  });

  it("is closed when TEST_MODE is off, even with the right code", async () => {
    vi.stubEnv("TEST_MODE", "false");
    expect((await unlock(CODE)).status).toBe(403);
    expect(orders.markTest).not.toHaveBeenCalled();
  });

  it("does not change an order that is already paid or test", async () => {
    orders.markTest.mockResolvedValue(false); // mark_test only updates pending_payment rows
    expect((await unlock(CODE)).status).toBe(409);
  });
});

describe("votes route", () => {
  const body = { orderId: ORDER_ID, ranking: [0, 1, 2], reason: "Because" };
  const post = () => vote(new Request("http://x/api", { method: "POST", body: JSON.stringify(body) }));

  it("refuses votes on an unpaid order before reaching the database", async () => {
    expect((await post()).status).toBe(403);
    expect(orders.castVote).not.toHaveBeenCalled();
  });

  it("accepts votes once the order is test or paid", async () => {
    orders.castVote.mockResolvedValue("ok");
    for (const status of ["test", "paid"]) {
      orders.getOrder.mockResolvedValue(order(status));
      expect((await post()).status).toBe(201);
    }
  });
});

import { checkDemoCode } from "@/lib/testMode";
import { getOrder, markTest } from "@/lib/orders";
import { jsonError } from "@/lib/http";

export async function POST(req: Request, ctx: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await ctx.params;
  const body = (await req.json().catch(() => null)) as { code?: unknown } | null;
  if (!checkDemoCode(body?.code)) return jsonError("Demo mode is unavailable or the code is wrong", 403);

  const order = await getOrder(orderId);
  if (!order) return jsonError("Order not found", 404);
  if (!(await markTest(orderId))) return jsonError("Order is already unlocked", 409);
  return Response.json({ ok: true, status: "test" });
}

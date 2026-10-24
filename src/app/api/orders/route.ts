import { orderInput } from "@/lib/validation";
import { createOrder, getOrder } from "@/lib/orders";
import { jsonError } from "@/lib/http";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = orderInput.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues.map((i) => i.message).join("; "), 400);
  }
  if (parsed.data.parentOrderId && !(await getOrder(parsed.data.parentOrderId))) {
    return jsonError("The previous round's order was not found", 400);
  }
  const orderId = await createOrder(parsed.data);
  return Response.json({ orderId }, { status: 201 });
}

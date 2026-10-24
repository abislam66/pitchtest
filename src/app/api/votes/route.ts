import { voteInput, isValidRanking } from "@/lib/validation";
import { castVote, getOrder, isUnlocked } from "@/lib/orders";
import { voterKey } from "@/lib/voterKey";
import { env } from "@/lib/env";
import { clientFingerprint, jsonError } from "@/lib/http";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = voteInput.safeParse(body);
  if (!parsed.success) return jsonError("Invalid vote", 400);
  const { orderId, ranking, reason, teracSubmissionId, teracTaskId } = parsed.data;

  // Pre-checks give friendly errors; cast_vote re-validates everything inside Postgres.
  const order = await getOrder(orderId);
  if (!order) return jsonError("Order not found", 404);
  if (!isUnlocked(order)) return jsonError("Voting opens once this order is paid", 403);
  if (!isValidRanking(ranking, order.features.length)) {
    return jsonError("Rank every feature exactly once", 400);
  }

  const fp = await clientFingerprint();
  const key = voterKey({
    orderId,
    salt: env.voterHashSalt,
    teracSubmissionId,
    ip: fp.ip,
    userAgent: fp.userAgent,
  });
  const result = await castVote({ orderId, ranking, reason, voterKey: key, teracSubmissionId });
  if (result === "duplicate") return jsonError("You have already voted on this pitch", 409);
  if (result === "locked") return jsonError("Voting opens once this order is paid", 403);
  if (result === "not_found") return jsonError("Order not found", 404);
  if (result !== "ok") return jsonError("Invalid vote", 400);

  let redirectTo: string | null = null;
  if (teracSubmissionId && env.teracCallbackUrl) {
    const url = new URL(env.teracCallbackUrl);
    url.searchParams.set("submissionId", teracSubmissionId);
    url.searchParams.set("teracSubmissionId", teracSubmissionId);
    if (teracTaskId) url.searchParams.set("taskId", teracTaskId);
    redirectTo = url.toString();
  }
  return Response.json({ ok: true, redirectTo }, { status: 201 });
}

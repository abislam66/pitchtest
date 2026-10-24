import { createHash } from "node:crypto";

/**
 * One vote per voter per order. Terac participants carry a submission id, which is the
 * strongest identity we get; anonymous visitors fall back to ip + user agent.
 * Hashed with a server-side salt so raw identifiers are never stored.
 */
export function voterKey(opts: {
  orderId: string;
  salt: string;
  teracSubmissionId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}): string {
  const identity = opts.teracSubmissionId
    ? `terac:${opts.teracSubmissionId}`
    : `anon:${opts.ip ?? "unknown"}|${opts.userAgent ?? "unknown"}`;
  return createHash("sha256").update(`${opts.salt}|${opts.orderId}|${identity}`).digest("hex");
}

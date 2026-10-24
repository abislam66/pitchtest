import { z } from "zod";

const trimmed = (min: number, max: number) => z.string().trim().min(min).max(max);

export const orderInput = z
  .object({
    companyName: trimmed(1, 120),
    description: trimmed(10, 1000),
    features: z.array(trimmed(2, 120)).min(3).max(5),
    parentOrderId: z.uuid().optional(),
  })
  .refine(
    (o) => new Set(o.features.map((f) => f.toLowerCase())).size === o.features.length,
    { message: "Features must be distinct", path: ["features"] },
  );
export type OrderInput = z.infer<typeof orderInput>;

export const voteInput = z.object({
  orderId: z.uuid(),
  ranking: z.array(z.number().int().min(0)).min(3).max(5),
  reason: trimmed(3, 200),
  teracSubmissionId: z.string().trim().max(100).optional(),
  teracTaskId: z.string().trim().max(100).optional(),
});
export type VoteInput = z.infer<typeof voteInput>;

/** A ranking must be a permutation of 0..featureCount-1. */
export function isValidRanking(ranking: number[], featureCount: number): boolean {
  if (ranking.length !== featureCount) return false;
  const seen = new Set(ranking);
  return seen.size === featureCount && ranking.every((i) => i >= 0 && i < featureCount);
}

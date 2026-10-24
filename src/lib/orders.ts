import "server-only";
import { dbAdmin, dbPublic } from "./supabase";
import type { OrderInput } from "./validation";
import type { FeatureResult } from "./scoring";

export type OrderStatus = "pending_payment" | "paid" | "test";

export type Order = {
  id: string;
  round: number;
  parent_order_id: string | null;
  company_name: string;
  description: string;
  /** Labels in position order; a ranking refers to these indexes. */
  features: string[];
  status: OrderStatus;
  created_at: string;
};

export type VoteReason = { top_feature: string; reason: string; created_at: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUnlocked = (o: Pick<Order, "status">) => o.status === "paid" || o.status === "test";

async function rpc<T>(client: "public" | "admin", fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await (client === "admin" ? dbAdmin() : dbPublic()).rpc(fn, args);
  if (error) throw new Error(`${fn}: ${error.message}`);
  return data as T;
}

export function createOrder(input: OrderInput): Promise<string> {
  return rpc<string>("public", "create_order", {
    p_company_name: input.companyName,
    p_description: input.description,
    p_features: input.features,
    p_parent_id: input.parentOrderId ?? null,
  });
}

export async function getOrder(id: string): Promise<Order | null> {
  if (!UUID.test(id)) return null;
  return (await rpc<Order | null>("public", "get_order", { p_id: id })) ?? null;
}

export async function getChildOrderIds(id: string): Promise<string[]> {
  return (await rpc<string[] | null>("public", "get_child_order_ids", { p_id: id })) ?? [];
}

export async function getResults(orderId: string): Promise<FeatureResult[]> {
  const rows = await rpc<
    { position: number; label: string; points: number; first_place_votes: number; avg_rank: number | null; vote_count: number }[]
  >("public", "get_results", { p_order_id: orderId });
  return (rows ?? []).map((r) => ({
    index: r.position,
    feature: r.label,
    points: r.points,
    firstPlaceVotes: r.first_place_votes,
    averageRank: r.avg_rank === null ? null : Number(r.avg_rank),
    voteCount: r.vote_count,
  }));
}

export async function getVoteReasons(orderId: string): Promise<VoteReason[]> {
  return (await rpc<VoteReason[] | null>("public", "get_vote_reasons", { p_order_id: orderId })) ?? [];
}

export type CastVoteResult = "ok" | "duplicate" | "locked" | "invalid" | "not_found";

export function castVote(v: {
  orderId: string;
  ranking: number[];
  reason: string;
  voterKey: string;
  teracSubmissionId?: string;
}): Promise<CastVoteResult> {
  return rpc<CastVoteResult>("admin", "cast_vote", {
    p_order_id: v.orderId,
    p_ranking: v.ranking,
    p_reason: v.reason,
    p_voter_key: v.voterKey,
    p_terac_submission_id: v.teracSubmissionId ?? null,
  });
}

export function setCheckoutId(orderId: string, checkoutId: string): Promise<void> {
  return rpc<void>("admin", "set_checkout_id", { p_order_id: orderId, p_checkout_id: checkoutId });
}

/** Only moves a pending order forward; returns false if it was not pending. */
export function markPaid(orderId: string, paymentId: string): Promise<boolean> {
  return rpc<boolean>("admin", "mark_paid", { p_order_id: orderId, p_payment_id: paymentId });
}

export function markTest(orderId: string): Promise<boolean> {
  return rpc<boolean>("admin", "mark_test", { p_order_id: orderId });
}

/** Returns false if this webhook delivery was already processed. */
export function recordWebhookEvent(id: string, type: string): Promise<boolean> {
  return rpc<boolean>("admin", "record_webhook_event", { p_id: id, p_type: type });
}

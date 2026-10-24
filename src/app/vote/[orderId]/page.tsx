import { notFound } from "next/navigation";
import { getOrder, isUnlocked } from "@/lib/orders";
import { VoteForm } from "./VoteForm";

export const dynamic = "force-dynamic";

export default async function VotePage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ teracSubmissionId?: string; submissionId?: string; taskId?: string }>;
}) {
  const { orderId } = await params;
  const sp = await searchParams;
  const order = await getOrder(orderId);
  if (!order) notFound();

  if (!isUnlocked(order)) {
    return (
      <div className="card">
        <h1 className="text-xl font-semibold">Voting isn&apos;t open yet</h1>
        <p className="mt-2 text-muted">This pitch hasn&apos;t been activated. Please check back later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{order.company_name}</h1>
        <p className="mt-2 text-muted">{order.description}</p>
      </div>
      <VoteForm
        orderId={order.id}
        features={order.features}
        teracSubmissionId={sp.teracSubmissionId ?? sp.submissionId}
        teracTaskId={sp.taskId}
      />
    </div>
  );
}

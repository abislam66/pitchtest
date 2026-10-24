import { notFound } from "next/navigation";
import { getOrder, isUnlocked } from "@/lib/orders";
import { LockIcon } from "@/components/icons";
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
      <div className="mx-auto max-w-xl">
        <div className="card flex flex-col items-center px-6 py-12 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-subtle text-muted">
            <LockIcon size={24} />
          </span>
          <h1 className="mt-5 text-2xl font-semibold">Voting isn&apos;t open yet</h1>
          <p className="mt-2 text-muted">This pitch hasn&apos;t been activated. Please check back later.</p>
        </div>
      </div>
    );
  }

  const instructions = [
    "Read the pitch above.",
    "Order the features: the top spot is what you'd want built first. Use the arrows to move a feature up or down.",
    "In one line, tell the founder why your #1 matters most.",
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="space-y-4" aria-labelledby="pitch-heading">
        <p className="eyebrow">Help a founder decide what to build</p>
        <div className="card">
          <p className="text-xs font-semibold text-muted">The pitch</p>
          <h1 id="pitch-heading" className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            {order.company_name}
          </h1>
          <p className="mt-3 leading-relaxed text-muted">{order.description}</p>
        </div>
      </section>

      <section aria-labelledby="how-to-vote" className="rounded-card border border-border bg-subtle/70 p-5">
        <h2 id="how-to-vote" className="text-sm font-semibold">
          How to vote
        </h2>
        <ol className="mt-3 space-y-2.5">
          {instructions.map((t, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft font-display text-xs font-bold text-accent-soft-fg">
                {i + 1}
              </span>
              <span className="pt-0.5 text-muted">{t}</span>
            </li>
          ))}
        </ol>
      </section>

      <VoteForm
        orderId={order.id}
        features={order.features}
        teracSubmissionId={sp.teracSubmissionId ?? sp.submissionId}
        teracTaskId={sp.taskId}
      />
    </div>
  );
}

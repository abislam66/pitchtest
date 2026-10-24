import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder, isUnlocked } from "@/lib/orders";
import { testModeEnabled } from "@/lib/testMode";
import { env } from "@/lib/env";
import { Badge, Callout, RankBadge, StatusBadge, Stepper } from "@/components/ui";
import { AlertTriangleIcon, ArrowRightIcon, BarChartIcon, CheckCircleIcon, ExternalLinkIcon } from "@/components/icons";
import { CopyButton } from "@/components/CopyButton";
import { OrderActions } from "./OrderActions";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { orderId } = await params;
  const { status: returnStatus } = await searchParams;
  const order = await getOrder(orderId);
  if (!order) notFound();

  const voteUrl = `${env.baseUrl}/vote/${order.id}`;
  const unlocked = isUnlocked(order);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="mx-auto max-w-md">
        <Stepper current={unlocked ? 2 : 1} />
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">Round {order.round}</Badge>
          <StatusBadge status={order.status} />
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{order.company_name}</h1>
        <p className="mt-3 leading-relaxed text-muted">{order.description}</p>
      </div>

      {order.status === "test" && (
        <Callout tone="warning" icon={<AlertTriangleIcon size={16} />}>
          Test order (judge demo). Not paid. Votes collected here are real votes but this order was unlocked without payment.
        </Callout>
      )}

      <div className="space-y-6">
        {unlocked ? (
          <section className="card space-y-5" aria-labelledby="unlocked-heading">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success-soft text-success">
                <CheckCircleIcon size={20} />
              </span>
              <div>
                <h2 id="unlocked-heading" className="text-lg font-semibold">
                  {order.status === "paid" ? "Payment confirmed" : "Unlocked for demo"}
                </h2>
                <p className="text-sm text-muted">
                  {order.status === "paid" ? "Voting is open." : "Voting is open. This order is marked as a test order (not paid)."}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted">Public voting link (this is what Terac participants open):</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <code className="block min-w-0 flex-1 rounded-control border border-border bg-subtle px-3 py-2.5 font-mono text-sm break-all">
                  {voteUrl}
                </code>
                <CopyButton text={voteUrl} />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link className="btn" href={`/vote/${order.id}`}>
                Open voting page <ExternalLinkIcon size={16} />
              </Link>
              <Link className="btn-ghost" href={`/results/${order.id}`}>
                <BarChartIcon size={16} /> View results
              </Link>
            </div>
          </section>
        ) : (
          <OrderActions
            orderId={order.id}
            checkoutAvailable={env.whopConfigured}
            demoAvailable={testModeEnabled()}
            returnStatus={returnStatus ?? null}
          />
        )}

        <section className="card space-y-4" aria-labelledby="features-heading">
          <div className="flex items-center justify-between gap-3">
            <h2 id="features-heading" className="font-semibold">
              Features being tested
            </h2>
            <span className="text-sm text-muted tabular-nums">{order.features.length}</span>
          </div>
          <ol className="grid gap-2 sm:grid-cols-2">
            {order.features.map((f, i) => (
              <li key={f} className="flex items-center gap-3 rounded-lg border border-border bg-subtle/60 px-3 py-2.5">
                <RankBadge rank={i + 1} size="sm" />
                <span className="min-w-0 break-words">{f}</span>
              </li>
            ))}
          </ol>
          <p className="text-xs text-muted">Shown in this order to voters, who then rearrange them.</p>
        </section>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-sm">
        <Link href="/dashboard" className="link inline-flex min-h-11 items-center">
          Your dashboard
        </Link>
        {unlocked && (
          <Link href={`/results/${order.id}`} className="link inline-flex min-h-11 items-center gap-1.5">
            Go to results <ArrowRightIcon size={16} />
          </Link>
        )}
      </div>
    </div>
  );
}

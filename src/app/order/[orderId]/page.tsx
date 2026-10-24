import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder, isUnlocked } from "@/lib/orders";
import { testModeEnabled } from "@/lib/testMode";
import { env } from "@/lib/env";
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

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted">Round {order.round}</p>
        <h1 className="text-3xl font-bold">{order.company_name}</h1>
        <p className="mt-2 text-muted">{order.description}</p>
      </div>

      <div className="card space-y-2">
        <h2 className="font-semibold">Features being tested</h2>
        <ol className="list-decimal space-y-1 pl-5">
          {order.features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ol>
      </div>

      {order.status === "test" && (
        <p className="rounded-lg border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Test order (judge demo). Not paid. Votes collected here are real votes but this order was unlocked without payment.
        </p>
      )}

      {isUnlocked(order) ? (
        <div className="card space-y-4">
          <h2 className="font-semibold">{order.status === "paid" ? "Payment confirmed ✓" : "Unlocked for demo"}</h2>
          <div className="space-y-1">
            <p className="text-sm text-muted">Public voting link (this is what Terac participants open):</p>
            <code className="block break-all rounded bg-bg p-2 text-sm">{voteUrl}</code>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className="btn" href={`/vote/${order.id}`}>
              Open voting page
            </Link>
            <Link className="btn-ghost" href={`/results/${order.id}`}>
              View results
            </Link>
          </div>
        </div>
      ) : (
        <OrderActions
          orderId={order.id}
          checkoutAvailable={env.whopConfigured}
          demoAvailable={testModeEnabled()}
          returnStatus={returnStatus ?? null}
        />
      )}
    </div>
  );
}

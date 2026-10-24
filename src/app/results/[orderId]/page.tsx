import Link from "next/link";
import { notFound } from "next/navigation";
import { getChildOrderIds, getOrder, getResults, getVoteReasons, isUnlocked, type Order } from "@/lib/orders";
import { recommend, type Recommendation } from "@/lib/scoring";

export const dynamic = "force-dynamic";

async function loadRound(order: Order) {
  const [results, reasons] = await Promise.all([getResults(order.id), getVoteReasons(order.id)]);
  return { order, reasons, rec: recommend(results) };
}

function Ranking({ rec }: { rec: Recommendation }) {
  if (rec.totalVotes === 0) return <p className="text-muted">No votes yet.</p>;
  const max = Math.max(...rec.scores.map((s) => s.points), 1);
  return (
    <ol className="space-y-3">
      {rec.scores.map((s, i) => (
        <li key={s.index} className="space-y-1">
          <div className="flex justify-between gap-4 text-sm">
            <span className="font-medium">
              {i + 1}. {s.feature}
            </span>
            <span className="shrink-0 text-muted">
              {s.points} pts · {s.firstPlaceVotes} first-place
              {s.averageRank !== null && ` · avg rank ${s.averageRank.toFixed(1)}`}
            </span>
          </div>
          <div className="h-2 rounded bg-border">
            <div className="h-2 rounded bg-accent" style={{ width: `${(s.points / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}

export default async function ResultsPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = await getOrder(orderId);
  if (!order) notFound();

  const [current, parent, childIds] = await Promise.all([
    loadRound(order),
    order.parent_order_id ? getOrder(order.parent_order_id) : Promise.resolve(null),
    getChildOrderIds(order.id),
  ]);
  const previous = parent ? await loadRound(parent) : null;
  const nextId = childIds[0] ?? null;
  const { rec } = current;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted">
          Round {order.round} results{order.status === "test" ? " · TEST ORDER (not paid)" : ""}
        </p>
        <h1 className="text-3xl font-bold">{order.company_name}</h1>
      </div>

      <section className="card space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Build this first</h2>
        {rec.winner ? (
          <>
            <p className="text-2xl font-bold">{rec.tie ? "Too close to call" : rec.winner.feature}</p>
            <p className="text-sm text-muted">
              {rec.tie
                ? `The top two features are tied on points and first-place votes after ${rec.totalVotes} vote(s). Collect more votes before deciding.`
                : `Ranked #1 by Borda count across ${rec.totalVotes} real vote(s), with ${rec.winner.firstPlaceVotes} first-place pick(s).`}
              {rec.totalVotes < 5 && " Small sample: treat this as directional."}
            </p>
          </>
        ) : (
          <p className="text-muted">
            No votes yet, so there&apos;s no recommendation.{" "}
            {isUnlocked(order) ? "Share the voting link to start collecting." : "Unlock the order to open voting."}
          </p>
        )}
      </section>

      <section className="card space-y-4">
        <h2 className="font-semibold">Full ranking</h2>
        <Ranking rec={rec} />
      </section>

      {current.reasons.length > 0 && (
        <section className="card space-y-3">
          <h2 className="font-semibold">Why voters picked their #1</h2>
          <ul className="space-y-2">
            {current.reasons.map((v, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium">{v.top_feature}:</span>{" "}
                <span className="text-muted">&ldquo;{v.reason}&rdquo;</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {previous && (
        <section className="card space-y-4">
          <h2 className="font-semibold">Compared with Round {previous.order.round}</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Round {previous.order.round} ({previous.rec.totalVotes} votes)
              </p>
              <p className="text-sm text-muted">{previous.order.description}</p>
              <Ranking rec={previous.rec} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Round {order.round} ({rec.totalVotes} votes)
              </p>
              <p className="text-sm text-muted">{order.description}</p>
              <Ranking rec={rec} />
            </div>
          </div>
          <p className="text-sm text-muted">
            {previous.rec.winner && rec.winner
              ? previous.rec.winner.feature === rec.winner.feature
                ? `Same top pick both rounds: "${rec.winner.feature}".`
                : `Top pick changed from "${previous.rec.winner.feature}" to "${rec.winner.feature}".`
              : "Both rounds need votes before they can be compared."}
          </p>
          <Link className="text-sm text-accent" href={`/results/${previous.order.id}`}>
            View Round {previous.order.round} results →
          </Link>
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        {nextId ? (
          <Link className="btn" href={`/results/${nextId}`}>
            View Round {order.round + 1} results →
          </Link>
        ) : (
          <Link className="btn" href={`/submit?parent=${order.id}`}>
            Start Round {order.round + 1} with an improved pitch
          </Link>
        )}
        <Link className="btn-ghost" href={`/order/${order.id}`}>
          Order details
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getChildOrderIds,
  getOrder,
  getResults,
  getVoteReasons,
  isUnlocked,
  type Order,
  type VoteReason,
} from "@/lib/orders";
import { recommend, type FeatureResult, type Recommendation } from "@/lib/scoring";
import { Badge, Callout, EmptyState, RankBadge, Stat, StatusBadge } from "@/components/ui";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  BarChartIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  GitCompareIcon,
  InboxIcon,
  LinkIcon,
  QuoteIcon,
  ScaleIcon,
  TrophyIcon,
} from "@/components/icons";

export const dynamic = "force-dynamic";

async function loadRound(order: Order) {
  const [results, reasons] = await Promise.all([getResults(order.id), getVoteReasons(order.id)]);
  return { order, reasons, rec: recommend(results) };
}

/** Borda: each vote gives n−1 points to its #1, so the ceiling is (n−1) × votes. */
const possiblePoints = (rec: Recommendation) => Math.max(rec.scores.length - 1, 0) * rec.totalVotes;

const isTiedWithLeader = (rec: Recommendation, s: FeatureResult) =>
  rec.tie && s.points === rec.scores[0]?.points && s.firstPlaceVotes === rec.scores[0]?.firstPlaceVotes;

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function formatDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function Ranking({ rec, compact = false }: { rec: Recommendation; compact?: boolean }) {
  if (rec.totalVotes === 0) return <p className="text-sm text-muted">No votes yet.</p>;
  const possible = possiblePoints(rec) || 1;
  return (
    <ol className="space-y-3">
      {rec.scores.map((s, i) => {
        const pct = Math.round((s.points / possible) * 100);
        const lead = i === 0 && !rec.tie;
        const tied = isTiedWithLeader(rec, s);
        const bar = (
          <div className="h-2.5 overflow-hidden rounded-full bg-subtle" aria-hidden="true">
            <div
              className={`h-full rounded-full ${lead || tied ? "bg-gradient-to-r from-accent to-[#8b5cf6]" : "bg-accent/45"}`}
              style={{ width: `${Math.max(pct, s.points > 0 ? 2 : 0)}%` }}
            />
          </div>
        );

        if (compact) {
          return (
            <li key={s.index} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 font-medium break-words">
                  {i + 1}. {s.feature}
                </span>
                <span className="shrink-0 text-muted tabular-nums">{s.points} pts</span>
              </div>
              {bar}
            </li>
          );
        }

        return (
          <li
            key={s.index}
            className={`rounded-xl border p-4 ${lead ? "border-accent/40 bg-accent-soft/40" : "border-border bg-card"}`}
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <RankBadge rank={i + 1} />
              <div className="min-w-0 flex-1 space-y-2.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="min-w-0 font-semibold break-words">
                    {s.feature}
                    {tied && (
                      <Badge tone="warning" className="ml-2 align-middle">
                        Tied
                      </Badge>
                    )}
                  </p>
                  <p className="shrink-0 text-sm text-muted tabular-nums">
                    <span className="font-display text-lg font-bold text-fg">{s.points}</span> / {possible} pts
                  </p>
                </div>
                {bar}
                <dl className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
                  <div className="flex gap-1">
                    <dt>First-place votes</dt>
                    <dd className="font-semibold text-fg tabular-nums">{s.firstPlaceVotes}</dd>
                  </div>
                  <div className="flex gap-1">
                    <dt>Avg rank</dt>
                    <dd className="font-semibold text-fg tabular-nums">
                      {s.averageRank !== null ? s.averageRank.toFixed(1) : "—"}
                    </dd>
                  </div>
                  <div className="flex gap-1">
                    <dt>Share of possible points</dt>
                    <dd className="font-semibold text-fg tabular-nums">{pct}%</dd>
                  </div>
                </dl>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function BuildThisFirst({ rec, order }: { rec: Recommendation; order: Order }) {
  const smallSample = rec.totalVotes > 0 && rec.totalVotes < 5;

  if (!rec.winner) {
    return (
      <section aria-labelledby="btf-heading" className="card">
        <h2 id="btf-heading" className="eyebrow mb-4">
          Build this first
        </h2>
        <EmptyState
          icon={<InboxIcon size={22} />}
          title="No votes yet"
          action={
            <Link className="btn" href={`/order/${order.id}`}>
              {isUnlocked(order) ? (
                <>
                  <LinkIcon size={16} /> Get the voting link
                </>
              ) : (
                <>
                  Unlock voting <ArrowRightIcon size={16} />
                </>
              )}
            </Link>
          }
        >
          No votes yet, so there&apos;s no recommendation.{" "}
          {isUnlocked(order) ? "Share the voting link to start collecting." : "Unlock the order to open voting."}
        </EmptyState>
      </section>
    );
  }

  if (rec.tie) {
    const tied = rec.scores.filter((s) => isTiedWithLeader(rec, s));
    return (
      <section aria-labelledby="btf-heading" className="card space-y-4 border-warning-border">
        <div className="flex items-center gap-2">
          <ScaleIcon size={16} className="text-warning" />
          <h2 id="btf-heading" className="eyebrow">
            Build this first
          </h2>
        </div>
        <p className="font-display text-3xl font-bold sm:text-4xl">Too close to call</p>
        <p className="text-muted">
          {`The top two features are tied on points and first-place votes after ${rec.totalVotes} vote(s). Collect more votes before deciding.`}
          {rec.totalVotes < 5 && " Small sample: treat this as directional."}
        </p>
        <div className="flex flex-wrap gap-2">
          {tied.map((s) => (
            <Badge key={s.index} tone="warning">
              {s.feature} · {s.points} pts · {s.firstPlaceVotes} first-place
            </Badge>
          ))}
        </div>
      </section>
    );
  }

  const w = rec.winner;
  const possible = possiblePoints(rec);
  return (
    <section
      aria-labelledby="btf-heading"
      className="relative overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-[#4f46e5] via-[#5a45e6] to-[#7c3aed] p-6 text-white elev-3 sm:p-8"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(500px_220px_at_90%_-10%,rgb(255_255_255/0.2),transparent)]"
      />
      <div className="relative">
        <div className="flex items-center gap-2 text-white/85">
          <TrophyIcon size={16} />
          <h2 id="btf-heading" className="text-xs font-semibold tracking-[0.08em] uppercase">
            Build this first
          </h2>
        </div>
        <p className="mt-3 font-display text-3xl leading-tight font-bold break-words sm:text-5xl">{w.feature}</p>
        <p className="mt-3 max-w-2xl text-white/90">
          {`Ranked #1 by Borda count across ${rec.totalVotes} real vote(s), with ${w.firstPlaceVotes} first-place pick(s).`}
        </p>
        <dl className="mt-6 grid grid-cols-3 gap-2 sm:max-w-lg sm:gap-3">
          {[
            ["Borda points", `${w.points}`, `of ${possible}`],
            ["First-place", `${w.firstPlaceVotes}`, `of ${rec.totalVotes}`],
            ["Avg rank", w.averageRank !== null ? w.averageRank.toFixed(1) : "—", `of ${rec.scores.length}`],
          ].map(([label, value, of]) => (
            <div key={label} className="rounded-xl bg-white/12 px-3 py-2.5 ring-1 ring-white/20 backdrop-blur-sm">
              <dt className="text-xs text-white/80">{label}</dt>
              <dd className="mt-0.5 font-display text-xl font-bold tabular-nums sm:text-2xl">
                {value} <span className="text-xs font-medium text-white/75">{of}</span>
              </dd>
            </div>
          ))}
        </dl>
        {smallSample && (
          <p className="mt-5 inline-flex items-start gap-2 rounded-lg bg-black/20 px-3 py-2 text-sm text-white">
            <AlertTriangleIcon size={16} className="mt-0.5 shrink-0" />
            <span>
              Small sample: treat this as directional. Fewer than 5 votes so far.
            </span>
          </p>
        )}
      </div>
    </section>
  );
}

function groupReasons(reasons: VoteReason[], rec: Recommendation) {
  const rank = new Map(rec.scores.map((s, i) => [s.feature, i]));
  const groups = new Map<string, VoteReason[]>();
  for (const r of reasons) groups.set(r.top_feature, [...(groups.get(r.top_feature) ?? []), r]);
  return [...groups.entries()]
    .map(([feature, items]) => ({ feature, items, rank: rank.get(feature) }))
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
}

function Movement({ prev, cur }: { prev: Recommendation; cur: Recommendation }) {
  if (prev.totalVotes === 0 || cur.totalVotes === 0) return null;
  const key = (s: string) => s.trim().toLowerCase();
  const prevRank = new Map(prev.scores.map((s, i) => [key(s.feature), i + 1]));
  const rows = cur.scores
    .map((s, i) => ({ feature: s.feature, now: i + 1, before: prevRank.get(key(s.feature)) }))
    .filter((r): r is { feature: string; now: number; before: number } => r.before !== undefined);
  if (rows.length === 0) return null;
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <caption className="sr-only">Rank change for features tested in both rounds</caption>
        <thead className="bg-subtle text-left text-xs text-muted">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">Feature</th>
            <th scope="col" className="px-3 py-2 text-center font-medium">Before</th>
            <th scope="col" className="px-3 py-2 text-center font-medium">Now</th>
            <th scope="col" className="px-3 py-2 text-right font-medium">Change</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const delta = r.before - r.now;
            return (
              <tr key={r.feature} className="border-t border-border">
                <td className="px-3 py-2.5 font-medium break-words">{r.feature}</td>
                <td className="px-3 py-2.5 text-center text-muted tabular-nums">#{r.before}</td>
                <td className="px-3 py-2.5 text-center font-semibold tabular-nums">#{r.now}</td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap">
                  {delta > 0 ? (
                    <span className="inline-flex items-center gap-0.5 font-medium text-success">
                      <ChevronUpIcon size={14} /> Up {delta}
                    </span>
                  ) : delta < 0 ? (
                    <span className="inline-flex items-center gap-0.5 font-medium text-danger">
                      <ChevronDownIcon size={14} /> Down {-delta}
                    </span>
                  ) : (
                    <span className="text-muted">No change</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
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
  const groups = groupReasons(current.reasons, rec);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="eyebrow">Round {order.round} results</p>
            {order.status === "test" ? (
              <Badge tone="warning">
                <AlertTriangleIcon size={13} /> TEST ORDER (not paid)
              </Badge>
            ) : (
              <StatusBadge status={order.status} />
            )}
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight break-words sm:text-4xl">{order.company_name}</h1>
        </div>
        {isUnlocked(order) && (
          <Link className="btn-ghost text-sm" href={`/order/${order.id}`}>
            <LinkIcon size={16} /> Share voting link
          </Link>
        )}
      </header>

      <dl className="grid grid-cols-3 gap-3">
        <Stat label="Votes" value={rec.totalVotes} />
        <Stat label="Features" value={rec.scores.length || order.features.length} />
        <Stat label="Reasons" value={current.reasons.length} />
      </dl>

      <BuildThisFirst rec={rec} order={order} />

      <section className="card space-y-5" aria-labelledby="ranking-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChartIcon size={18} className="text-accent" />
            <h2 id="ranking-heading" className="text-lg font-semibold">
              Full ranking
            </h2>
          </div>
          <p className="text-xs text-muted">Borda count: #1 earns n−1 points, last earns 0.</p>
        </div>
        {rec.totalVotes === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">No votes yet. These features are waiting to be ranked:</p>
            <ul className="flex flex-wrap gap-2">
              {order.features.map((f) => (
                <li key={f}>
                  <Badge tone="neutral">{f}</Badge>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <Ranking rec={rec} />
        )}
      </section>

      {current.reasons.length > 0 && (
        <section className="space-y-5" aria-labelledby="reasons-heading">
          <div className="flex items-center gap-2">
            <QuoteIcon size={18} className="text-accent" />
            <h2 id="reasons-heading" className="text-lg font-semibold">
              Why voters picked their #1
            </h2>
          </div>
          {groups.map((g) => (
            <div key={g.feature} className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {g.rank !== undefined && <RankBadge rank={g.rank + 1} size="sm" />}
                <h3 className="font-semibold break-words">{g.feature}</h3>
                <Badge tone="accent">{plural(g.items.length, "first-place pick")}</Badge>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2">
                {g.items.map((v, i) => {
                  const date = formatDate(v.created_at);
                  return (
                    <li key={i}>
                      <figure className="h-full rounded-xl border border-border bg-card p-4 elev-1">
                        <QuoteIcon size={16} className="text-accent/60" />
                        <blockquote className="mt-2 leading-relaxed break-words">&ldquo;{v.reason}&rdquo;</blockquote>
                        <figcaption className="mt-3 text-xs text-muted">
                          Participant{date && ` · ${date}`}
                        </figcaption>
                      </figure>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>
      )}

      {previous && (
        <section className="card space-y-6" aria-labelledby="compare-heading">
          <div className="flex items-center gap-2">
            <GitCompareIcon size={18} className="text-accent" />
            <h2 id="compare-heading" className="text-lg font-semibold">
              Compared with Round {previous.order.round}
            </h2>
          </div>
          <Callout
            tone={
              previous.rec.winner && rec.winner
                ? previous.rec.winner.feature === rec.winner.feature
                  ? "success"
                  : "accent"
                : "neutral"
            }
          >
            {previous.rec.winner && rec.winner
              ? previous.rec.winner.feature === rec.winner.feature
                ? `Same top pick both rounds: "${rec.winner.feature}".`
                : `Top pick changed from "${previous.rec.winner.feature}" to "${rec.winner.feature}".`
              : "Both rounds need votes before they can be compared."}
          </Callout>
          <div className="grid gap-4 md:grid-cols-2">
            {[previous, current].map((r) => (
              <div
                key={r.order.id}
                className={`space-y-3 rounded-xl border p-4 ${r === current ? "border-accent/40" : "border-border"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">
                    Round {r.order.round} ({r.rec.totalVotes} votes)
                  </p>
                  {r === current && <Badge tone="accent">This round</Badge>}
                </div>
                <p className="line-clamp-3 text-sm text-muted">{r.order.description}</p>
                <Ranking rec={r.rec} compact />
              </div>
            ))}
          </div>
          <Movement prev={previous.rec} cur={rec} />
          <Link className="link inline-flex min-h-11 items-center gap-1.5 text-sm" href={`/results/${previous.order.id}`}>
            View Round {previous.order.round} results <ArrowRightIcon size={16} />
          </Link>
        </section>
      )}

      <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:flex-wrap">
        {nextId ? (
          <Link className="btn" href={`/results/${nextId}`}>
            View Round {order.round + 1} results <ArrowRightIcon size={16} />
          </Link>
        ) : (
          <Link className="btn" href={`/submit?parent=${order.id}`}>
            Start Round {order.round + 1} with an improved pitch <ArrowRightIcon size={16} />
          </Link>
        )}
        <Link className="btn-ghost" href={`/order/${order.id}`}>
          Order details
        </Link>
      </div>
    </div>
  );
}

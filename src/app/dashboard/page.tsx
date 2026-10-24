import type { Metadata } from "next";
import Link from "next/link";
import { getOrder, getResults, isUnlocked, type Order } from "@/lib/orders";
import { recommend, type Recommendation } from "@/lib/scoring";
import { Badge, StatusBadge } from "@/components/ui";
import { ArrowRightIcon, BarChartIcon, ExternalLinkIcon, InfoIcon, PlusIcon, TrophyIcon } from "@/components/icons";
import { DashboardEmpty, ForgetButton, OpenOrderForm, SavedOrdersLoader } from "./DashboardClient";
import { parseIdsParam } from "./savedOrders";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard · PitchTest" };

/** Loads one order the visitor already holds the id for. Unknown or failing ids are skipped. */
async function load(id: string): Promise<{ order: Order; rec: Recommendation } | null> {
  try {
    const order = await getOrder(id);
    if (!order) return null;
    return { order, rec: recommend(await getResults(order.id)) };
  } catch {
    return null;
  }
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function OrderCard({ order, rec, allIds }: { order: Order; rec: Recommendation; allIds: string[] }) {
  const unlocked = isUnlocked(order);
  const created = formatDate(order.created_at);
  const topPick = rec.winner ? (rec.tie ? "Tied — too close to call" : rec.winner.feature) : null;

  return (
    <article className="card flex flex-col gap-5 p-5 transition-shadow hover:elev-2" aria-labelledby={`o-${order.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted">
            Round {order.round}
            {created && ` · ${created}`}
          </p>
          <h2 id={`o-${order.id}`} className="mt-1 truncate text-lg font-semibold">
            {order.company_name}
          </h2>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-3">
        <div className="rounded-xl bg-subtle px-3.5 py-2.5">
          <dt className="text-xs text-muted">Votes</dt>
          <dd className="font-display text-2xl font-bold tabular-nums">{rec.totalVotes}</dd>
        </div>
        <div className="min-w-0 rounded-xl bg-subtle px-3.5 py-2.5">
          <dt className="flex items-center gap-1 text-xs text-muted">
            <TrophyIcon size={12} /> Current top pick
          </dt>
          <dd className={`mt-1 truncate font-medium ${topPick ? "" : "text-muted"}`} title={topPick ?? undefined}>
            {topPick ?? "No votes yet"}
          </dd>
        </div>
      </dl>

      <div className="mt-auto flex flex-wrap gap-2">
        {unlocked ? (
          <Link href={`/results/${order.id}`} className="btn text-sm">
            <BarChartIcon size={16} /> Results
          </Link>
        ) : (
          <Link href={`/order/${order.id}`} className="btn text-sm">
            Complete checkout <ArrowRightIcon size={16} />
          </Link>
        )}
        {unlocked && (
          <Link href={`/order/${order.id}`} className="btn-ghost text-sm">
            Order
          </Link>
        )}
        {unlocked && (
          <Link href={`/vote/${order.id}`} className="btn-ghost text-sm">
            Vote page <ExternalLinkIcon size={14} />
          </Link>
        )}
        <ForgetButton
          ids={[order.id]}
          remainingIds={allIds.filter((i) => i !== order.id)}
          label="Remove"
          className="ml-auto"
        />
      </div>
    </article>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string | string[] }>;
}) {
  const { ids: raw } = await searchParams;
  const ids = parseIdsParam(raw);
  const loaded = raw === undefined ? [] : await Promise.all(ids.map(load));
  const found = loaded.filter((x): x is NonNullable<typeof x> => x !== null);
  const missing = ids.filter((id) => !found.some((f) => f.order.id.toLowerCase() === id));

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Your pitches</h1>
          <p className="mt-2 max-w-2xl text-muted">
            PitchTest has no accounts, so this list lives in this browser only. It shows pitches created here and any
            order links you add.
          </p>
        </div>
        <Link href="/submit" className="btn">
          <PlusIcon size={16} /> New pitch
        </Link>
      </header>

      {raw === undefined ? (
        <SavedOrdersLoader />
      ) : found.length === 0 ? (
        <DashboardEmpty />
      ) : (
        <section aria-label="Saved pitches" className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Badge tone="neutral">{found.length}</Badge>
            {found.length === 1 ? "pitch" : "pitches"} on this device
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {found.map(({ order, rec }) => (
              <OrderCard key={order.id} order={order} rec={rec} allIds={found.map((f) => f.order.id)} />
            ))}
          </div>
        </section>
      )}

      {missing.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-subtle p-3.5 text-sm text-muted">
          <p className="flex items-center gap-2">
            <InfoIcon size={16} className="shrink-0" />
            {missing.length === 1 ? "1 saved order couldn't be found." : `${missing.length} saved orders couldn't be found.`}
          </p>
          <ForgetButton ids={missing} remainingIds={found.map((f) => f.order.id)} label="Remove from list" />
        </div>
      )}

      <section className="card" aria-label="Open an order">
        <OpenOrderForm currentIds={found.map((f) => f.order.id)} />
      </section>
    </div>
  );
}

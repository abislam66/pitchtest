import Link from "next/link";
import {
  ArrowRightIcon,
  BotIcon,
  ClipboardListIcon,
  CreditCardIcon,
  GitCompareIcon,
  ListOrderedIcon,
  QuoteIcon,
  ScaleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrophyIcon,
  UserCheckIcon,
  UsersIcon,
} from "@/components/icons";
import { Badge, RankBadge } from "@/components/ui";

const TRUST = [
  { icon: <ScaleIcon />, title: "Borda-count ranking", body: "Every position counts, not just #1." },
  { icon: <ShieldCheckIcon />, title: "One vote per participant", body: "Duplicate votes are rejected." },
  { icon: <CreditCardIcon />, title: "Payments via Whop", body: "One-time $5 checkout." },
  { icon: <UsersIcon />, title: "Participants via Terac", body: "Recruited study participants." },
];

const STEPS = [
  {
    icon: <ClipboardListIcon size={20} />,
    title: "Pitch",
    body: "Your company name, a one-paragraph description, and the 3–5 features you're deciding between.",
  },
  {
    icon: <ListOrderedIcon size={20} />,
    title: "Real people rank",
    body: "Participants recruited through Terac put every feature in order and write a one-line reason for their #1.",
  },
  {
    icon: <TrophyIcon size={20} />,
    title: "Build This First",
    body: "A ranked results page with points, first-place votes, average rank and the reasons behind them.",
  },
];

const HONEST = [
  {
    icon: <ScaleIcon size={20} />,
    title: "Borda count, explained",
    body: "With n features, a #1 ranking earns n−1 points and last place earns 0. Points add up across every vote, so broad support beats a few loud fans.",
  },
  {
    icon: <ShieldCheckIcon size={20} />,
    title: "One participant, one vote",
    body: "Each participant can vote once per pitch. Repeat submissions are rejected before they reach your results.",
  },
  {
    icon: <SparklesIcon size={20} />,
    title: "No votes, no verdict",
    body: "We only recommend from real votes. Ties are called ties, and anything under 5 votes is flagged as directional.",
  },
  {
    icon: <GitCompareIcon size={20} />,
    title: "Iterate in rounds",
    body: "Improve the pitch, run Round 2, and see side by side whether the top pick holds or shifts.",
  },
];

const ROADMAP = [
  {
    icon: <ClipboardListIcon size={20} />,
    title: "Feedback becomes engineering tasks",
    body: "Turn the winning feature and the reasons behind it into scoped engineering tasks.",
  },
  {
    icon: <BotIcon size={20} />,
    title: "AI coding agents implement them",
    body: "Coding agents pick up those tasks and prepare the changes for review.",
  },
  {
    icon: <UserCheckIcon size={20} />,
    title: "Human approval before production",
    body: "Nothing is deployed to production until a person reviews and approves it.",
  },
];

/** Illustrative product preview — sample labels only, no numbers or claims. */
function HeroPreview() {
  const rows = [
    { name: "Offline mode", width: "92%" },
    { name: "Team workspaces", width: "64%" },
    { name: "Slack alerts", width: "41%" },
    { name: "CSV export", width: "18%" },
  ];
  return (
    <div className="relative" aria-hidden="true">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-accent/25 via-accent/5 to-transparent blur-2xl" />
      <div className="rounded-[1.25rem] border border-border bg-card p-5 elev-3 sm:p-6">
        <div className="flex items-center justify-between">
          <p className="eyebrow">Results preview</p>
          <Badge tone="neutral">Illustration</Badge>
        </div>
        <div className="mt-4 rounded-xl bg-gradient-to-br from-accent to-[#7c3aed] p-4 text-white">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.08em] text-white/80 uppercase">
            <TrophyIcon size={14} /> Build this first
          </div>
          <p className="mt-1.5 font-display text-2xl font-bold">Offline mode</p>
        </div>
        <ol className="mt-5 space-y-3.5">
          {rows.map((r, i) => (
            <li key={r.name} className="flex items-center gap-3">
              <RankBadge rank={i + 1} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.name}</p>
                <div className="mt-1.5 h-2 rounded-full bg-subtle">
                  <div
                    className={`h-full rounded-full ${i === 0 ? "bg-accent" : "bg-accent/45"}`}
                    style={{ width: r.width }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-border bg-subtle p-3 text-sm text-muted">
          <QuoteIcon size={16} className="mt-0.5 shrink-0 text-accent" />
          <span>Every vote comes with a one-line reason for the #1 pick.</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="space-y-24 sm:space-y-32">
      {/* Hero */}
      <section className="grid items-center gap-12 pt-2 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div className="motion-safe:animate-fade-up">
          <Badge tone="accent">
            <SparklesIcon size={13} /> Feature validation for founders
          </Badge>
          <h1 className="mt-5 text-4xl leading-[1.08] font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Know which feature to build{" "}
            <span className="bg-gradient-to-r from-accent to-[#8b5cf6] bg-clip-text text-transparent">first</span>.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Describe your startup and 3–5 features you&apos;re considering. Real people rank them and tell you why. You
            get a &ldquo;Build This First&rdquo; recommendation based on their actual votes.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/submit" className="btn btn-lg">
              Test my pitch — $5 <ArrowRightIcon />
            </Link>
            <Link href="#how-it-works" className="btn-ghost btn-lg">
              See how it works
            </Link>
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
            {["One-time $5 via Whop", "No PitchTest account needed", "Results from real votes only"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <ShieldCheckIcon size={15} className="text-success" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <HeroPreview />
      </section>

      {/* Trust facts */}
      <section aria-labelledby="trust-heading">
        <h2 id="trust-heading" className="sr-only">
          How results stay trustworthy
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map((t) => (
            <li key={t.title} className="flex items-start gap-3 rounded-card border border-border bg-card/70 p-4">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-soft-fg">
                {t.icon}
              </span>
              <div>
                <p className="font-semibold">{t.title}</p>
                <p className="text-sm text-muted">{t.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* How it works */}
      <section id="how-it-works" aria-labelledby="how-heading" className="scroll-mt-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">How it works</p>
          <h2 id="how-heading" className="mt-3 text-3xl font-bold sm:text-4xl">
            From pitch to priority in three steps
          </h2>
          <p className="mt-4 text-muted">
            Stop guessing your roadmap. Put your options in front of real people and let the ranking decide.
          </p>
        </div>
        <ol className="relative mt-12 grid gap-5 md:grid-cols-3">
          <span
            aria-hidden="true"
            className="absolute top-11 right-[16%] left-[16%] hidden h-px bg-gradient-to-r from-transparent via-border-strong to-transparent md:block"
          />
          {STEPS.map((s, i) => (
            <li key={s.title} className="card relative transition-shadow hover:elev-2">
              <div className="flex items-center gap-3">
                <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-fg elev-1">
                  {s.icon}
                </span>
                <span className="font-display text-sm font-semibold text-muted">Step {i + 1}</span>
              </div>
              <h3 className="mt-5 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Honest by design */}
      <section aria-labelledby="honest-heading" className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div>
          <p className="eyebrow">Honest by design</p>
          <h2 id="honest-heading" className="mt-3 text-3xl font-bold sm:text-4xl">
            A recommendation you can defend
          </h2>
          <p className="mt-4 text-muted">
            The results page shows the method, not just the answer: how many people voted, how the points were counted,
            and what they said.
          </p>
          <Link href="/submit" className="link mt-6 inline-flex min-h-11 items-center gap-1.5">
            Start your first round <ArrowRightIcon size={16} />
          </Link>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {HONEST.map((h) => (
            <li key={h.title} className="card">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent-soft-fg">
                {h.icon}
              </span>
              <h3 className="mt-4 font-semibold">{h.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{h.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Coming next (planned) */}
      <section
        aria-labelledby="next-heading"
        className="rounded-[1.5rem] border border-dashed border-border-strong bg-subtle/70 p-6 sm:p-10"
      >
        <div className="flex flex-wrap items-center gap-3">
          <p className="eyebrow">Coming next</p>
          <Badge tone="warning">Planned · not yet available</Badge>
        </div>
        <h2 id="next-heading" className="mt-3 text-2xl font-bold sm:text-3xl">
          From validated feedback to shipped code
        </h2>
        <p className="mt-3 max-w-2xl text-muted">
          Where PitchTest is headed after validation. None of this is live today — it&apos;s our roadmap, shared so you
          know what we&apos;re building toward.
        </p>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {ROADMAP.map((r, i) => (
            <li key={r.title} className="rounded-card border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-subtle text-muted">
                  {r.icon}
                </span>
                <span className="font-display text-xs font-semibold text-muted">Planned · {i + 1}/3</span>
              </div>
              <h3 className="mt-4 font-semibold">{r.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{r.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[#4f46e5] via-[#5b45e8] to-[#7c3aed] px-6 py-12 text-center text-white elev-3 sm:px-12 sm:py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_200px_at_50%_0%,rgb(255_255_255/0.18),transparent)]"
        />
        <h2 className="relative text-3xl font-bold sm:text-4xl">Your next feature, decided by real people.</h2>
        <p className="relative mx-auto mt-3 max-w-xl text-white/85">
          Pitch it, pay $5, share the link, and get a ranked answer backed by real votes.
        </p>
        <Link
          href="/submit"
          className="relative mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-white px-6 font-semibold text-[#3730a3] elev-2 transition-transform hover:-translate-y-0.5 focus-visible:outline-white"
        >
          Test my pitch — $5 <ArrowRightIcon />
        </Link>
      </section>
    </div>
  );
}

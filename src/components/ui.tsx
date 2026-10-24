import type { OrderStatus } from "@/lib/orders";
import { CheckIcon, CreditCardIcon, ShieldCheckIcon, AlertTriangleIcon } from "./icons";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

const toneClass: Record<Tone, string> = {
  neutral: "border-border bg-subtle text-muted",
  accent: "border-transparent bg-accent-soft text-accent-soft-fg",
  success: "border-transparent bg-success-soft text-success",
  warning: "border-warning-border bg-warning-soft text-warning",
  danger: "border-transparent bg-danger-soft text-danger",
};

export function Badge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${toneClass[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/** Payment status. Test orders are always labelled as not paid. */
export function StatusBadge({ status }: { status: OrderStatus }) {
  if (status === "paid")
    return (
      <Badge tone="success">
        <ShieldCheckIcon size={13} /> Paid
      </Badge>
    );
  if (status === "test")
    return (
      <Badge tone="warning">
        <AlertTriangleIcon size={13} /> Test order — not paid
      </Badge>
    );
  return (
    <Badge tone="neutral">
      <CreditCardIcon size={13} /> Awaiting payment
    </Badge>
  );
}

export function Callout({
  tone = "neutral",
  icon,
  children,
  className = "",
}: {
  tone?: Tone;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex gap-3 rounded-xl border p-3.5 text-sm ${toneClass[tone]} ${className}`}>
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0 flex-1 leading-relaxed">{children}</div>
    </div>
  );
}

export function RankBadge({ rank, size = "md" }: { rank: number; size?: "sm" | "md" | "lg" }) {
  const dims = size === "lg" ? "h-11 w-11 text-lg" : size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";
  const tone =
    rank === 1
      ? "bg-accent text-accent-fg elev-1"
      : rank === 2
        ? "bg-accent-soft text-accent-soft-fg"
        : "bg-subtle text-muted border border-border";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold tabular-nums ${dims} ${tone}`}
    >
      <span className="sr-only">Rank </span>
      {rank}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-card border border-dashed border-border-strong bg-subtle/60 px-6 py-10 text-center">
      <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card text-accent elev-1">
        {icon}
      </span>
      <h3 className="text-lg font-semibold">{title}</h3>
      {children && <div className="mt-1.5 max-w-md text-sm text-muted">{children}</div>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

const STEPS = ["Pitch", "Checkout", "Share & collect votes"] as const;

/** Founder journey: Pitch → Checkout → Share & collect votes. `current` is 0-based. */
export function Stepper({ current }: { current: 0 | 1 | 2 }) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-start">
        {STEPS.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} className="relative flex flex-1 flex-col items-center text-center" aria-current={active ? "step" : undefined}>
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className={`absolute top-3.5 right-1/2 h-0.5 -translate-x-4 rounded ${i <= current ? "bg-accent" : "bg-border"}`}
                  style={{ width: "calc(100% - 2rem)" }}
                />
              )}
              <span
                className={`relative z-10 inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  done
                    ? "bg-accent text-accent-fg"
                    : active
                      ? "bg-card text-accent ring-2 ring-accent"
                      : "border border-border-strong bg-card text-muted"
                }`}
              >
                {done ? <CheckIcon size={14} strokeWidth={3} /> : i + 1}
              </span>
              <span className={`mt-2 px-1 text-xs leading-tight sm:text-sm ${active ? "font-semibold text-fg" : "text-muted"}`}>
                {label}
                {done && <span className="sr-only"> (completed)</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 elev-1">
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="mt-1 font-display text-2xl font-bold tabular-nums">{value}</dd>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

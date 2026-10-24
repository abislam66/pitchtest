"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { AlertTriangleIcon, ArrowRightIcon, PlusIcon, SpinnerIcon, XIcon } from "@/components/icons";
import { rememberOrder } from "@/app/dashboard/savedOrders";

type Initial = { companyName: string; description: string; features: string[] };

const MIN_FEATURES = 3;
const MAX_FEATURES = 5;
const EXAMPLES = ["Offline mode", "Team workspaces", "Slack notifications", "CSV export", "Dark mode"];

function Counter({ value, max, id }: { value: number; max: number; id?: string }) {
  const near = value > max * 0.9;
  return (
    <span id={id} className={`text-xs tabular-nums ${near ? "font-medium text-warning" : "text-muted"}`}>
      {value}/{max}
    </span>
  );
}

export function SubmitForm({ parentOrderId, initial }: { parentOrderId?: string; initial?: Initial }) {
  const router = useRouter();
  const uid = useId();
  const [companyName, setCompanyName] = useState(initial?.companyName ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [features, setFeatures] = useState<string[]>(initial?.features ?? ["", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const setFeature = (i: number, v: string) => setFeatures((f) => f.map((x, j) => (j === i ? v : x)));

  // Index of an earlier feature with the same text (case-insensitive), per row.
  const duplicateOf = features.map((f, i) => {
    const key = f.trim().toLowerCase();
    if (!key) return -1;
    return features.findIndex((g, j) => j < i && g.trim().toLowerCase() === key);
  });
  const hasDuplicates = duplicateOf.some((d) => d >= 0);
  const filled = features.filter((f) => f.trim().length >= 2).length;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (hasDuplicates) {
      setError("Each feature needs to be different so voters can tell them apart.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          description,
          features: features.map((f) => f.trim()).filter(Boolean),
          parentOrderId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      // Remember this order on this device for the dashboard (browser storage only).
      rememberOrder({ id: data.orderId, companyName: companyName.trim(), createdAt: new Date().toISOString() });
      router.push(`/order/${data.orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="card space-y-5" aria-labelledby={`${uid}-about`}>
        <div className="flex items-center gap-3">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft font-display text-sm font-bold text-accent-soft-fg">
            1
          </span>
          <h2 id={`${uid}-about`} className="text-lg font-semibold">
            Your startup
          </h2>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor={`${uid}-name`} className="font-medium">
              Company name
            </label>
            <Counter value={companyName.length} max={120} />
          </div>
          <input
            id={`${uid}-name`}
            className="input"
            required
            maxLength={120}
            autoComplete="organization"
            placeholder="e.g. Acme Invoicing"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor={`${uid}-desc`} className="font-medium">
              What does it do?
            </label>
            <Counter value={description.length} max={1000} />
          </div>
          <textarea
            id={`${uid}-desc`}
            className="input min-h-32 resize-y leading-relaxed"
            required
            minLength={10}
            maxLength={1000}
            aria-describedby={`${uid}-desc-hint`}
            placeholder="One paragraph: who it's for, the problem, and how you solve it."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <p id={`${uid}-desc-hint`} className="text-xs text-muted">
            Voters read this first. Plain language beats jargon. At least 10 characters.
          </p>
        </div>
      </section>

      <fieldset className="card space-y-4" aria-labelledby={`${uid}-feat`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft font-display text-sm font-bold text-accent-soft-fg">
              2
            </span>
            <h2 id={`${uid}-feat`} className="text-lg font-semibold">
              Proposed features (3–5)
            </h2>
          </div>
          <span className="text-sm text-muted tabular-nums" aria-live="polite">
            {filled} of {features.length} filled
          </span>
        </div>
        <p className="text-sm text-muted">
          Short, concrete names work best. Voters will rank every one of them, top pick first.
        </p>

        <ol className="space-y-3">
          {features.map((f, i) => {
            const dup = duplicateOf[i];
            const inputId = `${uid}-f${i}`;
            return (
              <li key={i} className="space-y-1">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-subtle font-display text-sm font-semibold text-muted sm:inline-flex">
                    {i + 1}
                  </span>
                  <label htmlFor={inputId} className="sr-only">
                    Feature {i + 1}
                  </label>
                  <input
                    id={inputId}
                    className="input"
                    required
                    minLength={2}
                    maxLength={120}
                    aria-invalid={dup >= 0 || undefined}
                    aria-describedby={dup >= 0 ? `${inputId}-dup` : undefined}
                    placeholder={`Feature ${i + 1}, e.g. ${EXAMPLES[i] ?? "Something new"}`}
                    value={f}
                    onChange={(e) => setFeature(i, e.target.value)}
                  />
                  {features.length > MIN_FEATURES && (
                    <button
                      type="button"
                      className="btn-ghost h-11 w-11 shrink-0 px-0 text-muted hover:text-danger"
                      aria-label={`Remove feature ${i + 1}`}
                      onClick={() => setFeatures((fs) => fs.filter((_, j) => j !== i))}
                    >
                      <XIcon />
                    </button>
                  )}
                </div>
                <div className="flex justify-between gap-3 sm:pl-11">
                  {dup >= 0 ? (
                    <p id={`${inputId}-dup`} className="flex items-center gap-1 text-xs font-medium text-danger">
                      <AlertTriangleIcon size={13} /> Same as feature {dup + 1}
                    </p>
                  ) : (
                    <span />
                  )}
                  {f.length > 0 && <Counter value={f.length} max={120} />}
                </div>
              </li>
            );
          })}
        </ol>

        {features.length < MAX_FEATURES ? (
          <button
            type="button"
            className="btn-ghost w-full border-dashed text-sm text-muted hover:text-fg"
            onClick={() => setFeatures((fs) => [...fs, ""])}
          >
            <PlusIcon size={16} /> Add feature ({features.length}/{MAX_FEATURES})
          </button>
        ) : (
          <p className="text-center text-xs text-muted">Maximum of {MAX_FEATURES} features reached.</p>
        )}
      </fieldset>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-transparent bg-danger-soft p-3.5 text-sm text-danger">
          <AlertTriangleIcon size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-3">
        <button className="btn btn-lg w-full" disabled={submitting}>
          {submitting ? (
            <>
              <SpinnerIcon /> Saving…
            </>
          ) : (
            <>
              Continue to checkout <ArrowRightIcon />
            </>
          )}
        </button>
        <p className="text-center text-xs text-muted">
          You&apos;ll review your order and pay $5 with Whop on the next step.
        </p>
      </div>
    </form>
  );
}

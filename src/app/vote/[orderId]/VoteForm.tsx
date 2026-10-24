"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { AlertTriangleIcon, CheckCircleIcon, CheckIcon, ChevronDownIcon, ChevronUpIcon, SpinnerIcon } from "@/components/icons";

export function VoteForm({
  orderId,
  features,
  teracSubmissionId,
  teracTaskId,
}: {
  orderId: string;
  features: string[];
  teracSubmissionId?: string;
  teracTaskId?: string;
}) {
  const uid = useId();
  // order[i] is a feature index; position 0 is the voter's top pick
  const [order, setOrder] = useState(() => features.map((_, i) => i));
  const [reason, setReason] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [lastMoved, setLastMoved] = useState<{ featureIndex: number; dir: -1 | 1; seq: number } | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const listRef = useRef<HTMLOListElement>(null);
  const prevTops = useRef(new Map<number, number>());

  const rows = () => Array.from(listRef.current?.querySelectorAll<HTMLElement>("[data-feature]") ?? []);

  const move = (pos: number, delta: number) => {
    const target = pos + delta;
    if (target < 0 || target >= order.length) return;
    // Record positions before the swap so the reorder can animate (FLIP).
    prevTops.current = new Map(rows().map((el) => [Number(el.dataset.feature), el.getBoundingClientRect().top]));
    const featureIndex = order[pos];
    setOrder((o) => {
      const next = [...o];
      if (target < 0 || target >= next.length) return o;
      [next[pos], next[target]] = [next[target], next[pos]];
      return next;
    });
    setTouched(true);
    setLastMoved({ featureIndex, dir: delta < 0 ? -1 : 1, seq: Date.now() });
    setAnnouncement(`${features[featureIndex]} moved to position ${target + 1} of ${order.length}.`);
  };

  // Smoothly slide rows from their old position to the new one.
  useLayoutEffect(() => {
    const before = prevTops.current;
    if (before.size === 0) return;
    prevTops.current = new Map();
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    for (const el of rows()) {
      const prev = before.get(Number(el.dataset.feature));
      if (prev === undefined) continue;
      const dy = prev - el.getBoundingClientRect().top;
      if (Math.abs(dy) < 1 || typeof el.animate !== "function") continue;
      el.animate([{ transform: `translateY(${dy}px)` }, { transform: "translateY(0)" }], {
        duration: 240,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      });
    }
  }, [order]);

  // Keep keyboard focus on the item that moved (falls back to the other arrow at the ends).
  useEffect(() => {
    if (!lastMoved) return;
    const row = listRef.current?.querySelector<HTMLElement>(`[data-feature="${lastMoved.featureIndex}"]`);
    if (!row) return;
    const same = row.querySelector<HTMLButtonElement>(lastMoved.dir < 0 ? '[data-dir="up"]' : '[data-dir="down"]');
    const other = row.querySelector<HTMLButtonElement>(lastMoved.dir < 0 ? '[data-dir="down"]' : '[data-dir="up"]');
    const target = same && !same.disabled ? same : other;
    if (target && document.activeElement !== target) target.focus({ preventScroll: true });
  }, [lastMoved]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setError(null);
    const res = await fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, ranking: order, reason, teracSubmissionId, teracTaskId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Could not submit your vote");
      setState("idle");
      return;
    }
    setState("done");
    if (data.redirectTo) window.location.href = data.redirectTo;
  }

  if (state === "done") {
    return (
      <div className="card flex flex-col items-center px-6 py-12 text-center" role="status">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success motion-safe:animate-pop">
          <CheckCircleIcon size={34} />
        </span>
        <h2 className="mt-5 text-2xl font-semibold">Thanks — your vote was recorded.</h2>
        {teracSubmissionId ? (
          <p className="mt-2 flex items-center gap-2 text-muted">
            <SpinnerIcon size={16} /> Returning you to Terac…
          </p>
        ) : (
          <p className="mt-2 text-muted">Your ranking and reason have been added to the results. You can close this tab.</p>
        )}
      </div>
    );
  }

  const reasonOk = reason.trim().length >= 3;
  const steps = [
    { label: "Rank the features", done: touched || reasonOk },
    { label: "Explain your #1", done: reasonOk },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const topFeature = features[order[0]];

  return (
    <form onSubmit={submit} className="card space-y-6 p-5 sm:p-7">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Rank these features</h2>
            <p className="mt-1 text-sm text-muted">Put the one you&apos;d most want built first at the top.</p>
          </div>
          <p className="text-xs font-medium text-muted tabular-nums">
            <span className="sr-only">Progress: </span>
            {doneCount} of {steps.length} done
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2" aria-hidden="true">
          {steps.map((s) => (
            <div key={s.label}>
              <div className="h-1.5 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
                  style={{ width: s.done ? "100%" : "0%" }}
                />
              </div>
              <p className={`mt-1.5 flex items-center gap-1 text-xs ${s.done ? "font-medium text-fg" : "text-muted"}`}>
                {s.done && <CheckIcon size={12} strokeWidth={3} className="text-success" />}
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <ol ref={listRef} className="space-y-2.5" aria-label="Your ranking, top pick first">
        {order.map((featureIndex, pos) => {
          const isTop = pos === 0;
          const recent = lastMoved?.featureIndex === featureIndex;
          const labelId = `${uid}-feature-${featureIndex}`;
          return (
            <li
              key={featureIndex}
              data-feature={featureIndex}
              className={`relative flex items-center gap-3 rounded-xl border p-2.5 pl-3 transition-[border-color,background-color,box-shadow] duration-200 sm:gap-4 sm:p-3 sm:pl-4 ${
                isTop
                  ? "border-accent/50 bg-accent-soft/60 elev-1"
                  : recent
                    ? "border-accent/40 bg-card"
                    : "border-border bg-card"
              }`}
            >
              <span
                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold tabular-nums transition-colors ${
                  isTop ? "bg-accent text-accent-fg" : "border border-border bg-subtle text-muted"
                }`}
              >
                <span className="sr-only">Position </span>
                {pos + 1}
              </span>
              <div className="min-w-0 flex-1 py-1">
                <span id={labelId} className="block font-medium break-words">
                  {features[featureIndex]}
                </span>
                {isTop && <span className="mt-0.5 block text-xs font-semibold text-accent">Your top pick</span>}
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  data-dir="up"
                  className="btn-ghost h-11 w-11 px-0"
                  aria-label="Move up"
                  aria-describedby={labelId}
                  disabled={pos === 0}
                  onClick={() => move(pos, -1)}
                >
                  <ChevronUpIcon size={20} />
                </button>
                <button
                  type="button"
                  data-dir="down"
                  className="btn-ghost h-11 w-11 px-0"
                  aria-label="Move down"
                  aria-describedby={labelId}
                  disabled={pos === order.length - 1}
                  onClick={() => move(pos, 1)}
                >
                  <ChevronDownIcon size={20} />
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      <div className="space-y-1.5">
        <label htmlFor={`${uid}-reason`} className="block font-medium">
          In one line: why is your #1 pick the most important?
        </label>
        <input
          id={`${uid}-reason`}
          className="input"
          required
          minLength={3}
          maxLength={200}
          aria-describedby={`${uid}-reason-hint`}
          placeholder="e.g. It solves the problem I hit every week"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div id={`${uid}-reason-hint`} className="flex justify-between gap-3 text-xs text-muted">
          <span className="min-w-0 truncate">
            Your #1: <span className="font-medium text-fg">{topFeature}</span>
          </span>
          <span className="shrink-0 tabular-nums">{reason.length}/200</span>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl bg-danger-soft p-3.5 text-sm text-danger">
          <AlertTriangleIcon size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-3">
        <button className="btn btn-lg w-full" disabled={state === "sending"}>
          {state === "sending" ? (
            <>
              <SpinnerIcon /> Submitting…
            </>
          ) : (
            "Submit vote"
          )}
        </button>
        <p className="text-center text-xs text-muted">
          One vote per participant. Your one-line reason is shared with the founder on the results page.
        </p>
      </div>
    </form>
  );
}

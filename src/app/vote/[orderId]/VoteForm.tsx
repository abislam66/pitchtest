"use client";

import { useState } from "react";

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
  // order[i] is a feature index; position 0 is the voter's top pick
  const [order, setOrder] = useState(() => features.map((_, i) => i));
  const [reason, setReason] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const move = (pos: number, delta: number) =>
    setOrder((o) => {
      const next = [...o];
      const target = pos + delta;
      if (target < 0 || target >= next.length) return o;
      [next[pos], next[target]] = [next[target], next[pos]];
      return next;
    });

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
      <div className="card">
        <h2 className="text-xl font-semibold">Thanks — your vote was recorded.</h2>
        {teracSubmissionId && <p className="mt-2 text-muted">Returning you to Terac…</p>}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-5">
      <div>
        <h2 className="font-semibold">Rank these features</h2>
        <p className="text-sm text-muted">Put the one you&apos;d most want built first at the top.</p>
      </div>
      <ol className="space-y-2">
        {order.map((featureIndex, pos) => (
          <li key={featureIndex} className="flex items-center gap-3 rounded-lg border border-border p-3">
            <span className="w-6 text-center font-semibold text-accent">{pos + 1}</span>
            <span className="flex-1">{features[featureIndex]}</span>
            <button type="button" className="btn-ghost px-2 py-1" aria-label="Move up" disabled={pos === 0} onClick={() => move(pos, -1)}>
              ↑
            </button>
            <button
              type="button"
              className="btn-ghost px-2 py-1"
              aria-label="Move down"
              disabled={pos === order.length - 1}
              onClick={() => move(pos, 1)}
            >
              ↓
            </button>
          </li>
        ))}
      </ol>
      <label className="block space-y-1">
        <span className="font-medium">In one line: why is your #1 pick the most important?</span>
        <input className="input" required minLength={3} maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn w-full" disabled={state === "sending"}>
        {state === "sending" ? "Submitting…" : "Submit vote"}
      </button>
    </form>
  );
}

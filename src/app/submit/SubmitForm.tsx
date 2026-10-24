"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Initial = { companyName: string; description: string; features: string[] };

export function SubmitForm({ parentOrderId, initial }: { parentOrderId?: string; initial?: Initial }) {
  const router = useRouter();
  const [companyName, setCompanyName] = useState(initial?.companyName ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [features, setFeatures] = useState<string[]>(initial?.features ?? ["", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const setFeature = (i: number, v: string) => setFeatures((f) => f.map((x, j) => (j === i ? v : x)));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
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
      router.push(`/order/${data.orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-5">
      <label className="block space-y-1">
        <span className="font-medium">Company name</span>
        <input className="input" required maxLength={120} value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
      </label>
      <label className="block space-y-1">
        <span className="font-medium">What does it do?</span>
        <textarea
          className="input min-h-28"
          required
          minLength={10}
          maxLength={1000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <span className="text-xs text-muted">{description.length}/1000</span>
      </label>
      <fieldset className="space-y-2">
        <legend className="font-medium">Proposed features (3–5)</legend>
        {features.map((f, i) => (
          <div key={i} className="flex gap-2">
            <input
              className="input"
              required
              maxLength={120}
              placeholder={`Feature ${i + 1}`}
              value={f}
              onChange={(e) => setFeature(i, e.target.value)}
            />
            {features.length > 3 && (
              <button
                type="button"
                className="btn-ghost"
                aria-label={`Remove feature ${i + 1}`}
                onClick={() => setFeatures((fs) => fs.filter((_, j) => j !== i))}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        {features.length < 5 && (
          <button type="button" className="btn-ghost text-sm" onClick={() => setFeatures((fs) => [...fs, ""])}>
            + Add feature
          </button>
        )}
      </fieldset>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn w-full" disabled={submitting}>
        {submitting ? "Saving…" : "Continue to checkout"}
      </button>
    </form>
  );
}

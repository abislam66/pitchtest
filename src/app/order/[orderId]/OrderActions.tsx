"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangleIcon, CheckIcon, InfoIcon, LockIcon } from "@/components/icons";

export function OrderActions({
  orderId,
  checkoutAvailable,
  demoAvailable,
  returnStatus,
}: {
  orderId: string;
  checkoutAvailable: boolean;
  demoAvailable: boolean;
  returnStatus: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");

  async function checkout() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) {
      setError(data.error ?? "Could not start checkout");
      setBusy(false);
      return;
    }
    window.location.href = data.url;
  }

  async function demoUnlock(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/orders/${orderId}/demo-unlock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Unlock failed");
    router.refresh();
  }

  return (
    <section className="card space-y-5" aria-labelledby="unlock-heading">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Step 2 · Checkout</p>
          <h2 id="unlock-heading" className="mt-1 text-lg font-semibold">
            Unlock voting — $5
          </h2>
        </div>
        <p className="font-display text-3xl font-bold tabular-nums">
          $5<span className="ml-1 text-sm font-medium text-muted">once</span>
        </p>
      </div>

      <ul className="space-y-2 text-sm">
        {["Public voting link for participants", "Borda-count ranking & Build This First pick", "One-line reasons from every voter"].map((t) => (
          <li key={t} className="flex items-center gap-2">
            <CheckIcon size={16} className="shrink-0 text-success" />
            {t}
          </li>
        ))}
      </ul>

      {returnStatus === "succeeded" && (
        <div className="flex items-start gap-2 rounded-xl bg-accent-soft p-3 text-sm text-accent-soft-fg" role="status">
          <InfoIcon size={16} className="mt-0.5 shrink-0" />
          <p>Checkout finished. Waiting for Whop to confirm the payment server-side… refresh in a few seconds.</p>
        </div>
      )}
      {returnStatus === "failed" && (
        <div className="flex items-start gap-2 rounded-xl bg-danger-soft p-3 text-sm text-danger" role="alert">
          <AlertTriangleIcon size={16} className="mt-0.5 shrink-0" />
          <p>The payment failed. You can try again.</p>
        </div>
      )}

      <div className="space-y-2">
        <button className="btn btn-lg w-full" onClick={checkout} disabled={busy || !checkoutAvailable}>
          <LockIcon size={16} />
          Pay $5 with Whop
        </button>
        {checkoutAvailable ? (
          <p className="text-center text-xs text-muted">You&apos;ll be redirected to Whop&apos;s secure checkout.</p>
        ) : (
          <p className="text-sm text-muted">Checkout isn&apos;t configured on this deployment yet.</p>
        )}
      </div>

      {demoAvailable && (
        <form onSubmit={demoUnlock} className="space-y-2.5 border-t border-border pt-5">
          <p className="eyebrow">Judge demo</p>
          <p className="text-sm text-muted">Judges: enter the demo access code to unlock without paying (marked as a test order).</p>
          <div className="flex gap-2">
            <label htmlFor="demo-code" className="sr-only">
              Demo access code
            </label>
            <input
              id="demo-code"
              className="input"
              type="password"
              autoComplete="off"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Demo access code"
            />
            <button className="btn-ghost shrink-0" disabled={busy || !code}>
              Unlock
            </button>
          </div>
        </form>
      )}
      {error && (
        <p role="alert" className="flex items-start gap-2 text-sm text-danger">
          <AlertTriangleIcon size={16} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}
    </section>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
    <div className="card space-y-4">
      <h2 className="font-semibold">Unlock voting — $5</h2>
      {returnStatus === "succeeded" && (
        <p className="text-sm text-muted">
          Checkout finished. Waiting for Whop to confirm the payment server-side… refresh in a few seconds.
        </p>
      )}
      {returnStatus === "failed" && <p className="text-sm text-red-600">The payment failed. You can try again.</p>}
      <button className="btn" onClick={checkout} disabled={busy || !checkoutAvailable}>
        Pay $5 with Whop
      </button>
      {!checkoutAvailable && <p className="text-sm text-muted">Checkout isn&apos;t configured on this deployment yet.</p>}

      {demoAvailable && (
        <form onSubmit={demoUnlock} className="space-y-2 border-t border-border pt-4">
          <p className="text-sm text-muted">Judges: enter the demo access code to unlock without paying (marked as a test order).</p>
          <div className="flex gap-2">
            <input className="input" type="password" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Demo access code" />
            <button className="btn-ghost" disabled={busy || !code}>
              Unlock
            </button>
          </div>
        </form>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

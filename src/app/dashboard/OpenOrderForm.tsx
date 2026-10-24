"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { AlertTriangleIcon, ArrowRightIcon } from "@/components/icons";
import { dashboardHref, parseOrderRef, rememberOrder } from "./savedOrders";

/** Adds an order (by URL or UUID) to this browser's saved list, then reloads the dashboard. Frontend only. */
export function OpenOrderForm({ currentIds = [] }: { currentIds?: string[] }) {
  const router = useRouter();
  const uid = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = parseOrderRef(value);
    if (!id) {
      setError("Paste an order, voting or results link, or the order ID itself.");
      return;
    }
    setError(null);
    const saved = rememberOrder({ id, companyName: "", createdAt: new Date().toISOString() });
    // If browser storage is unavailable, still show the order alongside the current list.
    const ids = saved ? saved.map((o) => o.id) : [id, ...currentIds.filter((c) => c !== id)];
    setValue("");
    router.push(dashboardHref(ids));
  }

  return (
    <form onSubmit={onSubmit} className="w-full space-y-2 text-left" noValidate>
      <label htmlFor={`${uid}-ref`} className="block text-sm font-medium">
        Open an order
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id={`${uid}-ref`}
          className="input font-mono text-sm"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="https://…/results/… or order ID"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${uid}-err` : `${uid}-hint`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button className="btn-ghost shrink-0" disabled={!value.trim()}>
          Add to dashboard <ArrowRightIcon size={16} />
        </button>
      </div>
      {error ? (
        <p id={`${uid}-err`} role="alert" className="flex items-center gap-1.5 text-xs font-medium text-danger">
          <AlertTriangleIcon size={13} /> {error}
        </p>
      ) : (
        <p id={`${uid}-hint`} className="text-xs text-muted">
          Saved in this browser only. Works with order, voting and results links.
        </p>
      )}
    </form>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutGridIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { EmptyState } from "@/components/ui";
import { OpenOrderForm } from "./OpenOrderForm";
import { dashboardHref, forgetOrders, MAX_SAVED, readSavedOrders } from "./savedOrders";

export function DashboardEmpty() {
  return (
    <EmptyState
      icon={<LayoutGridIcon size={22} />}
      title="No pitches on this device yet"
      action={
        <Link href="/submit" className="btn">
          <PlusIcon size={16} /> Test a pitch — $5
        </Link>
      }
    >
      Pitches you create in this browser show up here automatically. Already have an order link? Add it below.
    </EmptyState>
  );
}

/** With no `ids` in the URL: read this browser's saved order ids and load them via the URL. */
export function SavedOrdersLoader() {
  const router = useRouter();
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    const ids = readSavedOrders()
      .map((o) => o.id)
      .slice(0, MAX_SAVED);
    if (ids.length > 0) router.replace(dashboardHref(ids));
    else setEmpty(true);
  }, [router]);

  if (!empty) {
    return (
      <div className="grid gap-4 sm:grid-cols-2" aria-busy="true" aria-label="Loading your pitches">
        {[0, 1].map((i) => (
          <div key={i} className="card h-56 animate-pulse bg-subtle/60" />
        ))}
      </div>
    );
  }
  return <DashboardEmpty />;
}

/** Removes ids from this browser's list (does not touch the order itself). */
export function ForgetButton({
  ids,
  remainingIds,
  label,
  className = "",
}: {
  ids: string[];
  remainingIds: string[];
  label: string;
  className?: string;
}) {
  const router = useRouter();
  function onClick() {
    const left = forgetOrders(ids);
    const next = left ? left.map((o) => o.id) : remainingIds;
    router.replace(dashboardHref(next));
  }
  return (
    <button type="button" onClick={onClick} className={`btn-ghost text-sm text-muted hover:text-danger ${className}`}>
      <TrashIcon size={15} /> {label}
    </button>
  );
}

export { OpenOrderForm };

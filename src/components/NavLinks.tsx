"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks() {
  const pathname = usePathname();
  const onDashboard = pathname?.startsWith("/dashboard");
  const onSubmit = pathname?.startsWith("/submit");

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Link
        href="/#how-it-works"
        className="hidden min-h-11 items-center rounded-control px-3 text-sm font-medium text-muted transition-colors hover:bg-subtle hover:text-fg sm:inline-flex"
      >
        How it works
      </Link>
      <Link
        href="/dashboard"
        aria-current={onDashboard ? "page" : undefined}
        className={`inline-flex min-h-11 items-center rounded-control px-3 text-sm font-medium transition-colors hover:bg-subtle hover:text-fg ${
          onDashboard ? "text-fg" : "text-muted"
        }`}
      >
        Dashboard
      </Link>
      <Link
        href="/submit"
        aria-current={onSubmit ? "page" : undefined}
        className="btn ml-1 px-3.5 py-2 text-sm"
      >
        Test a pitch
      </Link>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { CheckIcon, CopyIcon } from "./icons";

/** Copies text to the clipboard. Shows nothing misleading if the clipboard is unavailable. */
export function CopyButton({ text, label = "Copy link" }: { text: string; label?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const t = setTimeout(() => setState("idle"), 2000);
    return () => clearTimeout(t);
  }, [state]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
  }

  return (
    <button type="button" className="btn-ghost shrink-0 text-sm" onClick={copy}>
      {state === "copied" ? <CheckIcon size={16} className="text-success" /> : <CopyIcon size={16} />}
      <span aria-live="polite">{state === "copied" ? "Copied" : state === "failed" ? "Copy failed — select the link" : label}</span>
    </button>
  );
}

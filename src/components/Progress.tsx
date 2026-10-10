"use client";

import { Check, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { clearDone, setDone, useDone } from "@/store/progress";

/** Small checkbox shown at the start of a problem row. */
export function DoneCheckbox({ slug, title }: { slug: string; title: string }) {
  const done = useDone().has(slug);
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={`Mark "${title}" as done`}
      title={done ? "Done. Click to unmark." : "Mark as done"}
      onClick={() => setDone(slug, !done)}
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded border transition-colors",
        done
          ? "border-emerald-500 bg-emerald-500 text-white"
          : "border-fg/25 text-transparent hover:border-emerald-500/70 hover:text-emerald-500/50",
      )}
    >
      <Check size={13} strokeWidth={3} />
    </button>
  );
}

/** Larger toggle for the problem page header. */
export function DoneButton({ slug }: { slug: string }) {
  const done = useDone().has(slug);
  return (
    <button
      type="button"
      aria-pressed={done}
      onClick={() => setDone(slug, !done)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors",
        done
          ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-fg/15 text-fg/60 hover:text-fg hover:border-emerald-500/50",
      )}
    >
      <Check size={13} strokeWidth={3} />
      {done ? "Done" : "Mark as done"}
    </button>
  );
}

/** Clears every checkmark, after an inline warning the user must confirm. */
export function ClearProgress() {
  const count = useDone().size;
  const [confirming, setConfirming] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!confirming) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setConfirming(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirming]);

  if (!count) return null;

  if (!confirming)
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-fg/50 text-xs underline hover:text-red-600 dark:hover:text-red-400"
      >
        Clear checkmarks
      </button>
    );

  return (
    <div
      role="alertdialog"
      aria-labelledby="clear-progress-title"
      aria-describedby="clear-progress-desc"
      className="flex w-full flex-wrap items-center gap-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm"
    >
      <TriangleAlert size={16} className="shrink-0 text-red-600 dark:text-red-400" aria-hidden />
      <div className="flex-1">
        <p id="clear-progress-title" className="font-medium">
          Clear all {count} checkmark{count === 1 ? "" : "s"}?
        </p>
        <p id="clear-progress-desc" className="text-fg/60 text-xs">
          Your progress is saved only in this browser. This can&apos;t be undone.
        </p>
      </div>
      <div className="flex gap-2">
        <button
          ref={cancelRef}
          type="button"
          onClick={() => setConfirming(false)}
          className="border-fg/15 hover:bg-fg/5 rounded-md border px-3 py-1 text-xs"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            clearDone();
            setConfirming(false);
          }}
          className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
        >
          Clear all
        </button>
      </div>
    </div>
  );
}

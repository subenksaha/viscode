import type { Tone } from "@/core/types";

/** Box styles for HTML cells. */
export const toneBox: Record<Tone, string> = {
  active: "border-amber-400 bg-amber-400/20 text-amber-900 dark:text-amber-100",
  compare: "border-sky-400 bg-sky-400/20 text-sky-900 dark:text-sky-100",
  success: "border-emerald-400 bg-emerald-400/25 text-emerald-900 dark:text-emerald-100",
  danger: "border-red-400 bg-red-400/20 text-red-900 dark:text-red-100",
  visited: "border-violet-400/60 bg-violet-400/15 text-violet-900 dark:text-violet-100",
  window: "border-amber-400/40 bg-amber-400/[0.07]",
  muted: "border-fg/5 bg-transparent text-fg/25",
};

const TONES = ["default", "active", "compare", "success", "danger", "visited", "window", "muted"] as const;

/** Fill / stroke pairs for SVG shapes, as theme-aware CSS variables (see globals.css). */
export const toneSvg = Object.fromEntries(
  TONES.map((t) => [
    t,
    { fill: `var(--tone-${t}-fill)`, stroke: `var(--tone-${t}-stroke)`, text: `var(--tone-${t}-text)` },
  ]),
) as Record<Tone | "default", { fill: string; stroke: string; text: string }>;

export const edgeColor: Record<Tone | "default", string> = {
  default: "var(--edge-default)",
  active: "var(--tone-active-stroke)",
  compare: "var(--tone-compare-stroke)",
  success: "var(--tone-success-stroke)",
  danger: "var(--tone-danger-stroke)",
  visited: "var(--tone-visited-stroke)",
  window: "var(--tone-active-stroke)",
  muted: "var(--edge-muted)",
};

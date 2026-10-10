"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { THEME_KEY as KEY } from "@/lib/theme";

export type ThemePref = "system" | "light" | "dark";

const listeners = new Set<() => void>();

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

/** Resolve a preference and stamp it on <html>. Mirrors the inline script in layout.tsx. */
function apply(pref: ThemePref) {
  const dark =
    pref === "dark" || (pref === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const media = matchMedia("(prefers-color-scheme: dark)");
  const onSystem = () => readPref() === "system" && apply("system");
  media.addEventListener("change", onSystem);
  return () => {
    listeners.delete(cb);
    media.removeEventListener("change", onSystem);
  };
}

function setPref(pref: ThemePref) {
  try {
    if (pref === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, pref);
  } catch {
    // Storage blocked: the choice still applies for this page view.
  }
  apply(pref);
  listeners.forEach((l) => l());
}

const OPTIONS: { pref: ThemePref; label: string; Icon: typeof Sun }[] = [
  { pref: "light", label: "Light theme", Icon: Sun },
  { pref: "system", label: "System theme", Icon: Monitor },
  { pref: "dark", label: "Dark theme", Icon: Moon },
];

export function ThemeToggle() {
  const pref = useSyncExternalStore(subscribe, readPref, () => "system" as ThemePref);
  return (
    <div role="radiogroup" aria-label="Theme" className="border-fg/10 flex rounded-md border p-0.5">
      {OPTIONS.map(({ pref: p, label, Icon }) => (
        <button
          key={p}
          type="button"
          role="radio"
          aria-checked={pref === p}
          aria-label={label}
          title={label}
          onClick={() => setPref(p)}
          className={cn(
            "inline-flex size-7 items-center justify-center rounded transition-colors",
            pref === p ? "bg-fg/10 text-fg" : "text-fg/40 hover:text-fg",
          )}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
}

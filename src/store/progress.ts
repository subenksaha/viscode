"use client";

import { useSyncExternalStore } from "react";

// Solved problems live only in this browser's localStorage, as a JSON array of slugs.
const KEY = "viscode:done";
const EMPTY: ReadonlySet<string> = new Set();
const listeners = new Set<() => void>();

let cachedRaw: string | null = null;
let cached: ReadonlySet<string> = EMPTY;

function read(): ReadonlySet<string> {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return cached; // Storage blocked: keep whatever this page view has.
  }
  // Return the same Set while storage is unchanged, as useSyncExternalStore requires.
  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cached = new Set(Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : []);
  } catch {
    cached = new Set();
  }
  return cached;
}

function write(done: ReadonlySet<string>) {
  cached = done;
  try {
    cachedRaw = done.size ? JSON.stringify([...done]) : null;
    if (cachedRaw) localStorage.setItem(KEY, cachedRaw);
    else localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: the change still applies until the page is closed.
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  // Other tabs update localStorage directly; pick their changes up too.
  const onStorage = (e: StorageEvent) => (e.key === KEY || e.key === null) && cb();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** Slugs marked done. Empty on the server and during hydration. */
export const useDone = () => useSyncExternalStore(subscribe, read, () => EMPTY);

export function setDone(slug: string, done: boolean) {
  const next = new Set(read());
  if (done) next.add(slug);
  else next.delete(slug);
  write(next);
}

export const clearDone = () => write(new Set());

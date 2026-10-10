"use client";

import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/cn";
import { usePlayer } from "@/store/player";

const SPEEDS = [
  { label: "0.5×", ms: 1600 },
  { label: "1×", ms: 800 },
  { label: "2×", ms: 400 },
  { label: "4×", ms: 200 },
];

const btn =
  "inline-flex size-9 items-center justify-center rounded-md border border-fg/10 bg-fg/5 hover:bg-fg/10 disabled:opacity-40";

export function Controls() {
  const { index, total, playing, speed, goTo, next, prev, toggle, setSpeed } = usePlayer();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button className={btn} onClick={() => goTo(0)} aria-label="Restart">
        <RotateCcw size={16} />
      </button>
      <button className={btn} onClick={prev} disabled={index === 0} aria-label="Previous step">
        <ChevronLeft size={18} />
      </button>
      <button
        className={cn(btn, "w-11 border-amber-400 bg-amber-400/90 text-black hover:bg-amber-400")}
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? <Pause size={18} /> : <Play size={18} />}
      </button>
      <button className={btn} onClick={next} disabled={index >= total - 1} aria-label="Next step">
        <ChevronRight size={18} />
      </button>

      <input
        type="range"
        min={0}
        max={Math.max(0, total - 1)}
        value={index}
        onChange={(e) => goTo(Number(e.target.value))}
        className="min-w-32 flex-1 accent-amber-400"
        aria-label="Step"
      />
      <span className="w-20 text-right font-mono text-xs text-fg/60 tabular-nums">
        {index + 1} / {total}
      </span>

      <select
        value={speed}
        onChange={(e) => setSpeed(Number(e.target.value))}
        className="rounded-md border border-fg/10 bg-fg/5 px-2 py-1.5 text-sm"
        aria-label="Playback speed"
      >
        {SPEEDS.map((s) => (
          <option key={s.ms} value={s.ms} className="bg-bg">
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}

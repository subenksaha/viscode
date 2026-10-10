"use client";

import { use, useEffect, useMemo, useState } from "react";
import { getProblem } from "@/catalog/problems";
import { fmt } from "@/core/panels";
import { runSolution } from "@/core/trace";
import type { AnyProblemModule } from "@/core/types";
import type { CodeToken } from "@/lib/highlight";
import { cn } from "@/lib/cn";
import { usePlayer } from "@/store/player";
import { SceneView } from "../scene/SceneView";
import { CodePanel } from "./CodePanel";
import { Controls } from "./Controls";

// Problem modules are code-split; cache the promise so `use()` sees a stable value.
const modules = new Map<string, Promise<AnyProblemModule>>();
function loadModule(slug: string) {
  let p = modules.get(slug);
  if (!p) {
    p = getProblem(slug)!
      .load()
      .then((m) => m.default);
    modules.set(slug, p);
  }
  return p;
}

export function Player({ slug, codes }: { slug: string; codes: Record<string, CodeToken[][]> }) {
  const problem = use(loadModule(slug));
  const [solutionId, setSolutionId] = useState(problem.solutions.at(-1)!.id);
  const [rawInput, setRawInput] = useState(problem.input.default);
  const [draft, setDraft] = useState(rawInput);
  const solution = problem.solutions.find((s) => s.id === solutionId) ?? problem.solutions[0];

  const run = useMemo(() => {
    try {
      return { ...runSolution(problem, solution, rawInput), error: null };
    } catch (e) {
      return { steps: [], result: undefined, truncated: false, error: e instanceof Error ? e.message : String(e) };
    }
  }, [problem, solution, rawInput]);

  const { index, playing, speed, reset, next, prev, toggle } = usePlayer();

  useEffect(() => reset(run.steps.length), [run.steps, reset]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(next, speed);
    return () => clearInterval(id);
  }, [playing, speed, next]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, button")) return;
      if (e.key === " ") {
        e.preventDefault();
        toggle();
      } else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, next, prev]);

  const step = run.steps[Math.min(index, run.steps.length - 1)];
  const atEnd = run.steps.length > 0 && index >= run.steps.length - 1;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Solutions">
        {problem.solutions.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={s.id === solution.id}
            onClick={() => setSolutionId(s.id)}
            className={cn(
              "flex flex-col items-start rounded-lg border px-3 py-2 text-left transition-colors",
              s.id === solution.id
                ? "border-amber-400/60 bg-amber-400/10"
                : "border-fg/10 bg-fg/[0.02] hover:bg-fg/5",
            )}
          >
            <span className="text-sm font-medium">{s.name}</span>
            <span className="font-mono text-[11px] text-fg/50">
              time {s.time} · space {s.space}
            </span>
          </button>
        ))}
      </div>
      <p className="text-sm text-fg/60">{solution.idea}</p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="flex min-w-0 flex-col gap-3">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setRawInput(draft);
            }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              spellCheck={false}
              className="min-w-0 flex-1 rounded-md border border-fg/10 bg-fg/5 px-3 py-2 font-mono text-sm outline-none focus:border-amber-400/60"
              aria-label="Input"
            />
            <button className="rounded-md bg-fg/10 px-4 text-sm hover:bg-fg/15">Run</button>
            {draft !== problem.input.default && (
              <button
                type="button"
                className="rounded-md px-2 text-sm text-fg/50 hover:text-fg"
                onClick={() => {
                  setDraft(problem.input.default);
                  setRawInput(problem.input.default);
                }}
              >
                Reset
              </button>
            )}
          </form>
          <CodePanel lines={codes[solution.id] ?? []} activeLine={step?.line ?? 0} />
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex min-h-72 items-start overflow-auto rounded-lg border border-fg/10 bg-fg/[0.02] p-5">
            {run.error ? (
              <p className="text-sm text-red-600 dark:text-red-400">{run.error}</p>
            ) : (
              step && <SceneView panels={step.panels} />
            )}
          </div>
          <p className="min-h-12 rounded-lg border border-fg/10 bg-fg/[0.02] px-4 py-3 text-sm text-fg/80">
            {step?.note}
          </p>
          {atEnd && !run.error && (
            <p className="font-mono text-sm text-emerald-700 dark:text-emerald-300">Output: {fmt(run.result)}</p>
          )}
          {run.truncated && (
            <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
              Trace capped at {run.steps.length} steps. Try a smaller input to see every step.
            </p>
          )}
          <Controls />
          <p className="text-xs text-fg/40">Space: play/pause · ←/→: step</p>
        </div>
      </div>
    </div>
  );
}

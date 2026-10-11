"use client";

import { ArrowUpRight } from "lucide-react";
import type { ApproachStep, Step } from "@/core/types";
import { cn } from "@/lib/cn";
import { usePlayer } from "@/store/player";
import { SceneView } from "../scene/SceneView";

/** A solution's walkthrough: each stage pairs its explanation with a snapshot of its critical step. */
export function Approach({
  stages,
  steps,
  keySteps,
}: {
  stages: ApproachStep[];
  steps: Step[];
  /** Trace index per stage (-1 when the stage has no snapshot or the run never reaches it). */
  keySteps: number[];
}) {
  const { index, goTo } = usePlayer();
  const jumpTo = (at: number) => {
    goTo(at);
    document.getElementById("player")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="flex flex-col gap-4" aria-labelledby="approach-heading">
      <h2 id="approach-heading" className="text-lg font-semibold">
        Approach
      </h2>
      <ol className="flex flex-col gap-4">
        {stages.map((stage, i) => {
          const at = keySteps[i];
          const step = at >= 0 ? steps[at] : undefined;
          const current = step !== undefined && at === index;
          return (
            <li
              key={i}
              className={cn(
                "grid gap-4 rounded-lg border p-4 transition-colors",
                stage.at && "lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]",
                current ? "border-amber-400/60 bg-amber-400/[0.06]" : "border-fg/10 bg-fg/[0.02]",
              )}
            >
              <div className="flex gap-3">
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full font-mono text-xs",
                    current ? "bg-amber-400 text-black" : "bg-fg/10 text-fg/60",
                  )}
                >
                  {i + 1}
                </span>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <h3 className="text-sm font-medium">{stage.title}</h3>
                  <p className="text-fg/70 text-sm leading-relaxed">{stage.detail}</p>
                </div>
              </div>

              {stage.at &&
                (step ? (
                  <figure className="border-fg/10 bg-bg flex min-w-0 flex-col gap-2 rounded-md border p-3">
                    <div className="text-fg/40 flex items-center justify-between gap-2 font-mono text-[11px]">
                      <span>
                        step {at + 1} / {steps.length} · line {step.line}
                      </span>
                      <button
                        type="button"
                        onClick={() => jumpTo(at)}
                        className="flex items-center gap-0.5 rounded px-1 hover:text-amber-700 dark:hover:text-amber-300"
                        aria-label={`Jump to step ${at + 1}: ${stage.title}`}
                      >
                        jump <ArrowUpRight size={12} />
                      </button>
                    </div>
                    <div className="max-h-96 [zoom:0.8] overflow-auto">
                      <SceneView panels={step.panels} />
                    </div>
                    <figcaption className="text-fg/60 text-xs">{step.note}</figcaption>
                  </figure>
                ) : (
                  <p className="text-fg/40 self-center text-xs italic">
                    This step isn&apos;t reached on the current input.
                  </p>
                ))}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

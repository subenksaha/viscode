import type { CompiledCode, Panel, ProblemModule, Solution, Step } from "./types";
import { Args } from "./input";

/** Max steps recorded per run; brute-force runs on big inputs get cut off. */
export const STEP_LIMIT = 2500;

/**
 * Compile solution source. Lines may end with `//@label` markers (several allowed:
 * `//@a @b`); markers are stripped and mapped to their 1-based line number.
 */
export function code(src: string): CompiledCode {
  const raw = src.replace(/^\n+/, "").trimEnd().split("\n");
  const indent = Math.min(...raw.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length));
  const lines: Record<string, number> = {};
  const out = raw.map((line, i) => {
    const m = line.match(/\s*\/\/((?:\s*@[\w-]+)+)\s*$/);
    if (!m) return line.slice(indent);
    for (const label of m[1].match(/@[\w-]+/g)!) {
      const key = label.slice(1);
      if (key in lines) throw new Error(`Duplicate code label "${key}"`);
      lines[key] = i + 1;
    }
    return line.slice(0, m.index).slice(indent);
  });
  return { source: out.join("\n"), lines };
}

export class Tracer {
  readonly steps: Step[] = [];
  truncated = false;

  constructor(
    private readonly lines: Record<string, number>,
    private readonly limit = STEP_LIMIT,
  ) {}

  /** Record a step. `panels` may be a thunk so truncated runs skip building snapshots. */
  step(label: string, note: string, panels: Panel[] | (() => Panel[]) = []) {
    const line = this.lines[label];
    if (line === undefined) throw new Error(`Unknown code label "${label}"`);
    if (this.steps.length >= this.limit) {
      this.truncated = true;
      return;
    }
    this.steps.push({ line, note, panels: typeof panels === "function" ? panels() : panels });
  }
}

export function defineSolution<I>(solution: Solution<I>) {
  return solution;
}

export function defineProblem<I>(problem: ProblemModule<I>) {
  return problem;
}

export interface RunResult {
  steps: Step[];
  result: unknown;
  truncated: boolean;
}

export function runSolution<I>(
  problem: ProblemModule<I>,
  solution: Solution<I>,
  raw: string,
): RunResult {
  // Parse fresh per run: solutions may mutate their input.
  const input = problem.input.parse(new Args(raw));
  const t = new Tracer(solution.code.lines);
  const result = solution.run(input, t);
  return { steps: t.steps, result, truncated: t.truncated };
}

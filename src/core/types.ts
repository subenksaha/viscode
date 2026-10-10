import type { Args } from "./input";
import type { Tracer } from "./trace";

export type Difficulty = "Easy" | "Medium" | "Hard";

export type Tone = "active" | "compare" | "success" | "danger" | "muted" | "visited" | "window";

export type Scalar = string | number | boolean | null | undefined;

// ---------- Panels: declarative snapshots the scene renderer draws ----------

export interface ArrayPanel {
  kind: "array";
  label?: string;
  values: Scalar[];
  tones?: Record<number, Tone>;
  /** Pointer name -> index, drawn under the cell. */
  pointers?: Record<string, number | null | undefined>;
  /** Inclusive [lo, hi] range drawn as a window. */
  window?: [number, number] | null;
  /** Custom labels above each cell (defaults to indices). `false` hides them. */
  indexLabels?: string[] | false;
}

export interface MapPanel {
  kind: "map";
  label?: string;
  entries: [string, string][];
  /** Keys to highlight, with a tone. */
  tones?: Record<string, Tone>;
}

export interface VarsPanel {
  kind: "vars";
  label?: string;
  values: Record<string, Scalar>;
}

export interface GridPanel {
  kind: "grid";
  label?: string;
  cells: Scalar[][];
  /** Keyed by "r,c". */
  tones?: Record<string, Tone>;
  rowLabels?: string[];
  colLabels?: string[];
}

export interface TreePanelNode {
  id: number;
  label: string;
  /** Binary trees use [left, right] with nulls preserved. */
  children: (number | null)[];
}

export interface TreePanel {
  kind: "tree";
  label?: string;
  nodes: TreePanelNode[];
  root: number | null;
  binary: boolean;
  tones?: Record<number, Tone>;
  pointers?: Record<string, number | null | undefined>;
  /** Small per-node annotation drawn under the node, e.g. a computed value. */
  notes?: Record<number, string>;
}

export interface ListPanelNode {
  id: number;
  label: string;
  next: number | null;
}

export interface ListPanel {
  kind: "list";
  label?: string;
  /** Nodes in display order; arrows follow each node's real `next`. */
  nodes: ListPanelNode[];
  tones?: Record<number, Tone>;
  pointers?: Record<string, number | null | undefined>;
}

export interface GraphPanel {
  kind: "graph";
  label?: string;
  nodes: { id: string; label: string }[];
  edges: { from: string; to: string }[];
  directed: boolean;
  tones?: Record<string, Tone>;
  /** Keyed by "from->to". */
  edgeTones?: Record<string, Tone>;
}

export interface IntervalsPanel {
  kind: "intervals";
  label?: string;
  items: [number, number][];
  tones?: Record<number, Tone>;
}

export interface TextPanel {
  kind: "text";
  label?: string;
  text: string;
}

export type Panel =
  | ArrayPanel
  | MapPanel
  | VarsPanel
  | GridPanel
  | TreePanel
  | ListPanel
  | GraphPanel
  | IntervalsPanel
  | TextPanel;

export interface Step {
  /** 1-based line in the solution's code. */
  line: number;
  note: string;
  panels: Panel[];
}

// ---------- Problems & solutions ----------

export interface CompiledCode {
  source: string;
  /** Marker label -> 1-based line. */
  lines: Record<string, number>;
}

export interface Solution<I> {
  id: string;
  name: string;
  time: string;
  space: string;
  /** One or two sentences on the approach. */
  idea: string;
  code: CompiledCode;
  /** Run the algorithm on `input`, recording steps on `t`. Returns the answer. */
  run: (input: I, t: Tracer) => unknown;
}

export interface Example {
  input: string;
  output: unknown;
}

export interface ProblemModule<I> {
  description: string;
  input: {
    /** LeetCode-style raw input, e.g. `nums = [2,7,11,15], target = 9`. */
    default: string;
    parse: (args: Args) => I;
  };
  examples: Example[];
  /** Canonicalize answers before comparing (e.g. sort when any order is accepted). */
  normalize?: (output: unknown) => unknown;
  solutions: Solution<I>[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyProblemModule = ProblemModule<any>;

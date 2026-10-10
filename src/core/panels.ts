// Builders that snapshot live data into serializable panels.
import type {
  ArrayPanel,
  GraphPanel,
  GridPanel,
  IntervalsPanel,
  ListPanel,
  MapPanel,
  Scalar,
  TextPanel,
  Tone,
  TreePanel,
  TreePanelNode,
  VarsPanel,
} from "./types";
import type { ListNode, TreeNode } from "./structures";

type Key = number | string | null | undefined | false;

/** Build a tone map; later pairs win, null/undefined/false keys are skipped. */
export function tones<K extends Key>(...pairs: [K, Tone][]): Record<string, Tone> {
  const out: Record<string, Tone> = {};
  for (const [k, tone] of pairs) if (k !== null && k !== undefined && k !== false) out[String(k)] = tone;
  return out;
}

/** Tone every index in [lo, hi]. */
export function range(lo: number, hi: number, tone: Tone): [number, Tone][] {
  const out: [number, Tone][] = [];
  for (let i = lo; i <= hi; i++) out.push([i, tone]);
  return out;
}

export function fmt(v: unknown): string {
  if (v === null || v === undefined) return "null";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return `[${v.map(fmt).join(",")}]`;
  if (v instanceof Set) return `{${[...v].map(fmt).join(",")}}`;
  return String(v);
}

export const arr = (
  label: string,
  values: readonly unknown[],
  opts: Omit<ArrayPanel, "kind" | "label" | "values"> = {},
): ArrayPanel => ({
  kind: "array",
  label,
  values: values.map((v) =>
    typeof v === "number" || typeof v === "string" || typeof v === "boolean" || v == null
      ? (v as Scalar)
      : fmt(v),
  ),
  ...opts,
});

/** A number's low `width` bits, MSB first; tones are keyed by bit position (0 = LSB). */
export const bits = (
  label: string,
  n: number,
  width: number,
  bitTones: Record<number, Tone> = {},
): ArrayPanel => {
  const values: number[] = [];
  const toneByIdx: Record<number, Tone> = {};
  for (let p = width - 1; p >= 0; p--) {
    if (bitTones[p]) toneByIdx[values.length] = bitTones[p];
    values.push((n >>> p) & 1);
  }
  return {
    kind: "array",
    label,
    values,
    tones: toneByIdx,
    indexLabels: values.map((_, i) => String(width - 1 - i)),
  };
};

/** Smallest of 8/16/32 bits that shows all values (negatives need 32). */
export const bitWidth = (...ns: number[]) => {
  if (ns.some((n) => n < 0 || n > 0xffff)) return 32;
  return ns.some((n) => n > 0xff) ? 16 : 8;
};

export const vars =(values: Record<string, unknown>, label?: string): VarsPanel => ({
  kind: "vars",
  label,
  values: Object.fromEntries(
    Object.entries(values).map(([k, v]) => [
      k,
      typeof v === "object" && v !== null ? fmt(v) : (v as Scalar),
    ]),
  ),
});

export const map = (
  label: string,
  source: Map<unknown, unknown> | Set<unknown> | Iterable<[unknown, unknown]>,
  toneMap: Record<string, Tone> = {},
): MapPanel => ({
  kind: "map",
  label,
  entries:
    source instanceof Set
      ? [...source].map((k) => [fmt(k), ""])
      : [...(source as Iterable<[unknown, unknown]>)].map(([k, v]) => [fmt(k), fmt(v)]),
  tones: toneMap,
});

export const grid = (
  label: string,
  cells: readonly (readonly unknown[])[],
  opts: Omit<GridPanel, "kind" | "label" | "cells"> = {},
): GridPanel => ({
  kind: "grid",
  label,
  cells: cells.map((row) =>
    row.map((v) => (typeof v === "object" && v !== null ? fmt(v) : (v as Scalar))),
  ),
  ...opts,
});

/** "r,c" key for grid tones. */
export const rc = (r: number, c: number) => `${r},${c}`;

type NodeTones<N> = [N | null | undefined, Tone][];
type NodePointers<N> = Record<string, N | null | undefined>;

const idTones = <N extends { id: number }>(pairs: NodeTones<N> = []) =>
  tones(...pairs.map(([n, t]) => [n?.id, t] as [number | undefined, Tone]));

const idPointers = <N extends { id: number }>(ptrs: NodePointers<N> = {}) =>
  Object.fromEntries(Object.entries(ptrs).map(([k, n]) => [k, n?.id ?? null]));

export function tree(
  label: string,
  root: TreeNode | null,
  opts: {
    tones?: NodeTones<TreeNode>;
    pointers?: NodePointers<TreeNode>;
    notes?: [TreeNode | null | undefined, string][];
  } = {},
): TreePanel {
  const nodes: TreePanelNode[] = [];
  const walk = (n: TreeNode | null) => {
    if (!n) return;
    nodes.push({
      id: n.id,
      label: String(n.val),
      children: [n.left?.id ?? null, n.right?.id ?? null],
    });
    walk(n.left);
    walk(n.right);
  };
  walk(root);
  return {
    kind: "tree",
    label,
    nodes,
    root: root?.id ?? null,
    binary: true,
    tones: idTones(opts.tones),
    pointers: idPointers(opts.pointers),
    notes: Object.fromEntries((opts.notes ?? []).filter(([n]) => n).map(([n, note]) => [n!.id, note])),
  };
}

/** Generic n-ary tree (e.g. a trie). Nodes get ids from a WeakMap. */
export function naryTree<N extends object>(
  label: string,
  root: N,
  children: (n: N) => N[],
  nodeLabel: (n: N) => string,
  opts: { tones?: [N | null | undefined, Tone][] } = {},
): TreePanel {
  const ids = new Map<N, number>();
  const nodes: TreePanelNode[] = [];
  const walk = (n: N): number => {
    const id = ids.size + 1;
    ids.set(n, id);
    const node: TreePanelNode = { id, label: nodeLabel(n), children: [] };
    nodes.push(node);
    node.children = children(n).map(walk);
    return id;
  };
  walk(root);
  return {
    kind: "tree",
    label,
    nodes,
    root: 1,
    binary: false,
    tones: tones(...(opts.tones ?? []).map(([n, t]) => [n ? ids.get(n) : null, t] as [Key, Tone])),
  };
}

export function list(
  label: string,
  nodes: readonly (ListNode | null | undefined)[],
  opts: {
    tones?: NodeTones<ListNode>;
    pointers?: NodePointers<ListNode>;
    /** Display-label overrides, e.g. a dummy head shown as "D". */
    names?: [ListNode, string][];
  } = {},
): ListPanel {
  const names = new Map(opts.names);
  return {
    kind: "list",
    label,
    nodes: nodes
      .filter((n): n is ListNode => !!n)
      .map((n) => ({ id: n.id, label: names.get(n) ?? String(n.val), next: n.next?.id ?? null })),
    tones: idTones(opts.tones),
    pointers: idPointers(opts.pointers),
  };
}

export const graph = (
  label: string,
  nodes: readonly (string | number)[],
  edges: readonly (readonly [string | number, string | number])[],
  opts: { directed?: boolean; tones?: Record<string, Tone>; edgeTones?: Record<string, Tone> } = {},
): GraphPanel => ({
  kind: "graph",
  label,
  nodes: nodes.map((n) => ({ id: String(n), label: String(n) })),
  edges: edges.map(([a, b]) => ({ from: String(a), to: String(b) })),
  directed: opts.directed ?? false,
  tones: opts.tones,
  edgeTones: opts.edgeTones,
});

export const edgeKey = (a: string | number, b: string | number) => `${a}->${b}`;

export const intervals = (
  label: string,
  items: readonly (readonly number[])[],
  toneMap: Record<number, Tone> = {},
): IntervalsPanel => ({
  kind: "intervals",
  label,
  items: items.map(([a, b]) => [a, b]),
  tones: toneMap,
});

export const text = (label: string, value: string): TextPanel => ({
  kind: "text",
  label,
  text: value,
});

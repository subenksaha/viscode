import { arr, graph, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  n: number;
  edges: [number, number][];
}

const ids = (n: number) => Array.from({ length: n }, (_, i) => i);
const adjacency = (n: number, edges: [number, number][]) => {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) {
    adj[a].push(b);
    adj[b].push(a);
  }
  return adj;
};

const bruteForce = defineSolution<Input>({
  id: "bfs-from-every-node",
  name: "BFS from Every Node",
  time: "O(n²)",
  space: "O(n)",
  idea: "Root the tree at each node in turn and measure its height with BFS. Return every root with the smallest height.",
  approach: [
    {
      title: "Measure every root",
      detail: "BFS from each node counts how many levels the tree has when rooted there.",
      at: "height",
    },
    {
      title: "Keep the minimum",
      detail: "Return every root that achieves the smallest height.",
      at: "ret",
    },
    {
      title: "Cost",
      detail: "n BFS runs of O(n) each is O(n²). The leaf-trimming method finds the same roots in O(n).",
    },
  ],
  code: code(`
    function findMinHeightTrees(n: number, edges: number[][]): number[] {
      const neighbors: number[][] = Array.from({ length: n }, () => []);
      for (const [a, b] of edges) {
        neighbors[a].push(b);
        neighbors[b].push(a);
      }
      // Height of the tree when rooted at root, found with a level-by-level BFS.
      function height(root: number): number {
        let level = [root];
        let levels = -1;
        const visited = new Set([root]);
        while (level.length > 0) {
          levels++;
          const nextLevel: number[] = [];
          for (const node of level) {
            for (const next of neighbors[node]) {
              if (!visited.has(next)) {
                visited.add(next);
                nextLevel.push(next);
              }
            }
          }
          level = nextLevel;
        }
        return levels;
      }
      const heights: number[] = [];
      for (let root = 0; root < n; root++) heights.push(height(root)); //@height
      const smallest = Math.min(...heights);
      const result: number[] = [];
      for (let root = 0; root < n; root++) { //@ret
        if (heights[root] === smallest) result.push(root);
      }
      return result;
    }
  `),
  run({ n, edges }, t) {
    const adj = adjacency(n, edges);
    const heights: (number | null)[] = new Array(n).fill(null);
    for (let r = 0; r < n; r++) {
      let level = [r],
        h = -1;
      const seen = new Set(level);
      while (level.length) {
        h++;
        level = level.flatMap((u) => adj[u].filter((v) => !seen.has(v) && seen.add(v)));
      }
      heights[r] = h;
      t.step("height", `Rooted at ${r}, the tree has height ${h}.`, () => [
        graph("tree", ids(n), edges, { tones: tones([r, "active"]) }),
        arr("height", heights.map((x) => x ?? "?"), { tones: tones([r, "active"]) }),
      ]);
    }
    const best = Math.min(...(heights as number[]));
    const res = heights.flatMap((h, r) => (h === best ? [r] : []));
    t.step("ret", `Minimum height ${best} at [${res}].`, [
      graph("tree", ids(n), edges, { tones: tones(...res.map((r) => [r, "success"] as [number, Tone])) }),
      arr("height", heights as number[], { tones: tones(...res.map((r) => [r, "success"] as [number, Tone])) }),
    ]);
    return res;
  },
});

const trimLeaves = defineSolution<Input>({
  id: "trim-leaves",
  name: "Trim Leaves (Topological Peeling)",
  time: "O(n)",
  space: "O(n)",
  idea: "The best roots are the center of the longest path. Peel off all leaves layer by layer, like an onion. The last one or two nodes standing are the centers.",
  approach: [
    {
      title: "Find the leaves",
      detail: "Nodes with degree 1. The best roots are the middle of the longest path, as far as possible from every leaf.",
      at: "init",
    },
    {
      title: "Peel one layer",
      detail: "Remove all current leaves at once, which shrinks every longest path from both ends by one.",
      at: "layer",
    },
    {
      title: "New leaves appear",
      detail: "A neighbor whose degree drops to 1 becomes a leaf in the next layer.",
      at: "new-leaf",
    },
    {
      title: "One or two centers remain",
      detail: "Stop when at most 2 nodes are left. They are the minimum-height roots.",
      at: "ret",
    },
  ],
  code: code(`
    function findMinHeightTrees(n: number, edges: number[][]): number[] {
      if (n <= 2) { //@small
        const all: number[] = [];
        for (let node = 0; node < n; node++) all.push(node);
        return all;
      }
      const neighbors: Set<number>[] = Array.from({ length: n }, () => new Set());
      for (const [a, b] of edges) {
        neighbors[a].add(b);
        neighbors[b].add(a);
      }
      // Peel off leaves layer by layer, like an onion. The last 1 or 2 nodes are the centers.
      let leaves: number[] = [];
      for (let node = 0; node < n; node++) { //@init
        if (neighbors[node].size === 1) leaves.push(node);
      }
      let remaining = n;
      while (remaining > 2) { //@layer
        remaining -= leaves.length;
        const nextLeaves: number[] = [];
        for (const leaf of leaves) { //@trim
          const onlyNeighbor = [...neighbors[leaf]][0];
          neighbors[onlyNeighbor].delete(leaf);
          if (neighbors[onlyNeighbor].size === 1) nextLeaves.push(onlyNeighbor); //@new-leaf
        }
        leaves = nextLeaves;
      }
      return leaves; //@ret
    }
  `),
  run({ n, edges }, t) {
    if (n <= 2) {
      const res = ids(n);
      t.step("small", `With ${n} node(s), every node is a center.`, [graph("tree", ids(n), edges)]);
      return res;
    }
    const adj: Set<number>[] = Array.from({ length: n }, () => new Set());
    for (const [a, b] of edges) {
      adj[a].add(b);
      adj[b].add(a);
    }
    const removed = new Set<number>();
    let leaves = adj.flatMap((s, i) => (s.size === 1 ? [i] : [])),
      remaining = n;
    const view = (cur?: number, newLeaf?: number) => {
      const tn: Record<string, Tone> = {};
      removed.forEach((r) => (tn[r] = "muted"));
      leaves.forEach((l) => (tn[l] = "compare"));
      if (cur !== undefined) tn[cur] = "danger";
      if (newLeaf !== undefined) tn[newLeaf] = "active";
      return [
        vars({ remaining }),
        graph("tree", ids(n), edges.filter(([a, b]) => !removed.has(a) && !removed.has(b)), { tones: tn }),
        arr("degree", adj.map((s, i) => (removed.has(i) ? "–" : s.size)), { tones: tones([cur, "danger"], [newLeaf, "active"]) }),
        arr("leaves", leaves, { indexLabels: false }),
      ];
    };
    t.step("init", `Initial leaves: [${leaves}].`, view());
    while (remaining > 2) {
      t.step("layer", `${remaining} nodes left. Peel ${leaves.length} leaf/leaves.`, view());
      remaining -= leaves.length;
      const next: number[] = [];
      for (const leaf of leaves) {
        const [nb] = adj[leaf];
        adj[nb].delete(leaf);
        adj[leaf].clear();
        removed.add(leaf);
        if (adj[nb].size === 1) {
          next.push(nb);
          t.step("new-leaf", `Remove ${leaf}. Its neighbor ${nb} becomes a leaf.`, () => view(leaf, nb));
        } else t.step("trim", `Remove ${leaf}. ${nb} now has degree ${adj[nb].size}.`, () => view(leaf));
      }
      leaves = next;
    }
    t.step("ret", `Centers: [${leaves}].`, () => {
      const v = view();
      const g = v[1] as ReturnType<typeof graph>;
      leaves.forEach((l) => (g.tones![l] = "success"));
      return v;
    });
    return leaves;
  },
});

export default defineProblem<Input>({
  description: "A tree has n nodes labeled 0..n−1 and the given undirected edges. Choosing any node as the root gives a rooted tree with some height. Return all roots that give the minimum height, in any order.",
  input: { default: "n = 7, edges = [[0,1],[1,2],[1,3],[3,4],[4,5],[4,6]]", parse: (a) => ({ n: a.int("n"), edges: a.pairs("edges") }) },
  examples: [
    { input: "n = 4, edges = [[1,0],[1,2],[1,3]]", output: [1] },
    { input: "n = 6, edges = [[3,0],[3,1],[3,2],[3,4],[5,4]]", output: [3, 4] },
    { input: "n = 1, edges = []", output: [0] },
  ],
  normalize: (v) => [...(v as number[])].sort((a, b) => a - b),
  solutions: [bruteForce, trimLeaves],
});

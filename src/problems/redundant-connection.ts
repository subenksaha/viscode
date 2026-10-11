import { arr, edgeKey, graph, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  edges: [number, number][];
}

const nodesOf = (edges: [number, number][]) => Array.from({ length: edges.length }, (_, i) => i + 1);

const dfsCheck = defineSolution<Input>({
  id: "dfs-before-add",
  name: "DFS Before Adding Each Edge",
  time: "O(n²)",
  space: "O(n)",
  idea: "Add edges one by one. Before adding (u, v), DFS from u over the edges so far: if v is already reachable, this edge closes a cycle and is the answer.",
  approach: [
    {
      title: "Process edges in order",
      detail: "Before adding (a, b), check whether a can already reach b.",
      at: "edge",
    },
    {
      title: "DFS",
      detail: "Explore the graph built so far.",
      at: "visit",
    },
    {
      title: "Not connected: add it",
      detail: "The edge joins two separate pieces.",
      at: "add",
    },
    {
      title: "Already connected: redundant",
      detail: "This edge would close a cycle. Since edges are scanned in order, it is the last such edge. O(n²).",
      at: "cycle",
    },
  ],
  code: code(`
    function findRedundantConnection(edges: number[][]): number[] {
      const neighbors = new Map<number, number[]>();
      // Is there already a path from start to target?
      function canReach(start: number, target: number, visited: Set<number>): boolean {
        if (start === target) return true;
        visited.add(start); //@visit
        for (const next of neighbors.get(start) ?? []) {
          if (!visited.has(next) && canReach(next, target, visited)) return true;
        }
        return false;
      }
      for (const [a, b] of edges) { //@edge
        // If a and b are already connected, this edge closes a cycle.
        if (canReach(a, b, new Set())) return [a, b]; //@cycle
        if (!neighbors.has(a)) neighbors.set(a, []); //@add
        if (!neighbors.has(b)) neighbors.set(b, []);
        neighbors.get(a)!.push(b);
        neighbors.get(b)!.push(a);
      }
      return [];
    }
  `),
  run({ edges }, t) {
    const adj = new Map<number, number[]>();
    const added: [number, number][] = [];
    const view = (seen: Set<number>, cur?: [number, number], tone: Tone = "compare") => {
      const tn: Record<string, Tone> = {};
      seen.forEach((s) => (tn[s] = "visited"));
      if (cur) {
        tn[cur[0]] = "active";
        tn[cur[1]] = tone === "danger" ? "danger" : "compare";
      }
      return [
        graph("graph so far + next edge", nodesOf(edges), cur ? [...added, cur] : added, { tones: tn, edgeTones: cur ? tones([edgeKey(...cur), tone]) : {} }),
      ];
    };
    for (const [u, v] of edges) {
      const seen = new Set<number>();
      t.step("edge", `Is ${v} already reachable from ${u}?`, view(seen, [u, v]));
      const reach = (x: number): boolean => {
        if (x === v) return true;
        seen.add(x);
        t.step("visit", `Visit ${x}.`, () => view(seen, [u, v]));
        return (adj.get(x) ?? []).some((w) => !seen.has(w) && reach(w));
      };
      if (reach(u)) {
        t.step("cycle", `Yes: [${u}, ${v}] would close a cycle. Return it.`, view(seen, [u, v], "danger"));
        return [u, v];
      }
      adj.set(u, [...(adj.get(u) ?? []), v]);
      adj.set(v, [...(adj.get(v) ?? []), u]);
      added.push([u, v]);
      t.step("add", `No: add [${u}, ${v}].`, view(new Set()));
    }
    return [];
  },
});

const unionFind = defineSolution<Input>({
  id: "union-find",
  name: "Union-Find",
  time: "O(n · α(n))",
  space: "O(n)",
  idea: "Union the endpoints of each edge. The first edge whose endpoints already share a root connects two nodes that were already connected: that edge is redundant.",
  approach: [
    {
      title: "Singletons",
      detail: "Every node starts in its own set.",
      at: "init",
    },
    {
      title: "Find both roots",
      detail: "For each edge.",
      at: "find",
    },
    {
      title: "Union",
      detail: "Different roots: merge them.",
      at: "union",
    },
    {
      title: "Same root: redundant",
      detail: "The endpoints were already connected. O(n α(n)).",
      at: "cycle",
    },
  ],
  code: code(`
    function findRedundantConnection(edges: number[][]): number[] {
      const parent = Array.from({ length: edges.length + 1 }, (_, node) => node); //@init
      function findRoot(node: number): number {
        while (parent[node] !== node) node = parent[node];
        return node;
      }
      for (const [a, b] of edges) {
        const rootA = findRoot(a); //@find
        const rootB = findRoot(b);
        if (rootA === rootB) return [a, b]; // already connected: this edge makes a cycle //@cycle
        parent[rootA] = rootB; //@union
      }
      return [];
    }
  `),
  run({ edges }, t) {
    const parent = Array.from({ length: edges.length + 1 }, (_, i) => i);
    const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
    const added: [number, number][] = [];
    const view = (cur?: [number, number], tone: Tone = "compare") => [
      graph("graph so far", nodesOf(edges), cur ? [...added, cur] : added, {
        tones: cur ? tones([cur[0], "active"], [cur[1], "active"]) : {},
        edgeTones: cur ? tones([edgeKey(...cur), tone]) : {},
      }),
      arr("parent", parent.slice(1), { indexLabels: nodesOf(edges).map(String) }),
    ];
    t.step("init", "Every node is its own set.", view());
    for (const [u, v] of edges) {
      const a = find(u),
        b = find(v);
      t.step("find", `Edge [${u}, ${v}]: root(${u}) = ${a}, root(${v}) = ${b}.`, () => [...view([u, v]), vars({ rootA: a, rootB: b })]);
      if (a === b) {
        t.step("cycle", "Same root: already connected. This edge is redundant.", view([u, v], "danger"));
        return [u, v];
      }
      parent[a] = b;
      added.push([u, v]);
      t.step("union", `Merge the sets: parent[${a}] = ${b}.`, view());
    }
    return [];
  },
});

export default defineProblem<Input>({
  description: "A tree of n nodes (labeled 1..n) had one extra edge added. Given the edge list, return an edge that can be removed so the graph becomes a tree again; if several work, return the one that appears last in the input.",
  input: { default: "edges = [[1,2],[2,3],[3,4],[1,4],[1,5]]", parse: (a) => ({ edges: a.pairs("edges") }) },
  examples: [
    { input: "edges = [[1,2],[1,3],[2,3]]", output: [2, 3] },
    { input: "edges = [[1,2],[2,3],[3,4],[1,4],[1,5]]", output: [1, 4] },
  ],
  solutions: [dfsCheck, unionFind],
});

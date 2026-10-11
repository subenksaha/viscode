import { arr, edgeKey, graph, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  n: number;
  edges: [number, number][];
}

const ids = (n: number) => Array.from({ length: n }, (_, i) => i);

const unionFind = defineSolution<Input>({
  id: "union-find",
  name: "Union-Find",
  time: "O(E · α(n))",
  space: "O(n)",
  idea: "A tree has exactly n − 1 edges and no cycle. Union the endpoints of each edge; if they are already in the same set, that edge closes a cycle.",
  approach: [
    {
      title: "Edge count check",
      detail: "A tree on n nodes has exactly n − 1 edges. Any other count fails immediately.",
      at: "count",
    },
    {
      title: "Singleton sets",
      detail: "Each node starts alone.",
      at: "init",
    },
    {
      title: "Union each edge",
      detail: "Find both endpoints' roots and link them.",
      at: "union",
    },
    {
      title: "A shared root means a cycle",
      detail: "If an edge's endpoints already share a root, it closes a cycle. n − 1 edges with no cycle means the graph is connected, so it is a tree.",
      at: "ret",
    },
  ],
  code: code(`
    function validTree(n: number, edges: number[][]): boolean {
      if (edges.length !== n - 1) return false; //@count
      const parent = Array.from({ length: n }, (_, node) => node); //@init
      function findRoot(node: number): number {
        while (parent[node] !== node) node = parent[node];
        return node;
      }
      for (const [nodeA, nodeB] of edges) { //@edge
        const rootA = findRoot(nodeA);
        const rootB = findRoot(nodeB);
        if (rootA === rootB) return false; // already connected, so this edge makes a cycle //@cycle
        parent[rootA] = rootB; //@union
      }
      return true; //@ret
    }
  `),
  run({ n, edges }, t) {
    const parent = Array.from({ length: n }, (_, i) => i);
    const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
    const done: [number, number][] = [];
    const view = (edge?: [number, number], tone: Tone = "active") => [
      graph("graph", ids(n), edges, {
        edgeTones: tones(...done.map((e) => [edgeKey(...e), "success"] as [string, Tone]), [edge ? edgeKey(...edge) : null, tone]),
        tones: edge ? tones([edge[0], tone], [edge[1], tone]) : {},
      }),
      arr("parent", parent),
    ];
    if (edges.length !== n - 1) {
      t.step("count", `${edges.length} edges, but a tree on ${n} nodes has exactly ${n - 1}. Return false.`, view());
      return false;
    }
    t.step("count", `${edges.length} edges = n − 1. Now check for cycles.`, view());
    t.step("init", "Every node starts in its own set.", view());
    for (const [a, b] of edges) {
      const ra = find(a),
        rb = find(b);
      t.step("edge", `Edge ${a}–${b}: roots ${ra} and ${rb}.`, view([a, b]));
      if (ra === rb) {
        t.step("cycle", `${a} and ${b} are already connected. This edge makes a cycle.`, view([a, b], "danger"));
        return false;
      }
      parent[ra] = rb;
      done.push([a, b]);
      t.step("union", `Merge the sets: parent[${ra}] = ${rb}.`, view([a, b], "success"));
    }
    t.step("ret", "n − 1 edges and no cycle: it is a tree.", view());
    return true;
  },
});

const dfs = defineSolution<Input>({
  id: "dfs",
  name: "DFS Connectivity",
  time: "O(n + E)",
  space: "O(n + E)",
  idea: "With exactly n − 1 edges, the graph is a tree if and only if it is connected. DFS from node 0 and check that every node was reached.",
  approach: [
    {
      title: "Edge count check",
      detail: "With exactly n − 1 edges, being connected is equivalent to being a tree.",
      at: "count",
    },
    {
      title: "Build adjacency",
      detail: "Store undirected edges both ways.",
      at: "build",
    },
    {
      title: "DFS from 0",
      detail: "Mark every reachable node.",
      at: "visit",
      nth: 2,
    },
    {
      title: "Connected?",
      detail: "If DFS reached all n nodes, it is a tree.",
      at: "ret",
    },
  ],
  code: code(`
    function validTree(n: number, edges: number[][]): boolean {
      if (edges.length !== n - 1) return false; //@count
      const neighbors: number[][] = Array.from({ length: n }, () => []);
      for (const [nodeA, nodeB] of edges) { //@build
        neighbors[nodeA].push(nodeB);
        neighbors[nodeB].push(nodeA);
      }
      const visited = new Set<number>();
      function visit(node: number) {
        visited.add(node); //@visit
        for (const next of neighbors[node]) {
          if (!visited.has(next)) visit(next);
        }
      }
      visit(0);
      return visited.size === n; // n - 1 edges and connected means it's a tree //@ret
    }
  `),
  run({ n, edges }, t) {
    const seen = new Set<number>();
    const view = (u?: number) => {
      const tn: Record<string, Tone> = {};
      seen.forEach((s) => (tn[s] = "success"));
      if (u !== undefined) tn[u] = "active";
      return [vars({ reached: seen.size, n }), graph("graph", ids(n), edges, { tones: tn })];
    };
    if (edges.length !== n - 1) {
      t.step("count", `${edges.length} edges ≠ ${n - 1}. Return false.`, view());
      return false;
    }
    t.step("count", "Edge count is right. Check connectivity.", view());
    const adj: number[][] = Array.from({ length: n }, () => []);
    for (const [a, b] of edges) {
      adj[a].push(b);
      adj[b].push(a);
    }
    t.step("build", "Build the adjacency list.", view());
    const visit = (u: number) => {
      seen.add(u);
      t.step("visit", `Visit ${u}.`, () => view(u));
      for (const v of adj[u]) if (!seen.has(v)) visit(v);
    };
    if (n > 0) visit(0);
    const ok = seen.size === n;
    t.step("ret", ok ? "Every node reached. Return true." : `Only ${seen.size} of ${n} reached. Return false.`, view());
    return ok;
  },
});

const bfs = defineSolution<Input>({
  id: "bfs",
  name: "BFS with Parent Tracking",
  time: "O(n + E)",
  space: "O(n + E)",
  idea: "BFS from 0. Reaching an already-seen node that is not the node we came from means a cycle. At the end, every node must be seen.",
  approach: [
    {
      title: "Build adjacency",
      detail: "Store undirected edges both ways.",
      at: "build",
    },
    {
      title: "BFS with parents",
      detail: "Remember which node discovered each node.",
      at: "pop",
    },
    {
      title: "Skip the edge we came in on",
      detail: "In an undirected graph the parent shows up as a neighbor. That isn't a cycle.",
      at: "back",
    },
    {
      title: "Discover children",
      detail: "Any other already-seen neighbor would be a second path, which means a cycle. Otherwise record the parent and enqueue.",
      at: "push",
    },
    {
      title: "All nodes seen",
      detail: "No cycle plus every node reached means it is a tree.",
      at: "ret",
    },
  ],
  code: code(`
    function validTree(n: number, edges: number[][]): boolean {
      const neighbors: number[][] = Array.from({ length: n }, () => []);
      for (const [nodeA, nodeB] of edges) { //@build
        neighbors[nodeA].push(nodeB);
        neighbors[nodeB].push(nodeA);
      }
      const parent = new Map<number, number>(); // node -> the node we reached it from
      parent.set(0, -1);
      const queue = [0];
      while (queue.length > 0) { //@loop
        const node = queue.shift()!; //@pop
        for (const next of neighbors[node]) {
          if (next === parent.get(node)) continue; // the edge we came in on //@back
          if (parent.has(next)) return false; // reached twice: a cycle //@cycle
          parent.set(next, node); //@push
          queue.push(next);
        }
      }
      return parent.size === n; //@ret
    }
  `),
  run({ n, edges }, t) {
    const adj: number[][] = Array.from({ length: n }, () => []);
    for (const [a, b] of edges) {
      adj[a].push(b);
      adj[b].push(a);
    }
    const parent = new Map([[0, -1]]),
      queue = [0];
    const view = (u?: number, v?: number, bad = false) => {
      const tn: Record<string, Tone> = {};
      parent.forEach((_, k) => (tn[k] = "success"));
      if (u !== undefined) tn[u] = "active";
      if (v !== undefined) tn[v] = bad ? "danger" : "compare";
      return [
        graph("graph", ids(n), edges, { tones: tn, edgeTones: u !== undefined && v !== undefined ? tones([edgeKey(u, v), bad ? "danger" : "active"]) : {} }),
        arr("queue", queue, { indexLabels: false }),
      ];
    };
    t.step("build", "Build the adjacency list.", view());
    while (queue.length) {
      t.step("loop", `Queue: [${queue}].`, view());
      const u = queue.shift()!;
      t.step("pop", `Visit ${u}.`, view(u));
      for (const v of adj[u]) {
        if (v === parent.get(u)) {
          t.step("back", `${v} is the parent of ${u}. Skip the edge we came in on.`, view(u, v));
          continue;
        }
        if (parent.has(v)) {
          t.step("cycle", `${v} was already reached another way. Cycle!`, view(u, v, true));
          return false;
        }
        parent.set(v, u);
        queue.push(v);
        t.step("push", `Discover ${v} from ${u}.`, view(u, v));
      }
    }
    const ok = parent.size === n;
    t.step("ret", ok ? "Connected and acyclic: true." : "Some nodes are unreachable: false.", view());
    return ok;
  },
});

export default defineProblem<Input>({
  description: "Given n nodes labeled 0 to n − 1 and a list of undirected edges, return true if the edges form a valid tree.",
  input: {
    default: "n = 5, edges = [[0,1],[0,2],[0,3],[1,4]]",
    parse: (a) => ({ n: a.int("n"), edges: a.pairs("edges") }),
  },
  examples: [
    { input: "n = 5, edges = [[0,1],[0,2],[0,3],[1,4]]", output: true },
    { input: "n = 5, edges = [[0,1],[1,2],[2,3],[1,3],[1,4]]", output: false },
    { input: "n = 4, edges = [[0,1],[2,3],[1,2]]", output: true },
    { input: "n = 4, edges = [[0,1],[1,2],[2,0]]", output: false },
  ],
  solutions: [unionFind, dfs, bfs],
});

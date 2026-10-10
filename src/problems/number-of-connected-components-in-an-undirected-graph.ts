import { arr, edgeKey, graph, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  n: number;
  edges: [number, number][];
}

const ids = (n: number) => Array.from({ length: n }, (_, i) => i);
const palette: Tone[] = ["success", "compare", "visited", "window", "danger"];

const dfs = defineSolution<Input>({
  id: "dfs",
  name: "DFS",
  time: "O(n + E)",
  space: "O(n + E)",
  idea: "Every DFS started from an unvisited node explores exactly one component. Count the starts.",
  code: code(`
    function countComponents(n: number, edges: number[][]): number {
      const adj: number[][] = Array.from({ length: n }, () => []);
      for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); } //@build
      const seen = new Array(n).fill(false);
      const visit = (u: number) => {
        seen[u] = true; //@visit
        for (const v of adj[u]) if (!seen[v]) visit(v);
      };
      let count = 0;
      for (let i = 0; i < n; i++) if (!seen[i]) { count++; visit(i); } //@start
      return count; //@ret
    }
  `),
  run({ n, edges }, t) {
    const adj: number[][] = Array.from({ length: n }, () => []);
    for (const [a, b] of edges) {
      adj[a].push(b);
      adj[b].push(a);
    }
    const comp = new Array(n).fill(0);
    let count = 0;
    const view = (u?: number) => {
      const tn: Record<string, Tone> = {};
      comp.forEach((c, i) => c && (tn[i] = palette[(c - 1) % palette.length]));
      if (u !== undefined) tn[u] = "active";
      return [vars({ components: count }), graph("graph", ids(n), edges, { tones: tn })];
    };
    t.step("build", "Build the adjacency list.", view());
    const visit = (u: number) => {
      comp[u] = count;
      t.step("visit", `Visit ${u} (component ${count}).`, () => view(u));
      for (const v of adj[u]) if (!comp[v]) visit(v);
    };
    for (let i = 0; i < n; i++)
      if (!comp[i]) {
        count++;
        t.step("start", `${i} is unvisited: component ${count}.`, () => view(i));
        visit(i);
      }
    t.step("ret", `Return ${count}.`, view());
    return count;
  },
});

const unionFind = defineSolution<Input>({
  id: "union-find",
  name: "Union-Find",
  time: "O(E · α(n))",
  space: "O(n)",
  idea: "Start with n components. Each edge that joins two different sets merges them, so subtract one.",
  code: code(`
    function countComponents(n: number, edges: number[][]): number {
      const parent = Array.from({ length: n }, (_, i) => i); //@init
      const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
      let count = n;
      for (const [a, b] of edges) { //@edge
        const ra = find(a), rb = find(b);
        if (ra !== rb) { parent[ra] = rb; count--; } //@union
      }
      return count; //@ret
    }
  `),
  run({ n, edges }, t) {
    const parent = Array.from({ length: n }, (_, i) => i);
    const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
    let count = n;
    const view = (edge?: [number, number], tone: Tone = "active") => [
      vars({ components: count }),
      graph("graph", ids(n), edges, { edgeTones: edge ? tones([edgeKey(...edge), tone]) : {}, tones: edge ? tones([edge[0], tone], [edge[1], tone]) : {} }),
      arr("parent", parent),
    ];
    t.step("init", `${n} singleton sets.`, view());
    for (const [a, b] of edges) {
      const ra = find(a),
        rb = find(b);
      t.step("edge", `Edge ${a}–${b}: roots ${ra} and ${rb}.`, view([a, b]));
      if (ra !== rb) {
        parent[ra] = rb;
        count--;
        t.step("union", `Merge. components = ${count}.`, view([a, b], "success"));
      }
    }
    t.step("ret", `Return ${count}.`, view());
    return count;
  },
});

const bfs = defineSolution<Input>({
  id: "bfs",
  name: "BFS",
  time: "O(n + E)",
  space: "O(n + E)",
  idea: "Same counting idea as DFS, but explore each component with a queue.",
  code: code(`
    function countComponents(n: number, edges: number[][]): number {
      const adj: number[][] = Array.from({ length: n }, () => []);
      for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); } //@build
      const seen = new Array(n).fill(false);
      let count = 0;
      for (let i = 0; i < n; i++) {
        if (seen[i]) continue;
        count++; seen[i] = true; //@start
        const queue = [i];
        while (queue.length) {
          const u = queue.shift()!; //@pop
          for (const v of adj[u]) if (!seen[v]) { seen[v] = true; queue.push(v); }
        }
      }
      return count; //@ret
    }
  `),
  run({ n, edges }, t) {
    const adj: number[][] = Array.from({ length: n }, () => []);
    for (const [a, b] of edges) {
      adj[a].push(b);
      adj[b].push(a);
    }
    const comp = new Array(n).fill(0);
    let count = 0;
    let queue: number[] = [];
    const view = (u?: number) => {
      const tn: Record<string, Tone> = {};
      comp.forEach((c, i) => c && (tn[i] = palette[(c - 1) % palette.length]));
      if (u !== undefined) tn[u] = "active";
      return [vars({ components: count }), graph("graph", ids(n), edges, { tones: tn }), arr("queue", queue, { indexLabels: false })];
    };
    t.step("build", "Build the adjacency list.", view());
    for (let i = 0; i < n; i++) {
      if (comp[i]) continue;
      count++;
      comp[i] = count;
      queue = [i];
      t.step("start", `New component ${count} from ${i}.`, () => view(i));
      while (queue.length) {
        const u = queue.shift()!;
        for (const v of adj[u])
          if (!comp[v]) {
            comp[v] = count;
            queue.push(v);
          }
        t.step("pop", `Visit ${u}, enqueue its unvisited neighbors.`, () => view(u));
      }
    }
    t.step("ret", `Return ${count}.`, view());
    return count;
  },
});

export default defineProblem<Input>({
  description: "Given n nodes labeled 0 to n − 1 and a list of undirected edges, return the number of connected components.",
  input: {
    default: "n = 6, edges = [[0,1],[1,2],[3,4]]",
    parse: (a) => ({ n: a.int("n"), edges: a.pairs("edges") }),
  },
  examples: [
    { input: "n = 5, edges = [[0,1],[1,2],[3,4]]", output: 2 },
    { input: "n = 5, edges = [[0,1],[1,2],[2,3],[3,4]]", output: 1 },
  ],
  solutions: [dfs, bfs, unionFind],
});

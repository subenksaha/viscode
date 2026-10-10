import { arr, edgeKey, graph, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  points: [number, number][];
}

const dist = (p: [number, number], q: [number, number]) => Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]);
const names = (points: [number, number][]) => points.map((p) => `(${p})`);

const prim = defineSolution<Input>({
  id: "prim",
  name: "Prim's Algorithm (Dense, O(n²))",
  time: "O(n²)",
  space: "O(n)",
  idea: "Grow one tree from point 0. Keep for every outside point its cheapest edge into the tree; repeatedly add the cheapest outside point and update the others with distances to it.",
  code: code(`
    function minCostConnectPoints(points: number[][]): number {
      const n = points.length, best = new Array(n).fill(Infinity), inTree = new Array(n).fill(false);
      best[0] = 0;
      let total = 0; //@init
      for (let k = 0; k < n; k++) {
        let u = -1;
        for (let i = 0; i < n; i++) if (!inTree[i] && (u < 0 || best[i] < best[u])) u = i; //@pick
        inTree[u] = true; total += best[u]; //@add
        for (let v = 0; v < n; v++)
          if (!inTree[v]) best[v] = Math.min(best[v], Math.abs(points[u][0] - points[v][0]) + Math.abs(points[u][1] - points[v][1])); //@relax
      }
      return total; //@ret
    }
  `),
  run({ points }, t) {
    const n = points.length;
    const best = new Array(n).fill(Infinity),
      from = new Array(n).fill(-1),
      inTree = new Array(n).fill(false);
    best[0] = 0;
    let total = 0;
    const tree: [string, string][] = [];
    const nm = names(points);
    const view = (u?: number) => [
      vars({ total }),
      graph("MST so far", nm, tree, { tones: tones(...nm.map((p, i) => [p, inTree[i] ? "success" : "muted"] as [string, Tone]), [u !== undefined ? nm[u] : null, "active"]) }),
      arr("cheapest edge into tree", best.map((b) => (b === Infinity ? "∞" : b)), { indexLabels: nm, tones: tones(...inTree.map((x, i) => [x ? i : null, "muted"] as [number | null, Tone]), [u, "active"]) }),
    ];
    t.step("init", "Start the tree at point 0.", view());
    for (let k = 0; k < n; k++) {
      let u = -1;
      for (let i = 0; i < n; i++) if (!inTree[i] && (u < 0 || best[i] < best[u])) u = i;
      t.step("pick", `Cheapest outside point: ${nm[u]} at cost ${best[u]}.`, view(u));
      inTree[u] = true;
      total += best[u];
      if (from[u] >= 0) tree.push([nm[from[u]], nm[u]]);
      t.step("add", `Add it. total = ${total}.`, view(u));
      for (let v = 0; v < n; v++)
        if (!inTree[v]) {
          const d = dist(points[u], points[v]);
          if (d < best[v]) {
            best[v] = d;
            from[v] = u;
          }
        }
      if (k < n - 1) t.step("relax", `Update costs using edges from ${nm[u]}.`, view(u));
    }
    t.step("ret", `Return ${total}.`, view());
    return total;
  },
});

const kruskal = defineSolution<Input>({
  id: "kruskal",
  name: "Kruskal's Algorithm",
  time: "O(n² log n)",
  space: "O(n²)",
  idea: "List all n² edges, sort by length, and add each edge whose endpoints are in different components (union-find), until n − 1 edges are in.",
  code: code(`
    function minCostConnectPoints(points: number[][]): number {
      const n = points.length, edges: [number, number, number][] = [];
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++)
        edges.push([Math.abs(points[i][0] - points[j][0]) + Math.abs(points[i][1] - points[j][1]), i, j]);
      edges.sort((a, b) => a[0] - b[0]); //@sort
      const parent = Array.from({ length: n }, (_, i) => i);
      const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
      let total = 0, used = 0;
      for (const [d, i, j] of edges) {
        if (used === n - 1) break;
        const a = find(i), b = find(j);
        if (a === b) continue; //@skip
        parent[a] = b; total += d; used++; //@take
      }
      return total; //@ret
    }
  `),
  run({ points }, t) {
    const n = points.length,
      edges: [number, number, number][] = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) edges.push([dist(points[i], points[j]), i, j]);
    edges.sort((a, b) => a[0] - b[0]);
    const nm = names(points);
    const parent = Array.from({ length: n }, (_, i) => i);
    const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
    let total = 0,
      used = 0;
    const tree: [string, string][] = [];
    const view = (k?: number, tone: Tone = "active") => [
      vars({ total, edges: used }),
      graph("MST so far", nm, k !== undefined ? [...tree, [nm[edges[k][1]], nm[edges[k][2]]]] : tree, {
        edgeTones: k !== undefined ? tones([edgeKey(nm[edges[k][1]], nm[edges[k][2]]), tone]) : {},
      }),
      arr("edges by length", edges.map(([d, i, j]) => `${i}–${j}: ${d}`), { indexLabels: false, tones: tones([k, tone]) }),
    ];
    t.step("sort", `Sort all ${edges.length} edges by length.`, view());
    for (let k = 0; k < edges.length && used < n - 1; k++) {
      const [d, i, j] = edges[k];
      const a = find(i),
        b = find(j);
      if (a === b) {
        t.step("skip", `${nm[i]} and ${nm[j]} are already connected. Skip.`, () => view(k, "danger"));
        continue;
      }
      parent[a] = b;
      total += d;
      used++;
      tree.push([nm[i], nm[j]]);
      t.step("take", `Connect ${nm[i]}–${nm[j]} (${d}). total = ${total}.`, () => view(k, "success"));
    }
    t.step("ret", `Return ${total}.`, view());
    return total;
  },
});

export default defineProblem<Input>({
  description: "Given points on a 2D plane, the cost of connecting two points is their Manhattan distance. Return the minimum total cost to connect all points (so there is exactly one path between any two).",
  input: { default: "points = [[0,0],[2,2],[3,10],[5,2],[7,0]]", parse: (a) => ({ points: a.pairs("points") }) },
  examples: [
    { input: "points = [[0,0],[2,2],[3,10],[5,2],[7,0]]", output: 20 },
    { input: "points = [[3,12],[-2,5],[-4,1]]", output: 18 },
    { input: "points = [[0,0]]", output: 0 },
  ],
  solutions: [prim, kruskal],
});

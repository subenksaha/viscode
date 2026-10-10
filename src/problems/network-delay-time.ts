import { arr, edgeKey, graph, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  times: number[][];
  n: number;
  k: number;
}

const nodes = (n: number) => Array.from({ length: n }, (_, i) => i + 1);
const fmtD = (d: number[]) => d.slice(1).map((x) => (x === Infinity ? "∞" : x));

const bellmanFord = defineSolution<Input>({
  id: "bellman-ford",
  name: "Bellman-Ford",
  time: "O(V·E)",
  space: "O(V)",
  idea: "Relax every edge n − 1 times. After round r, every shortest path with at most r edges is known, and no shortest path needs more than n − 1 edges.",
  code: code(`
    function networkDelayTime(times: number[][], n: number, k: number): number {
      const dist = new Array(n + 1).fill(Infinity);
      dist[k] = 0; //@init
      for (let round = 1; round < n; round++) //@round
        for (const [u, v, w] of times)
          if (dist[u] + w < dist[v]) dist[v] = dist[u] + w; //@relax
      const worst = Math.max(...dist.slice(1));
      return worst === Infinity ? -1 : worst; //@ret
    }
  `),
  run({ times, n, k }, t) {
    const dist = new Array(n + 1).fill(Infinity);
    dist[k] = 0;
    const view = (edge?: number[], round?: number) => [
      vars({ round }),
      graph("network (u → v)", nodes(n), times.map(([u, v]) => [u, v] as const), {
        directed: true,
        tones: tones(...nodes(n).map((i) => [i, dist[i] === Infinity ? "muted" : "visited"] as [number, Tone]), [k, "success"], [edge?.[1], "active"]),
        edgeTones: edge ? tones([edgeKey(edge[0], edge[1]), "active"]) : {},
      }),
      arr("dist", fmtD(dist), { indexLabels: nodes(n).map(String), tones: tones([edge ? edge[1] - 1 : null, "active"]) }),
    ];
    t.step("init", `Signal starts at ${k}.`, view());
    for (let round = 1; round < n; round++) {
      t.step("round", `Round ${round}: relax every edge.`, view(undefined, round));
      for (const [u, v, w] of times)
        if (dist[u] + w < dist[v]) {
          dist[v] = dist[u] + w;
          t.step("relax", `${u} → ${v} (${w}): dist[${v}] = ${dist[v]}.`, view([u, v], round));
        }
    }
    const worst = Math.max(...dist.slice(1));
    const res = worst === Infinity ? -1 : worst;
    t.step("ret", res < 0 ? "Some node is unreachable: -1." : `The last node hears the signal at ${res}.`, view());
    return res;
  },
});

const dijkstra = defineSolution<Input>({
  id: "dijkstra",
  name: "Dijkstra with a Min-heap",
  time: "O(E log V)",
  space: "O(V + E)",
  idea: "Always settle the closest unsettled node next; its distance is final because all weights are non-negative. Then relax its outgoing edges. The answer is the largest settled distance.",
  code: code(`
    function networkDelayTime(times: number[][], n: number, k: number): number {
      const adj = new Map<number, [number, number][]>();
      for (const [u, v, w] of times) (adj.get(u) ?? adj.set(u, []).get(u)!).push([v, w]);
      const dist = new Map<number, number>(), heap = new MinPriorityQueue<[number, number]>((e) => e[0]);
      heap.enqueue([0, k]); //@init
      while (heap.size()) {
        const [d, u] = heap.dequeue();
        if (dist.has(u)) continue; //@stale
        dist.set(u, d); //@settle
        for (const [v, w] of adj.get(u) ?? []) if (!dist.has(v)) heap.enqueue([d + w, v]); //@push
      }
      return dist.size === n ? Math.max(...dist.values()) : -1; //@ret
    }
  `),
  run({ times, n, k }, t) {
    const adj = new Map<number, [number, number][]>();
    for (const [u, v, w] of times) {
      if (!adj.has(u)) adj.set(u, []);
      adj.get(u)!.push([v, w]);
    }
    const dist = new Map<number, number>();
    const heap: [number, number][] = [[0, k]];
    const view = (u?: number) => [
      graph("network (u → v)", nodes(n), times.map(([a, b]) => [a, b] as const), {
        directed: true,
        tones: tones(...[...dist.keys()].map((x) => [x, "success"] as [number, Tone]), ...heap.map(([, x]) => [dist.has(x) ? null : x, "compare"] as [number | null, Tone]), [u, "active"]),
      }),
      arr("settled dist", nodes(n).map((i) => dist.get(i) ?? "∞"), { indexLabels: nodes(n).map(String) }),
      arr("min-heap (dist, node)", [...heap].sort((a, b) => a[0] - b[0]).map(([d, x]) => `${d}, ${x}`), { indexLabels: false }),
    ];
    t.step("init", `Push (0, ${k}).`, view());
    while (heap.length) {
      heap.sort((a, b) => a[0] - b[0]);
      const [d, u] = heap.shift()!;
      if (dist.has(u)) {
        t.step("stale", `(${d}, ${u}) is stale: ${u} is already settled.`, view(u));
        continue;
      }
      dist.set(u, d);
      t.step("settle", `Settle ${u} at distance ${d}.`, view(u));
      const pushed = (adj.get(u) ?? []).filter(([v]) => !dist.has(v));
      for (const [v, w] of pushed) heap.push([d + w, v]);
      if (pushed.length) t.step("push", `Push ${pushed.map(([v, w]) => `(${d + w}, ${v})`).join(", ")}.`, view(u));
    }
    const res = dist.size === n ? Math.max(...dist.values()) : -1;
    t.step("ret", res < 0 ? "Not every node was reached: -1." : `Return ${res}.`, view());
    return res;
  },
});

export default defineProblem<Input>({
  description: "A network has n nodes labeled 1..n and directed travel times times[i] = [u, v, w]. A signal is sent from node k. Return the time until all nodes receive it, or -1 if some never do.",
  input: { default: "times = [[2,1,1],[2,3,1],[3,4,1],[1,4,4]], n = 4, k = 2", parse: (a) => ({ times: a.matrix<number>("times"), n: a.int("n"), k: a.int("k") }) },
  examples: [
    { input: "times = [[2,1,1],[2,3,1],[3,4,1]], n = 4, k = 2", output: 2 },
    { input: "times = [[1,2,1]], n = 2, k = 1", output: 1 },
    { input: "times = [[1,2,1]], n = 2, k = 2", output: -1 },
  ],
  solutions: [bellmanFord, dijkstra],
});

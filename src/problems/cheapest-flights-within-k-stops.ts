import { arr, edgeKey, graph, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  n: number;
  flights: number[][];
  src: number;
  dst: number;
  k: number;
}

const ids = (n: number) => Array.from({ length: n }, (_, i) => i);
const fmtD = (d: number[]) => d.map((x) => (x === Infinity ? "∞" : x));

const bellmanFord = defineSolution<Input>({
  id: "bellman-ford",
  name: "Bellman-Ford, k + 1 Rounds",
  time: "O(k · E)",
  space: "O(n)",
  idea: "Round r finds the cheapest prices using at most r flights. Relax from a copy of the previous round's prices so one round never chains two flights. After k + 1 rounds, read dst.",
  code: code(`
    function findCheapestPrice(n: number, flights: number[][], src: number, dst: number, k: number): number {
      let price = new Array(n).fill(Infinity);
      price[src] = 0; //@init
      for (let r = 0; r <= k; r++) { //@round
        const next = [...price];
        for (const [u, v, w] of flights)
          if (price[u] + w < next[v]) next[v] = price[u] + w; //@relax
        price = next;
      }
      return price[dst] === Infinity ? -1 : price[dst]; //@ret
    }
  `),
  run({ n, flights, src, dst, k }, t) {
    let price = new Array(n).fill(Infinity);
    price[src] = 0;
    const view = (p: number[], round?: number, edge?: number[]) => [
      vars({ round, "max flights": round !== undefined ? round + 1 : undefined }),
      graph("flights", ids(n), flights.map(([u, v]) => [u, v] as const), {
        directed: true,
        tones: tones([src, "success"], [dst, "compare"], [edge?.[1], "active"]),
        edgeTones: edge ? tones([edgeKey(edge[0], edge[1]), "active"]) : {},
      }),
      arr("price", fmtD(p), { tones: tones([dst, "compare"], [edge?.[1], "active"]) }),
    ];
    t.step("init", `price[${src}] = 0.`, view(price));
    for (let r = 0; r <= k; r++) {
      const next = [...price];
      t.step("round", `Round ${r + 1}: paths with up to ${r + 1} flights.`, view(next, r));
      for (const [u, v, w] of flights)
        if (price[u] + w < next[v]) {
          next[v] = price[u] + w;
          t.step("relax", `${u} → ${v} for ${w}: price[${v}] = ${next[v]}.`, view(next, r, [u, v]));
        }
      price = next;
    }
    const res = price[dst] === Infinity ? -1 : price[dst];
    t.step("ret", res < 0 ? `${dst} is unreachable within ${k} stops.` : `Cheapest price to ${dst}: ${res}.`, view(price));
    return res;
  },
});

const bfs = defineSolution<Input>({
  id: "bfs-levels",
  name: "BFS by Number of Stops",
  time: "O(k · E)",
  space: "O(n + E)",
  idea: "Expand level by level, where level = flights taken. Keep the best known price per city and only re-queue a city when this level reaches it more cheaply. Stop after k + 1 levels.",
  code: code(`
    function findCheapestPrice(n: number, flights: number[][], src: number, dst: number, k: number): number {
      const adj: [number, number][][] = Array.from({ length: n }, () => []);
      for (const [u, v, w] of flights) adj[u].push([v, w]);
      const best = new Array(n).fill(Infinity);
      best[src] = 0;
      let level: [number, number][] = [[src, 0]]; //@init
      for (let stops = 0; stops <= k && level.length; stops++) { //@level
        const next: [number, number][] = [];
        for (const [u, cost] of level)
          for (const [v, w] of adj[u])
            if (cost + w < best[v]) { best[v] = cost + w; next.push([v, cost + w]); } //@improve
        level = next;
      }
      return best[dst] === Infinity ? -1 : best[dst]; //@ret
    }
  `),
  run({ n, flights, src, dst, k }, t) {
    const adj: [number, number][][] = Array.from({ length: n }, () => []);
    for (const [u, v, w] of flights) adj[u].push([v, w]);
    const best = new Array(n).fill(Infinity);
    best[src] = 0;
    let level: [number, number][] = [[src, 0]];
    const view = (stops?: number, edge?: [number, number]) => [
      vars({ stops }),
      graph("flights", ids(n), flights.map(([u, v]) => [u, v] as const), {
        directed: true,
        tones: tones(...level.map(([u]) => [u, "visited"] as [number, Tone]), [src, "success"], [dst, "compare"], [edge?.[1], "active"]),
        edgeTones: edge ? tones([edgeKey(...edge), "active"]) : {},
      }),
      arr("best", fmtD(best), { tones: tones([dst, "compare"], [edge?.[1], "active"]) }),
      arr("current level (city, cost)", level.map(([u, c]) => `${u}, ${c}`), { indexLabels: false }),
    ];
    t.step("init", `Start at ${src} with cost 0.`, view());
    for (let stops = 0; stops <= k && level.length; stops++) {
      t.step("level", `Take flight #${stops + 1} from ${level.length} cit${level.length > 1 ? "ies" : "y"}.`, view(stops));
      const next: [number, number][] = [];
      for (const [u, cost] of level)
        for (const [v, w] of adj[u])
          if (cost + w < best[v]) {
            best[v] = cost + w;
            next.push([v, cost + w]);
            t.step("improve", `${u} → ${v}: ${cost} + ${w} = ${cost + w} is cheaper.`, view(stops, [u, v]));
          }
      level = next;
    }
    const res = best[dst] === Infinity ? -1 : best[dst];
    t.step("ret", res < 0 ? "Unreachable: -1." : `Return ${res}.`, view());
    return res;
  },
});

export default defineProblem<Input>({
  description: "There are n cities and flights[i] = [from, to, price]. Return the cheapest price from src to dst using at most k stops (k + 1 flights), or -1 if there is no such route.",
  input: {
    default: "n = 4, flights = [[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]], src = 0, dst = 3, k = 1",
    parse: (a) => ({ n: a.int("n"), flights: a.matrix<number>("flights"), src: a.int("src"), dst: a.int("dst"), k: a.int("k") }),
  },
  examples: [
    { input: "n = 4, flights = [[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]], src = 0, dst = 3, k = 1", output: 700 },
    { input: "n = 3, flights = [[0,1,100],[1,2,100],[0,2,500]], src = 0, dst = 2, k = 1", output: 200 },
    { input: "n = 3, flights = [[0,1,100],[1,2,100],[0,2,500]], src = 0, dst = 2, k = 0", output: 500 },
  ],
  solutions: [bellmanFord, bfs],
});

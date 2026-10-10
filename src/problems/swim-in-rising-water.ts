import { arr, grid, rc, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  grid: number[][];
}

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

const binary = defineSolution<Input>({
  id: "binary-search-dfs",
  name: "Binary Search on Time + DFS",
  time: "O(n² log n²)",
  space: "O(n²)",
  idea: "If you can cross at time T, you can cross at any later time. Binary-search the smallest T for which a DFS through cells with elevation ≤ T reaches the corner.",
  code: code(`
    function swimInWater(grid: number[][]): number {
      const n = grid.length;
      const canCross = (T: number) => {
        const seen = new Set<number>();
        const dfs = (r: number, c: number): boolean => {
          if (r < 0 || c < 0 || r >= n || c >= n || seen.has(r * n + c) || grid[r][c] > T) return false;
          if (r === n - 1 && c === n - 1) return true;
          seen.add(r * n + c); //@visit
          return dfs(r + 1, c) || dfs(r - 1, c) || dfs(r, c + 1) || dfs(r, c - 1);
        };
        return dfs(0, 0);
      };
      let lo = grid[0][0], hi = n * n - 1; //@init
      while (lo < hi) {
        const mid = (lo + hi) >> 1; //@mid
        if (canCross(mid)) hi = mid; //@yes
        else lo = mid + 1; //@no
      }
      return lo; //@ret
    }
  `),
  run({ grid: g }, t) {
    const n = g.length;
    const view = (T: number, seen: Set<number>, cur?: number, lo?: number, hi?: number) => {
      const tn: Record<string, Tone> = {};
      g.forEach((row, r) => row.forEach((v, c) => v > T && (tn[rc(r, c)] = "muted")));
      seen.forEach((k) => (tn[rc(Math.floor(k / n), k % n)] = "visited"));
      if (cur !== undefined) tn[rc(Math.floor(cur / n), cur % n)] = "active";
      return [vars({ lo, hi, T }), grid("elevation (grey = above T)", g, { tones: tn })];
    };
    const canCross = (T: number, lo: number, hi: number) => {
      const seen = new Set<number>();
      const dfs = (r: number, c: number): boolean => {
        if (r < 0 || c < 0 || r >= n || c >= n || seen.has(r * n + c) || g[r][c] > T) return false;
        if (r === n - 1 && c === n - 1) return true;
        seen.add(r * n + c);
        t.step("visit", `Swim to (${r}, ${c}) (elevation ${g[r][c]} ≤ ${T}).`, () => view(T, seen, r * n + c, lo, hi));
        return DIRS.some(([dr, dc]) => dfs(r + dr, c + dc));
      };
      return dfs(0, 0);
    };
    let lo = g[0][0],
      hi = n * n - 1;
    t.step("init", `T is between ${lo} and ${hi}.`, view(lo, new Set(), undefined, lo, hi));
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      t.step("mid", `Can we cross at T = ${mid}?`, view(mid, new Set(), undefined, lo, hi));
      if (canCross(mid, lo, hi)) {
        hi = mid;
        t.step("yes", `Yes. Try earlier: hi = ${mid}.`, view(mid, new Set(), undefined, lo, hi));
      } else {
        lo = mid + 1;
        t.step("no", `No. Need more time: lo = ${lo}.`, view(mid, new Set(), undefined, lo, hi));
      }
    }
    t.step("ret", `Return ${lo}.`, view(lo, new Set(), undefined, lo, hi));
    return lo;
  },
});

const dijkstra = defineSolution<Input>({
  id: "dijkstra",
  name: "Dijkstra on the Path Maximum",
  time: "O(n² log n)",
  space: "O(n²)",
  idea: "The cost of a path is its highest elevation. Expand cells from a min-heap keyed by that cost; the first time the corner is popped, its cost is the answer.",
  code: code(`
    function swimInWater(grid: number[][]): number {
      const n = grid.length, seen = new Set<number>([0]);
      const heap = new MinPriorityQueue<[number, number, number]>((e) => e[0]);
      heap.enqueue([grid[0][0], 0, 0]); //@init
      while (true) {
        const [t, r, c] = heap.dequeue(); //@pop
        if (r === n - 1 && c === n - 1) return t; //@ret
        for (const [x, y] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]])
          if (x >= 0 && y >= 0 && x < n && y < n && !seen.has(x * n + y)) {
            seen.add(x * n + y); heap.enqueue([Math.max(t, grid[x][y]), x, y]); //@push
          }
      }
    }
  `),
  run({ grid: g }, t) {
    const n = g.length;
    const seen = new Set<number>([0]);
    const done = new Set<number>();
    const heap: [number, number, number][] = [[g[0][0], 0, 0]];
    const view = (cur?: [number, number], tm?: number) => {
      const tn: Record<string, Tone> = {};
      seen.forEach((k) => (tn[rc(Math.floor(k / n), k % n)] = "compare"));
      done.forEach((k) => (tn[rc(Math.floor(k / n), k % n)] = "visited"));
      if (cur) tn[rc(...cur)] = "active";
      return [
        vars({ time: tm }),
        grid("elevation", g, { tones: tn }),
        arr("min-heap (time @ cell)", [...heap].sort((a, b) => a[0] - b[0]).map(([a, r, c]) => `${a} @ (${r},${c})`), { indexLabels: false }),
      ];
    };
    t.step("init", `Start at (0, 0) with time ${g[0][0]}.`, view());
    while (true) {
      heap.sort((a, b) => a[0] - b[0]);
      const [tm, r, c] = heap.shift()!;
      done.add(r * n + c);
      if (r === n - 1 && c === n - 1) {
        t.step("ret", `Reached the corner at time ${tm}.`, view([r, c], tm));
        return tm;
      }
      t.step("pop", `Cheapest frontier cell: (${r}, ${c}) at time ${tm}.`, view([r, c], tm));
      for (const [x, y] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]])
        if (x >= 0 && y >= 0 && x < n && y < n && !seen.has(x * n + y)) {
          seen.add(x * n + y);
          heap.push([Math.max(tm, g[x][y]), x, y]);
          t.step("push", `(${x}, ${y}) reachable at time max(${tm}, ${g[x][y]}) = ${Math.max(tm, g[x][y])}.`, view([r, c], tm));
        }
    }
  },
});

export default defineProblem<Input>({
  description: "In an n×n grid of distinct elevations, the water level at time t is t. You can swim between 4-adjacent cells if both elevations are ≤ t. Return the least time at which you can reach (n−1, n−1) from (0, 0).",
  input: {
    default: "grid = [[0,1,2,3,4],[24,23,22,21,5],[12,13,14,15,16],[11,17,18,19,20],[10,9,8,7,6]]",
    parse: (a) => ({ grid: a.matrix<number>("grid") }),
  },
  examples: [
    { input: "grid = [[0,2],[1,3]]", output: 3 },
    { input: "grid = [[0,1,2,3,4],[24,23,22,21,5],[12,13,14,15,16],[11,17,18,19,20],[10,9,8,7,6]]", output: 16 },
    { input: "grid = [[3,2],[0,1]]", output: 3 },
  ],
  solutions: [binary, dijkstra],
});

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
      // Can we get from the top-left to the bottom-right once the water is at level time?
      function canCross(time: number): boolean {
        const visited = new Set<string>();
        function reach(row: number, col: number): boolean {
          const outside = row < 0 || col < 0 || row >= n || col >= n;
          if (outside || visited.has(row + "," + col) || grid[row][col] > time) return false;
          if (row === n - 1 && col === n - 1) return true;
          visited.add(row + "," + col); //@visit
          return reach(row + 1, col) || reach(row - 1, col) || reach(row, col + 1) || reach(row, col - 1);
        }
        return reach(0, 0);
      }
      // Binary search for the smallest time that works.
      let low = grid[0][0]; //@init
      let high = n * n - 1;
      while (low < high) {
        const mid = Math.floor((low + high) / 2); //@mid
        if (canCross(mid)) {
          high = mid; //@yes
        } else {
          low = mid + 1; //@no
        }
      }
      return low; //@ret
    }
  `),
  run({ grid: g }, t) {
    const n = g.length;
    const view = (T: number, seen: Set<number>, cur?: number, lo?: number, hi?: number) => {
      const tn: Record<string, Tone> = {};
      g.forEach((row, r) => row.forEach((v, c) => v > T && (tn[rc(r, c)] = "muted")));
      seen.forEach((k) => (tn[rc(Math.floor(k / n), k % n)] = "visited"));
      if (cur !== undefined) tn[rc(Math.floor(cur / n), cur % n)] = "active";
      return [vars({ low: lo, high: hi, time: T }), grid("elevation (grey = above T)", g, { tones: tn })];
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
      const n = grid.length;
      const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      const visited = new Set<string>(["0,0"]);
      // Min-heap of [earliest time we can stand here, row, col].
      const heap = new MinPriorityQueue<[number, number, number]>((entry) => entry[0]);
      heap.enqueue([grid[0][0], 0, 0]); //@init
      while (true) {
        const [time, row, col] = heap.dequeue(); //@pop
        if (row === n - 1 && col === n - 1) return time; //@ret
        for (const [rowStep, colStep] of directions) {
          const nextRow = row + rowStep;
          const nextCol = col + colStep;
          const inside = nextRow >= 0 && nextCol >= 0 && nextRow < n && nextCol < n;
          if (inside && !visited.has(nextRow + "," + nextCol)) {
            visited.add(nextRow + "," + nextCol); //@push
            // We must wait until the water covers both the path so far and the next cell.
            heap.enqueue([Math.max(time, grid[nextRow][nextCol]), nextRow, nextCol]);
          }
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

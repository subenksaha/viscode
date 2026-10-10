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

function view(display: number[][], owner: number[][], best: number, area: number, cur?: [number, number], bestId?: number, extra: ReturnType<typeof arr>[] = []) {
  const tn: Record<string, Tone> = {};
  owner.forEach((row, r) => row.forEach((o, c) => o && (tn[rc(r, c)] = o === bestId ? "success" : "visited")));
  if (cur) tn[rc(...cur)] = "active";
  return [vars({ area, best }), grid("grid", display, { tones: tn }), ...extra];
}

const dfs = defineSolution<Input>({
  id: "dfs",
  name: "Recursive DFS",
  time: "O(m·n)",
  space: "O(m·n)",
  idea: "Scan for land. From each unvisited land cell, DFS returns 1 plus the areas of its four neighbors, sinking cells so they are counted once. Track the largest result.",
  code: code(`
    function maxAreaOfIsland(grid: number[][]): number {
      const m = grid.length, n = grid[0].length;
      const area = (r: number, c: number): number => {
        if (r < 0 || c < 0 || r >= m || c >= n || grid[r][c] !== 1) return 0;
        grid[r][c] = 0; //@sink
        return 1 + area(r + 1, c) + area(r - 1, c) + area(r, c + 1) + area(r, c - 1);
      };
      let best = 0;
      for (let r = 0; r < m; r++)
        for (let c = 0; c < n; c++)
          if (grid[r][c] === 1) best = Math.max(best, area(r, c)); //@island
      return best; //@ret
    }
  `),
  run({ grid: g }, t) {
    const m = g.length,
      n = g[0].length;
    const display = g.map((row) => [...row]);
    const owner = g.map((row) => row.map(() => 0));
    let best = 0,
      bestId = 0,
      id = 0,
      cur = 0;
    const area = (r: number, c: number): number => {
      if (r < 0 || c < 0 || r >= m || c >= n || g[r][c] !== 1) return 0;
      g[r][c] = 0;
      owner[r][c] = id;
      cur++;
      t.step("sink", `Land at (${r}, ${c}). Island size so far: ${cur}.`, () => view(display, owner, best, cur, [r, c], bestId));
      let s = 1;
      for (const [dr, dc] of DIRS) s += area(r + dr, c + dc);
      return s;
    };
    for (let r = 0; r < m; r++)
      for (let c = 0; c < n; c++)
        if (g[r][c] === 1) {
          id++;
          cur = 0;
          const a = area(r, c);
          if (a > best) {
            best = a;
            bestId = id;
          }
          t.step("island", `This island has area ${a}. best = ${best}.`, () => view(display, owner, best, a, undefined, bestId));
        }
    t.step("ret", `Return ${best}.`, () => view(display, owner, best, 0, undefined, bestId));
    return best;
  },
});

const bfs = defineSolution<Input>({
  id: "bfs",
  name: "Iterative BFS",
  time: "O(m·n)",
  space: "O(min(m, n))",
  idea: "Same scan, but measure each island with a queue: count cells as they are dequeued and enqueue unvisited land neighbors.",
  code: code(`
    function maxAreaOfIsland(grid: number[][]): number {
      const m = grid.length, n = grid[0].length;
      let best = 0;
      for (let r = 0; r < m; r++)
        for (let c = 0; c < n; c++) {
          if (grid[r][c] !== 1) continue;
          grid[r][c] = 0;
          const queue = [[r, c]];
          let area = 0; //@start
          while (queue.length) {
            const [i, j] = queue.shift()!; area++; //@pop
            for (const [x, y] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]])
              if (x >= 0 && y >= 0 && x < m && y < n && grid[x][y] === 1) { grid[x][y] = 0; queue.push([x, y]); } //@push
          }
          best = Math.max(best, area); //@best
        }
      return best; //@ret
    }
  `),
  run({ grid: g }, t) {
    const m = g.length,
      n = g[0].length;
    const display = g.map((row) => [...row]);
    const owner = g.map((row) => row.map(() => 0));
    let best = 0,
      bestId = 0,
      id = 0;
    for (let r = 0; r < m; r++)
      for (let c = 0; c < n; c++) {
        if (g[r][c] !== 1) continue;
        id++;
        g[r][c] = 0;
        owner[r][c] = id;
        const queue: [number, number][] = [[r, c]];
        let area = 0;
        const qv = () => [arr("queue", queue.map((q) => `(${q})`), { indexLabels: false })];
        t.step("start", `New island at (${r}, ${c}).`, () => view(display, owner, best, area, [r, c], bestId, qv()));
        while (queue.length) {
          const [i, j] = queue.shift()!;
          area++;
          t.step("pop", `Count (${i}, ${j}). area = ${area}.`, () => view(display, owner, best, area, [i, j], bestId, qv()));
          for (const [x, y] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]])
            if (x >= 0 && y >= 0 && x < m && y < n && g[x][y] === 1) {
              g[x][y] = 0;
              owner[x][y] = id;
              queue.push([x, y]);
            }
        }
        if (area > best) {
          best = area;
          bestId = id;
        }
        t.step("best", `Island area ${area}. best = ${best}.`, () => view(display, owner, best, area, undefined, bestId));
      }
    t.step("ret", `Return ${best}.`, () => view(display, owner, best, 0, undefined, bestId));
    return best;
  },
});

export default defineProblem<Input>({
  description: "Given a binary grid where 1 is land and 0 is water, return the area of the largest island (4-directionally connected land). Return 0 if there is no island.",
  input: {
    default: "grid = [[1,1,0,0,0],[1,1,0,0,0],[0,0,0,1,1],[0,0,1,1,1]]",
    parse: (a) => ({ grid: a.matrix<number>("grid") }),
  },
  examples: [
    {
      input: "grid = [[0,0,1,0,0,0,0,1,0,0,0,0,0],[0,0,0,0,0,0,0,1,1,1,0,0,0],[0,1,1,0,1,0,0,0,0,0,0,0,0],[0,1,0,0,1,1,0,0,1,0,1,0,0],[0,1,0,0,1,1,0,0,1,1,1,0,0],[0,0,0,0,0,0,0,0,0,0,1,0,0],[0,0,0,0,0,0,0,1,1,1,0,0,0],[0,0,0,0,0,0,0,1,1,0,0,0,0]]",
      output: 6,
    },
    { input: "grid = [[0,0,0,0,0,0,0,0]]", output: 0 },
    { input: "grid = [[1,1,0,0,0],[1,1,0,0,0],[0,0,0,1,1],[0,0,1,1,1]]", output: 5 },
  ],
  solutions: [dfs, bfs],
});

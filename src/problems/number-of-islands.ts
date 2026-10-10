import { arr, grid, rc, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  grid: string[][];
}

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/** Land cells keep their island number once sunk, so islands get distinct colors. */
function islandView(g: string[][], owner: number[][], cur?: [number, number], count?: number) {
  const palette: Tone[] = ["success", "compare", "visited", "window", "danger"];
  const tn: Record<string, Tone> = {};
  owner.forEach((row, r) => row.forEach((o, c) => o && (tn[rc(r, c)] = palette[(o - 1) % palette.length])));
  if (cur) tn[rc(...cur)] = "active";
  return [vars({ islands: count }), grid("grid", g, { tones: tn })];
}

const dfs = defineSolution<Input>({
  id: "dfs",
  name: "DFS Flood Fill",
  time: "O(m·n)",
  space: "O(m·n)",
  idea: "Scan the grid. Each unvisited '1' starts a new island; flood-fill it with DFS, sinking every connected land cell so it is not counted again.",
  code: code(`
    function numIslands(grid: string[][]): number {
      const m = grid.length, n = grid[0].length;
      let count = 0;
      function sink(r: number, c: number) {
        if (r < 0 || c < 0 || r >= m || c >= n || grid[r][c] !== "1") return;
        grid[r][c] = "0"; //@sink
        sink(r + 1, c); sink(r - 1, c); sink(r, c + 1); sink(r, c - 1);
      }
      for (let r = 0; r < m; r++)
        for (let c = 0; c < n; c++) //@scan
          if (grid[r][c] === "1") { count++; sink(r, c); } //@found
      return count; //@ret
    }
  `),
  run({ grid: g }, t) {
    const m = g.length,
      n = g[0].length;
    const display = g.map((row) => [...row]);
    const owner = g.map((row) => row.map(() => 0));
    let count = 0;
    const sink = (r: number, c: number) => {
      if (r < 0 || c < 0 || r >= m || c >= n || g[r][c] !== "1") return;
      g[r][c] = "0";
      owner[r][c] = count;
      t.step("sink", `Sink (${r}, ${c}) as part of island ${count}.`, () => islandView(display, owner, [r, c], count));
      for (const [dr, dc] of DIRS) sink(r + dr, c + dc);
    };
    for (let r = 0; r < m; r++)
      for (let c = 0; c < n; c++) {
        if (g[r][c] === "1") {
          count++;
          t.step("found", `Unvisited land at (${r}, ${c}): island ${count}.`, () => islandView(display, owner, [r, c], count));
          sink(r, c);
        } else t.step("scan", `(${r}, ${c}) is ${owner[r][c] ? "already sunk" : "water"}.`, () => islandView(display, owner, [r, c], count));
      }
    t.step("ret", `Return ${count}.`, () => islandView(display, owner, undefined, count));
    return count;
  },
});

const bfs = defineSolution<Input>({
  id: "bfs",
  name: "BFS Flood Fill",
  time: "O(m·n)",
  space: "O(min(m, n))",
  idea: "Same scan, but explore each island with a queue instead of recursion.",
  code: code(`
    function numIslands(grid: string[][]): number {
      const m = grid.length, n = grid[0].length;
      let count = 0;
      for (let r = 0; r < m; r++)
        for (let c = 0; c < n; c++) { //@scan
          if (grid[r][c] !== "1") continue;
          count++; grid[r][c] = "0"; //@found
          const queue = [[r, c]];
          while (queue.length) {
            const [i, j] = queue.shift()!; //@pop
            for (const [x, y] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]])
              if (x >= 0 && y >= 0 && x < m && y < n && grid[x][y] === "1") {
                grid[x][y] = "0"; queue.push([x, y]); //@push
              }
          }
        }
      return count; //@ret
    }
  `),
  run({ grid: g }, t) {
    const m = g.length,
      n = g[0].length;
    const display = g.map((row) => [...row]);
    const owner = g.map((row) => row.map(() => 0));
    let count = 0;
    let queue: [number, number][] = [];
    const view = (cur?: [number, number]) => [...islandView(display, owner, cur, count), arr("queue", queue.map((q) => `(${q})`), { indexLabels: false })];
    for (let r = 0; r < m; r++)
      for (let c = 0; c < n; c++) {
        if (g[r][c] !== "1") {
          t.step("scan", `(${r}, ${c}) is not unvisited land.`, () => view([r, c]));
          continue;
        }
        count++;
        g[r][c] = "0";
        owner[r][c] = count;
        queue = [[r, c]];
        t.step("found", `New island ${count} at (${r}, ${c}).`, () => view([r, c]));
        while (queue.length) {
          const [i, j] = queue.shift()!;
          t.step("pop", `Explore (${i}, ${j}).`, () => view([i, j]));
          for (const [x, y] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]])
            if (x >= 0 && y >= 0 && x < m && y < n && g[x][y] === "1") {
              g[x][y] = "0";
              owner[x][y] = count;
              queue.push([x, y]);
              t.step("push", `Land at (${x}, ${y}): mark and enqueue.`, () => view([i, j]));
            }
        }
      }
    t.step("ret", `Return ${count}.`, () => view());
    return count;
  },
});

const unionFind = defineSolution<Input>({
  id: "union-find",
  name: "Union-Find",
  time: "O(m·n · α(m·n))",
  space: "O(m·n)",
  idea: "Start with one set per land cell. Union each land cell with its land neighbors to the right and below. Every successful union merges two islands, so subtract one.",
  code: code(`
    function numIslands(grid: string[][]): number {
      const m = grid.length, n = grid[0].length, parent: number[] = [];
      let count = 0;
      const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
      for (let r = 0; r < m; r++) for (let c = 0; c < n; c++)
        if (grid[r][c] === "1") { parent[r * n + c] = r * n + c; count++; } //@init
      for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) { //@cell
        if (grid[r][c] !== "1") continue;
        for (const [x, y] of [[r + 1, c], [r, c + 1]]) {
          if (x >= m || y >= n || grid[x][y] !== "1") continue;
          const a = find(r * n + c), b = find(x * n + y); //@find
          if (a !== b) { parent[a] = b; count--; } //@union
        }
      }
      return count; //@ret
    }
  `),
  run({ grid: g }, t) {
    const m = g.length,
      n = g[0].length,
      parent: number[] = [];
    let count = 0;
    const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
    for (let r = 0; r < m; r++)
      for (let c = 0; c < n; c++)
        if (g[r][c] === "1") {
          parent[r * n + c] = r * n + c;
          count++;
        }
    const view = (cur?: [number, number], other?: [number, number]) => {
      // Show each land cell's root id; cells sharing a root share a set.
      const roots = g.map((row, r) => row.map((v, c) => (v === "1" ? find(r * n + c) : "")));
      const tn: Record<string, Tone> = {};
      if (cur) tn[rc(...cur)] = "active";
      if (other) tn[rc(...other)] = "compare";
      return [vars({ islands: count }), grid("root of each land cell", roots, { tones: tn })];
    };
    t.step("init", `Each of the ${count} land cells is its own set.`, () => view());
    for (let r = 0; r < m; r++)
      for (let c = 0; c < n; c++) {
        if (g[r][c] !== "1") continue;
        t.step("cell", `Land at (${r}, ${c}).`, () => view([r, c]));
        for (const [x, y] of [[r + 1, c], [r, c + 1]]) {
          if (x >= m || y >= n || g[x][y] !== "1") continue;
          const a = find(r * n + c),
            b = find(x * n + y);
          t.step("find", `Neighbor (${x}, ${y}) is land. Roots: ${a} and ${b}.`, () => view([r, c], [x, y]));
          if (a !== b) {
            parent[a] = b;
            count--;
            t.step("union", `Different sets: merge them. Islands = ${count}.`, () => view([r, c], [x, y]));
          }
        }
      }
    t.step("ret", `Return ${count}.`, () => view());
    return count;
  },
});

export default defineProblem<Input>({
  description: "Given a grid of '1' (land) and '0' (water), return the number of islands: groups of land connected horizontally or vertically.",
  input: {
    default: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]',
    parse: (a) => ({ grid: a.matrix<string>("grid") }),
  },
  examples: [
    { input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', output: 1 },
    { input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', output: 3 },
    { input: 'grid = [["1","0","1"],["0","1","0"],["1","0","1"]]', output: 5 },
  ],
  solutions: [dfs, bfs, unionFind],
});

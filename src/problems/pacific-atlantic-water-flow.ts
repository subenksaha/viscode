import { grid, rc, text } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  heights: number[][];
}

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

const bruteForce = defineSolution<Input>({
  id: "brute-force",
  name: "DFS from Every Cell",
  time: "O((m·n)²)",
  space: "O(m·n)",
  idea: "From each cell, flow downhill (to equal or lower neighbors) and check whether the water reaches both oceans.",
  code: code(`
    function pacificAtlantic(heights: number[][]): number[][] {
      const m = heights.length, n = heights[0].length, res: number[][] = [];
      for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) { //@cell
        let pac = false, atl = false;
        const seen = new Set<number>([r * n + c]), stack = [[r, c]];
        while (stack.length) { //@flow
          const [i, j] = stack.pop()!;
          if (i === 0 || j === 0) pac = true;
          if (i === m - 1 || j === n - 1) atl = true;
          for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const x = i + di, y = j + dj;
            if (x < 0 || y < 0 || x >= m || y >= n || seen.has(x * n + y)) continue;
            if (heights[x][y] <= heights[i][j]) { seen.add(x * n + y); stack.push([x, y]); }
          }
        }
        if (pac && atl) res.push([r, c]); //@both
      }
      return res; //@ret
    }
  `),
  run({ heights }, t) {
    const m = heights.length,
      n = heights[0].length,
      res: number[][] = [];
    const view = (seen: Set<number>, r: number, c: number, cur?: [number, number]) => {
      const tn: Record<string, Tone> = {};
      seen.forEach((k) => (tn[rc(Math.floor(k / n), k % n)] = "visited"));
      res.forEach(([a, b]) => (tn[rc(a, b)] = "success"));
      tn[rc(r, c)] = "active";
      if (cur) tn[rc(...cur)] = "compare";
      return [grid("heights", heights, { tones: tn }), text("result", res.map((p) => `[${p}]`).join(" "))];
    };
    for (let r = 0; r < m; r++)
      for (let c = 0; c < n; c++) {
        let pac = false,
          atl = false;
        const seen = new Set<number>([r * n + c]),
          stack: [number, number][] = [[r, c]];
        t.step("cell", `Pour water on (${r}, ${c}).`, () => view(seen, r, c));
        while (stack.length) {
          const [i, j] = stack.pop()!;
          if (i === 0 || j === 0) pac = true;
          if (i === m - 1 || j === n - 1) atl = true;
          t.step("flow", `Water at (${i}, ${j}). Pacific: ${pac}, Atlantic: ${atl}.`, () => view(seen, r, c, [i, j]));
          for (const [di, dj] of DIRS) {
            const x = i + di,
              y = j + dj;
            if (x < 0 || y < 0 || x >= m || y >= n || seen.has(x * n + y)) continue;
            if (heights[x][y] <= heights[i][j]) {
              seen.add(x * n + y);
              stack.push([x, y]);
            }
          }
        }
        if (pac && atl) {
          res.push([r, c]);
          t.step("both", `(${r}, ${c}) reaches both oceans.`, () => view(seen, r, c));
        }
      }
    t.step("ret", `${res.length} cells reach both oceans.`, () => view(new Set(), 0, 0));
    return res;
  },
});

function reverseSearch(heights: number[][], t: Parameters<typeof bruteForce.run>[1], bfs: boolean) {
  const m = heights.length,
    n = heights[0].length;
  const pac = heights.map((row) => row.map(() => false));
  const atl = heights.map((row) => row.map(() => false));
  const view = (cur?: [number, number]) => {
    const tn: Record<string, Tone> = {};
    for (let r = 0; r < m; r++)
      for (let c = 0; c < n; c++)
        if (pac[r][c] && atl[r][c]) tn[rc(r, c)] = "success";
        else if (pac[r][c]) tn[rc(r, c)] = "compare";
        else if (atl[r][c]) tn[rc(r, c)] = "visited";
    if (cur) tn[rc(...cur)] = "active";
    return [grid("heights (blue: Pacific, violet: Atlantic, green: both)", heights, { tones: tn })];
  };
  const climbable = (ocean: boolean[][], r: number, c: number) =>
    DIRS.map(([dr, dc]) => [r + dr, c + dc] as [number, number]).filter(
      ([x, y]) => x >= 0 && y >= 0 && x < m && y < n && !ocean[x][y] && heights[x][y] >= heights[r][c],
    );
  const dfs = (r: number, c: number, ocean: boolean[][], name: string) => {
    ocean[r][c] = true;
    t.step("climb", `${name} water reaches (${r}, ${c}).`, () => view([r, c]));
    for (const [x, y] of DIRS.map(([dr, dc]) => [r + dr, c + dc]))
      if (x >= 0 && y >= 0 && x < m && y < n && !ocean[x][y] && heights[x][y] >= heights[r][c]) dfs(x, y, ocean, name);
  };
  const run = (seeds: [number, number][], ocean: boolean[][], name: string, label: string) => {
    t.step(label, `Start from every ${name} border cell and climb to equal-or-higher neighbors.`, () => view());
    if (!bfs) {
      for (const [r, c] of seeds) if (!ocean[r][c]) dfs(r, c, ocean, name);
      return;
    }
    for (const [r, c] of seeds) ocean[r][c] = true;
    const queue = [...seeds];
    while (queue.length) {
      const [r, c] = queue.shift()!;
      t.step("climb", `${name} water reaches (${r}, ${c}).`, () => view([r, c]));
      for (const [x, y] of climbable(ocean, r, c)) {
        ocean[x][y] = true;
        queue.push([x, y]);
      }
    }
  };
  const cols = [...Array(n).keys()],
    rows = [...Array(m).keys()];
  run([...cols.map((c) => [0, c] as [number, number]), ...rows.map((r) => [r, 0] as [number, number])], pac, "Pacific", "seedP");
  run([...cols.map((c) => [m - 1, c] as [number, number]), ...rows.map((r) => [r, n - 1] as [number, number])], atl, "Atlantic", "seedA");
  const res: number[][] = [];
  for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) if (pac[r][c] && atl[r][c]) res.push([r, c]);
  t.step("ret", `Cells reachable from both oceans: ${res.length}.`, () => view());
  return res;
}

const reverseDfs = defineSolution<Input>({
  id: "reverse-dfs",
  name: "Reverse DFS from Each Ocean",
  time: "O(m·n)",
  space: "O(m·n)",
  idea: "Flip the direction: start at each ocean's border and climb to equal-or-higher neighbors. Cells marked by both searches are the answer.",
  code: code(`
    function pacificAtlantic(heights: number[][]): number[][] {
      const m = heights.length, n = heights[0].length;
      const pac = heights.map((row) => row.map(() => false));
      const atl = heights.map((row) => row.map(() => false));
      function dfs(r: number, c: number, ocean: boolean[][]) {
        ocean[r][c] = true; //@climb
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const x = r + dr, y = c + dc;
          if (x < 0 || y < 0 || x >= m || y >= n || ocean[x][y]) continue;
          if (heights[x][y] >= heights[r][c]) dfs(x, y, ocean);
        }
      }
      for (let c = 0; c < n; c++) if (!pac[0][c]) dfs(0, c, pac); //@seedP
      for (let r = 0; r < m; r++) if (!pac[r][0]) dfs(r, 0, pac);
      for (let c = 0; c < n; c++) if (!atl[m - 1][c]) dfs(m - 1, c, atl); //@seedA
      for (let r = 0; r < m; r++) if (!atl[r][n - 1]) dfs(r, n - 1, atl);
      const res: number[][] = [];
      for (let r = 0; r < m; r++)
        for (let c = 0; c < n; c++) if (pac[r][c] && atl[r][c]) res.push([r, c]);
      return res; //@ret
    }
  `),
  run: ({ heights }, t) => reverseSearch(heights, t, false),
});

const reverseBfs = defineSolution<Input>({
  id: "reverse-bfs",
  name: "Reverse BFS from Each Ocean",
  time: "O(m·n)",
  space: "O(m·n)",
  idea: "Same reverse idea with a queue: spread out from both oceans layer by layer.",
  code: code(`
    function pacificAtlantic(heights: number[][]): number[][] {
      const m = heights.length, n = heights[0].length;
      const bfs = (seeds: number[][]) => {
        const ocean = heights.map((row) => row.map(() => false));
        for (const [r, c] of seeds) ocean[r][c] = true;
        const queue = [...seeds];
        while (queue.length) {
          const [r, c] = queue.shift()!; //@climb
          for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const x = r + dr, y = c + dc;
            if (x < 0 || y < 0 || x >= m || y >= n || ocean[x][y]) continue;
            if (heights[x][y] >= heights[r][c]) { ocean[x][y] = true; queue.push([x, y]); }
          }
        }
        return ocean;
      };
      const cols = [...Array(n).keys()], rows = [...Array(m).keys()];
      const pac = bfs([...cols.map((c) => [0, c]), ...rows.map((r) => [r, 0])]); //@seedP
      const atl = bfs([...cols.map((c) => [m - 1, c]), ...rows.map((r) => [r, n - 1])]); //@seedA
      const res: number[][] = [];
      for (let r = 0; r < m; r++)
        for (let c = 0; c < n; c++) if (pac[r][c] && atl[r][c]) res.push([r, c]);
      return res; //@ret
    }
  `),
  run: ({ heights }, t) => reverseSearch(heights, t, true),
});

export default defineProblem<Input>({
  description:
    "Rain water flows to neighboring cells with equal or lower height. The Pacific touches the top and left edges and the Atlantic the bottom and right. Return every cell that can flow to both oceans.",
  input: {
    default: "heights = [[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]",
    parse: (a) => ({ heights: a.matrix<number>("heights") }),
  },
  examples: [
    {
      input: "heights = [[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]",
      output: [[0, 4], [1, 3], [1, 4], [2, 2], [3, 0], [3, 1], [4, 0]],
    },
    { input: "heights = [[1]]", output: [[0, 0]] },
  ],
  normalize: (v) => [...(v as number[][])].sort((a, b) => a[0] - b[0] || a[1] - b[1]),
  solutions: [bruteForce, reverseDfs, reverseBfs],
});

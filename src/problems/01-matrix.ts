import { arr, grid, rc, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  mat: number[][];
}

const show = (d: number[][]) => d.map((row) => row.map((v) => (v === Infinity ? "∞" : v)));

const bfs = defineSolution<Input>({
  id: "multi-source-bfs",
  name: "Multi-source BFS",
  time: "O(m·n)",
  space: "O(m·n)",
  idea: "Start a BFS from every 0 at once. The first time the wave reaches a cell, that distance is its shortest distance to a 0.",
  code: code(`
    function updateMatrix(mat: number[][]): number[][] {
      const rows = mat.length;
      const cols = mat[0].length;
      const queue: number[][] = [];
      const dist: number[][] = [];
      for (let row = 0; row < rows; row++) { //@seed
        dist.push([]);
        for (let col = 0; col < cols; col++) {
          if (mat[row][col] === 0) {
            dist[row].push(0);
            queue.push([row, col]);
          } else {
            dist[row].push(Infinity);
          }
        }
      }
      const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      while (queue.length > 0) {
        const [row, col] = queue.shift()!; //@pop
        for (const [rowStep, colStep] of directions) {
          const nextRow = row + rowStep;
          const nextCol = col + colStep;
          const insideGrid = nextRow >= 0 && nextRow < rows && nextCol >= 0 && nextCol < cols;
          if (insideGrid && dist[nextRow][nextCol] > dist[row][col] + 1) { //@check
            dist[nextRow][nextCol] = dist[row][col] + 1; //@set
            queue.push([nextRow, nextCol]);
          }
        }
      }
      return dist; //@ret
    }
  `),
  run({ mat }, t) {
    const m = mat.length,
      n = mat[0].length,
      queue: [number, number][] = [];
    const dist = mat.map((row, r) => row.map((v, c) => (v === 0 ? (queue.push([r, c]), 0) : Infinity)));
    const view = (h: number, cur?: [number, number], nb?: [number, number]) => {
      const tn: Record<string, Tone> = {};
      queue.forEach(([r, c], k) => (tn[rc(r, c)] = k < h ? "success" : "compare"));
      if (cur) tn[rc(...cur)] = "active";
      if (nb) tn[rc(...nb)] = "window";
      return [grid("dist", show(dist), { tones: tn }), arr("queue (pending)", queue.slice(h).map((q) => `(${q})`), { indexLabels: false })];
    };
    t.step("seed", `Every 0 is distance 0. Queue all ${queue.length} of them.`, () => view(0));
    for (let h = 0; h < queue.length; h++) {
      const [r, c] = queue[h];
      t.step("pop", `Expand (${r}, ${c}) at distance ${dist[r][c]}.`, () => view(h, [r, c]));
      for (const [x, y] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
        if (x < 0 || y < 0 || x >= m || y >= n || dist[x][y] <= dist[r][c] + 1) continue;
        dist[x][y] = dist[r][c] + 1;
        queue.push([x, y]);
        t.step("set", `(${x}, ${y}) is first reached here: distance ${dist[x][y]}.`, () => view(h, [r, c], [x, y]));
      }
    }
    t.step("ret", "Every cell has its distance.", () => view(queue.length));
    return dist;
  },
});

const twoPass = defineSolution<Input>({
  id: "two-pass-dp",
  name: "Two-pass DP",
  time: "O(m·n)",
  space: "O(1) extra",
  idea: "A shortest path to a 0 comes from some direction. One pass from the top-left handles paths coming from above/left; a second pass from the bottom-right handles below/right.",
  code: code(`
    function updateMatrix(mat: number[][]): number[][] {
      const rows = mat.length;
      const cols = mat[0].length;
      const farAway = rows + cols; // bigger than any real distance
      const dist = mat.map((row) => row.map((cell) => (cell === 0 ? 0 : farAway))); //@init

      // Pass 1: top-left to bottom-right, using the cells above and to the left.
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) { //@down
          if (dist[row][col] === 0) continue;
          if (row > 0) dist[row][col] = Math.min(dist[row][col], dist[row - 1][col] + 1);
          if (col > 0) dist[row][col] = Math.min(dist[row][col], dist[row][col - 1] + 1);
        }
      }

      // Pass 2: bottom-right to top-left, using the cells below and to the right.
      for (let row = rows - 1; row >= 0; row--) {
        for (let col = cols - 1; col >= 0; col--) { //@up
          if (dist[row][col] === 0) continue;
          if (row < rows - 1) dist[row][col] = Math.min(dist[row][col], dist[row + 1][col] + 1);
          if (col < cols - 1) dist[row][col] = Math.min(dist[row][col], dist[row][col + 1] + 1);
        }
      }
      return dist; //@ret
    }
  `),
  run({ mat }, t) {
    const m = mat.length,
      n = mat[0].length,
      INF = m + n;
    const d = mat.map((row) => row.map((v) => (v ? INF : 0)));
    const disp = () => d.map((row) => row.map((v) => (v >= INF ? "∞" : v)));
    const view = (r: number, c: number, from: [number, number][]) => [
      vars({ cell: `(${r}, ${c})` }),
      grid("dist", disp(), { tones: Object.fromEntries([...from.map(([a, b]) => [rc(a, b), "compare" as Tone]), [rc(r, c), "active" as Tone]]) }),
    ];
    t.step("init", "0s are 0, everything else starts at ∞.", () => [grid("dist", disp())]);
    for (let r = 0; r < m; r++)
      for (let c = 0; c < n; c++) {
        if (!d[r][c]) continue;
        d[r][c] = Math.min(d[r][c], (r ? d[r - 1][c] : INF) + 1, (c ? d[r][c - 1] : INF) + 1);
        const from: [number, number][] = [];
        if (r) from.push([r - 1, c]);
        if (c) from.push([r, c - 1]);
        t.step("down", `From above/left: (${r}, ${c}) = ${d[r][c] >= INF ? "∞" : d[r][c]}.`, () => view(r, c, from));
      }
    for (let r = m - 1; r >= 0; r--)
      for (let c = n - 1; c >= 0; c--) {
        if (!d[r][c]) continue;
        d[r][c] = Math.min(d[r][c], (r < m - 1 ? d[r + 1][c] : INF) + 1, (c < n - 1 ? d[r][c + 1] : INF) + 1);
        const from: [number, number][] = [];
        if (r < m - 1) from.push([r + 1, c]);
        if (c < n - 1) from.push([r, c + 1]);
        t.step("up", `From below/right: (${r}, ${c}) = ${d[r][c]}.`, () => view(r, c, from));
      }
    t.step("ret", "Both passes done.", () => [grid("dist", disp())]);
    return d;
  },
});

export default defineProblem<Input>({
  description: "Given an m × n binary matrix, return a matrix where each cell holds the distance to the nearest 0. Adjacent cells are distance 1 apart.",
  input: { default: "mat = [[0,1,1,1],[1,1,1,1],[1,1,0,1],[1,1,1,1]]", parse: (a) => ({ mat: a.matrix<number>("mat") }) },
  examples: [
    { input: "mat = [[0,0,0],[0,1,0],[0,0,0]]", output: [[0, 0, 0], [0, 1, 0], [0, 0, 0]] },
    { input: "mat = [[0,0,0],[0,1,0],[1,1,1]]", output: [[0, 0, 0], [0, 1, 0], [1, 2, 1]] },
  ],
  solutions: [twoPass, bfs],
});

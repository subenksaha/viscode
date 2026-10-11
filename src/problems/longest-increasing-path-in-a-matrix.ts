import { arr, grid, rc, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  matrix: number[][];
}

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

const memoDfs = defineSolution<Input>({
  id: "memo-dfs",
  name: "DFS + Memoization",
  time: "O(m·n)",
  space: "O(m·n)",
  idea: "len(r, c) = 1 + the best len of a strictly larger neighbor. Increasing paths can't loop, so each cell's answer is fixed; cache it and compute every cell once.",
  code: code(`
    function longestIncreasingPath(matrix: number[][]): number {
      const rows = matrix.length;
      const cols = matrix[0].length;
      // memo[row][col] = longest increasing path starting at that cell (0 = not computed yet)
      const memo = matrix.map((line) => line.map(() => 0));
      const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      function longestFrom(row: number, col: number): number {
        if (memo[row][col] !== 0) return memo[row][col]; //@hit
        let best = 1;
        for (const [rowStep, colStep] of directions) {
          const nextRow = row + rowStep;
          const nextCol = col + colStep;
          const inside = nextRow >= 0 && nextCol >= 0 && nextRow < rows && nextCol < cols;
          if (inside && matrix[nextRow][nextCol] > matrix[row][col]) { //@step
            best = Math.max(best, 1 + longestFrom(nextRow, nextCol));
          }
        }
        memo[row][col] = best; //@store
        return best;
      }
      let result = 0;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) { //@start
          result = Math.max(result, longestFrom(row, col));
        }
      }
      return result; //@ret
    }
  `),
  run({ matrix }, t) {
    const m = matrix.length,
      n = matrix[0].length;
    const memo = matrix.map((r) => r.map(() => 0));
    const stack: [number, number][] = [];
    let res = 0;
    const view = (cur?: [number, number], tone: Tone = "active") => {
      const tn: Record<string, Tone> = {};
      stack.forEach(([r, c]) => (tn[rc(r, c)] = "compare"));
      if (cur) tn[rc(...cur)] = tone;
      return [vars({ best: res }), grid("matrix", matrix, { tones: tn }), grid("memo (longest path starting here)", memo.map((row) => row.map((v) => v || "")), { tones: cur ? { [rc(...cur)]: tone } : {} })];
    };
    const len = (r: number, c: number): number => {
      if (memo[r][c]) {
        t.step("hit", `(${r}, ${c}) already known: ${memo[r][c]}.`, () => view([r, c], "success"));
        return memo[r][c];
      }
      stack.push([r, c]);
      let best = 1;
      for (const [dr, dc] of DIRS) {
        const x = r + dr,
          y = c + dc;
        if (x >= 0 && y >= 0 && x < m && y < n && matrix[x][y] > matrix[r][c]) {
          t.step("step", `${matrix[x][y]} > ${matrix[r][c]}: extend to (${x}, ${y}).`, () => view([x, y]));
          best = Math.max(best, 1 + len(x, y));
        }
      }
      stack.pop();
      memo[r][c] = best;
      t.step("store", `Longest path from (${r}, ${c}) has length ${best}.`, () => view([r, c], "success"));
      return best;
    };
    for (let r = 0; r < m; r++)
      for (let c = 0; c < n; c++) {
        if (!memo[r][c]) t.step("start", `Start from (${r}, ${c}).`, () => view([r, c]));
        res = Math.max(res, len(r, c));
      }
    t.step("ret", `Return ${res}.`, view());
    return res;
  },
});

const topo = defineSolution<Input>({
  id: "topological-bfs",
  name: "Topological Peeling (BFS)",
  time: "O(m·n)",
  space: "O(m·n)",
  idea: "Point an edge from each cell to every larger neighbor; the graph is a DAG. Repeatedly remove all cells with no smaller neighbors left (Kahn's algorithm). The number of layers peeled is the longest path.",
  code: code(`
    function longestIncreasingPath(matrix: number[][]): number {
      const rows = matrix.length;
      const cols = matrix[0].length;
      function neighbors(row: number, col: number): number[][] {
        const candidates = [[row + 1, col], [row - 1, col], [row, col + 1], [row, col - 1]];
        return candidates.filter(([r, c]) => r >= 0 && c >= 0 && r < rows && c < cols);
      }
      // smallerNeighbors[row][col] = how many neighbors are smaller than this cell
      const smallerNeighbors = matrix.map((line) => line.map(() => 0));
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          for (const [r, c] of neighbors(row, col)) { //@indeg
            if (matrix[r][c] < matrix[row][col]) smallerNeighbors[row][col]++;
          }
        }
      }
      // Start with cells that have no smaller neighbor: every path can begin there.
      let layer: number[][] = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (smallerNeighbors[row][col] === 0) layer.push([row, col]);
        }
      }
      let depth = 0;
      while (layer.length > 0) { //@layer
        depth++;
        const nextLayer: number[][] = [];
        for (const [row, col] of layer) {
          for (const [r, c] of neighbors(row, col)) { //@peel
            if (matrix[r][c] <= matrix[row][col]) continue;
            smallerNeighbors[r][c]--;
            if (smallerNeighbors[r][c] === 0) nextLayer.push([r, c]);
          }
        }
        layer = nextLayer;
      }
      return depth; //@ret
    }
  `),
  run({ matrix }, t) {
    const m = matrix.length,
      n = matrix[0].length;
    const indeg = matrix.map((r) => r.map(() => 0));
    const nbrs = (r: number, c: number) => [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]].filter(([x, y]) => x >= 0 && y >= 0 && x < m && y < n);
    for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) for (const [x, y] of nbrs(r, c)) if (matrix[x][y] < matrix[r][c]) indeg[r][c]++;
    const layerOf = matrix.map((r) => r.map(() => 0));
    let layer: number[][] = [];
    for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) if (!indeg[r][c]) layer.push([r, c]);
    let depth = 0;
    const view = () => {
      const tn: Record<string, Tone> = {};
      layerOf.forEach((row, r) => row.forEach((d, c) => d && (tn[rc(r, c)] = "visited")));
      layer.forEach(([r, c]) => (tn[rc(r, c)] = "active"));
      return [vars({ depth }), grid("matrix", matrix, { tones: tn }), grid("smaller neighbors left", indeg), arr("current layer", layer.map(([r, c]) => `(${r},${c})`), { indexLabels: false })];
    };
    t.step("indeg", "Count each cell's smaller neighbors. Cells with none are local minima.", view());
    while (layer.length) {
      depth++;
      layer.forEach(([r, c]) => (layerOf[r][c] = depth));
      t.step("layer", `Layer ${depth}: ${layer.length} cell${layer.length > 1 ? "s" : ""}.`, view());
      const next: number[][] = [];
      for (const [r, c] of layer) for (const [x, y] of nbrs(r, c)) if (matrix[x][y] > matrix[r][c] && --indeg[x][y] === 0) next.push([x, y]);
      layer = next;
      if (layer.length) t.step("peel", "Remove the layer; cells with no smaller neighbors left form the next one.", view());
    }
    t.step("ret", `${depth} layers: the longest path has ${depth} cells.`, view());
    return depth;
  },
});

export default defineProblem<Input>({
  description: "Given an m×n integer matrix, return the length of the longest strictly increasing path, moving up, down, left or right.",
  input: { default: "matrix = [[9,9,4],[6,6,8],[2,1,1]]", parse: (a) => ({ matrix: a.matrix<number>("matrix") }) },
  examples: [
    { input: "matrix = [[9,9,4],[6,6,8],[2,1,1]]", output: 4 },
    { input: "matrix = [[3,4,5],[3,2,6],[2,2,1]]", output: 4 },
    { input: "matrix = [[1]]", output: 1 },
  ],
  solutions: [memoDfs, topo],
});

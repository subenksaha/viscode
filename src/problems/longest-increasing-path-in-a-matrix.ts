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
      const m = matrix.length, n = matrix[0].length, memo = matrix.map((r) => r.map(() => 0));
      const len = (r: number, c: number): number => {
        if (memo[r][c]) return memo[r][c]; //@hit
        let best = 1;
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const x = r + dr, y = c + dc;
          if (x >= 0 && y >= 0 && x < m && y < n && matrix[x][y] > matrix[r][c]) best = Math.max(best, 1 + len(x, y)); //@step
        }
        return (memo[r][c] = best); //@store
      };
      let res = 0;
      for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) res = Math.max(res, len(r, c)); //@start
      return res; //@ret
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
      const m = matrix.length, n = matrix[0].length, indeg = matrix.map((r) => r.map(() => 0));
      const nbrs = (r: number, c: number) => [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]].filter(([x, y]) => x >= 0 && y >= 0 && x < m && y < n);
      for (let r = 0; r < m; r++) for (let c = 0; c < n; c++)
        for (const [x, y] of nbrs(r, c)) if (matrix[x][y] < matrix[r][c]) indeg[r][c]++; //@indeg
      let layer = [];
      for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) if (!indeg[r][c]) layer.push([r, c]);
      let depth = 0;
      while (layer.length) { //@layer
        depth++;
        const next = [];
        for (const [r, c] of layer)
          for (const [x, y] of nbrs(r, c)) if (matrix[x][y] > matrix[r][c] && --indeg[x][y] === 0) next.push([x, y]); //@peel
        layer = next;
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

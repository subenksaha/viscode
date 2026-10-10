import { arr, grid, rc } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  board: string[][];
}

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

const boardView = (board: string[][], cur?: [number, number], tone: Tone = "active", extra: ReturnType<typeof arr>[] = []) => {
  const tn: Record<string, Tone> = {};
  board.forEach((row, r) => row.forEach((v, c) => v === "S" && (tn[rc(r, c)] = "success")));
  if (cur) tn[rc(...cur)] = tone;
  return [grid("board (S = safe, reaches the border)", board, { tones: tn }), ...extra];
};

const borderDfs = defineSolution<Input>({
  id: "border-dfs",
  name: "Mark Border-connected Regions (DFS)",
  time: "O(m·n)",
  space: "O(m·n)",
  idea: "An 'O' survives exactly when it connects to the border. DFS from every border 'O' and mark it safe; then flip every unmarked 'O' to 'X' and restore the safe ones.",
  code: code(`
    function solve(board: string[][]): void {
      const m = board.length, n = board[0].length;
      const mark = (r: number, c: number) => {
        if (r < 0 || c < 0 || r >= m || c >= n || board[r][c] !== "O") return;
        board[r][c] = "S"; //@mark
        mark(r + 1, c); mark(r - 1, c); mark(r, c + 1); mark(r, c - 1);
      };
      for (let r = 0; r < m; r++) for (let c = 0; c < n; c++)
        if (r === 0 || c === 0 || r === m - 1 || c === n - 1) mark(r, c); //@border
      for (let r = 0; r < m; r++) for (let c = 0; c < n; c++)
        board[r][c] = board[r][c] === "S" ? "O" : "X"; //@flip
    }
  `),
  run({ board }, t) {
    const m = board.length,
      n = board[0].length;
    const mark = (r: number, c: number) => {
      if (r < 0 || c < 0 || r >= m || c >= n || board[r][c] !== "O") return;
      board[r][c] = "S";
      t.step("mark", `(${r}, ${c}) touches the border region: safe.`, () => boardView(board, [r, c], "success"));
      for (const [dr, dc] of DIRS) mark(r + dr, c + dc);
    };
    for (let r = 0; r < m; r++)
      for (let c = 0; c < n; c++)
        if (r === 0 || c === 0 || r === m - 1 || c === n - 1) {
          if (board[r][c] === "O") t.step("border", `Border 'O' at (${r}, ${c}). Mark its region.`, () => boardView(board, [r, c]));
          mark(r, c);
        }
    for (let r = 0; r < m; r++)
      for (let c = 0; c < n; c++) {
        const was = board[r][c];
        board[r][c] = was === "S" ? "O" : "X";
        if (was !== "X") t.step("flip", was === "S" ? `(${r}, ${c}) is safe: restore 'O'.` : `(${r}, ${c}) is surrounded: capture it.`, () => boardView(board, [r, c], was === "S" ? "success" : "danger"));
      }
    return board;
  },
});

const borderBfs = defineSolution<Input>({
  id: "border-bfs",
  name: "Mark Border-connected Regions (BFS)",
  time: "O(m·n)",
  space: "O(m·n)",
  idea: "Same idea with one multi-source BFS: seed the queue with every border 'O', spread through 'O' neighbors, then flip what was never reached.",
  code: code(`
    function solve(board: string[][]): void {
      const m = board.length, n = board[0].length, queue: number[][] = [];
      for (let r = 0; r < m; r++) for (let c = 0; c < n; c++)
        if ((r === 0 || c === 0 || r === m - 1 || c === n - 1) && board[r][c] === "O") { board[r][c] = "S"; queue.push([r, c]); } //@seed
      while (queue.length) {
        const [r, c] = queue.shift()!; //@pop
        for (const [x, y] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]])
          if (x >= 0 && y >= 0 && x < m && y < n && board[x][y] === "O") { board[x][y] = "S"; queue.push([x, y]); } //@spread
      }
      for (let r = 0; r < m; r++) for (let c = 0; c < n; c++)
        board[r][c] = board[r][c] === "S" ? "O" : "X"; //@flip
    }
  `),
  run({ board }, t) {
    const m = board.length,
      n = board[0].length;
    const queue: [number, number][] = [];
    const qv = () => [arr("queue", queue.map((q) => `(${q})`), { indexLabels: false })];
    for (let r = 0; r < m; r++)
      for (let c = 0; c < n; c++)
        if ((r === 0 || c === 0 || r === m - 1 || c === n - 1) && board[r][c] === "O") {
          board[r][c] = "S";
          queue.push([r, c]);
        }
    t.step("seed", `Seed the queue with ${queue.length} border 'O' cells.`, () => boardView(board, undefined, "active", qv()));
    while (queue.length) {
      const [r, c] = queue.shift()!;
      t.step("pop", `Spread from (${r}, ${c}).`, () => boardView(board, [r, c], "active", qv()));
      for (const [x, y] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]])
        if (x >= 0 && y >= 0 && x < m && y < n && board[x][y] === "O") {
          board[x][y] = "S";
          queue.push([x, y]);
          t.step("spread", `(${x}, ${y}) is reachable from the border: safe.`, () => boardView(board, [x, y], "success", qv()));
        }
    }
    for (let r = 0; r < m; r++)
      for (let c = 0; c < n; c++) {
        const was = board[r][c];
        board[r][c] = was === "S" ? "O" : "X";
        if (was !== "X") t.step("flip", was === "S" ? `(${r}, ${c}) stays 'O'.` : `(${r}, ${c}) is surrounded: capture it.`, () => boardView(board, [r, c], was === "S" ? "success" : "danger"));
      }
    return board;
  },
});

export default defineProblem<Input>({
  description: "Given an m×n board of 'X' and 'O', capture every region of 'O' that is fully surrounded by 'X' (not connected to the border) by flipping it to 'X'. Modify the board in place.",
  input: {
    default: 'board = [["X","X","X","X"],["X","O","O","X"],["X","X","O","X"],["X","O","X","X"]]',
    parse: (a) => ({ board: a.matrix<string>("board") }),
  },
  examples: [
    {
      input: 'board = [["X","X","X","X"],["X","O","O","X"],["X","X","O","X"],["X","O","X","X"]]',
      output: [["X", "X", "X", "X"], ["X", "X", "X", "X"], ["X", "X", "X", "X"], ["X", "O", "X", "X"]],
    },
    { input: 'board = [["X"]]', output: [["X"]] },
    {
      input: 'board = [["O","O","O"],["O","X","O"],["O","O","O"]]',
      output: [["O", "O", "O"], ["O", "X", "O"], ["O", "O", "O"]],
    },
  ],
  solutions: [borderDfs, borderBfs],
});

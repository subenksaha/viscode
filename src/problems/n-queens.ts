import { arr, grid, rc, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  n: number;
}

const render = (queens: number[], n: number) =>
  Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => (queens[r] === c ? "Q" : ".")).join(""));

function boardView(queens: number[], n: number, try_?: [number, number], tone: Tone = "active", count?: number) {
  const cells = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => (queens[r] === c ? "Q" : "")));
  const tn: Record<string, Tone> = {};
  queens.forEach((c, r) => (tn[rc(r, c)] = "success"));
  if (try_) {
    // Shade the cells the tried square attacks so conflicts are visible.
    const [r, c] = try_;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) if (!tn[rc(i, j)] && (i === r || j === c || i - j === r - c || i + j === r + c)) tn[rc(i, j)] = "window";
    tn[rc(r, c)] = tone;
  }
  return [vars({ solutions: count }), grid("board", cells, { tones: tn })];
}

const scanCheck = defineSolution<Input>({
  id: "scan-check",
  name: "Backtracking, Check by Scanning",
  time: "O(n! · n)",
  space: "O(n)",
  idea: "Place one queen per row. Before placing at (r, c), scan the queens already placed for a shared column or diagonal.",
  approach: [
    {
      title: "One queen per row",
      detail: "Rows never conflict this way, so only columns and diagonals need checking.",
      at: "place",
    },
    {
      title: "Attacked?",
      detail: "Scan the placed queens for the same column or |Δcol| = Δrow, which means a shared diagonal.",
      at: "attacked",
    },
    {
      title: "Recurse and lift",
      detail: "After exploring with a queen at (r, c), remove it and try the next column.",
      at: "remove",
    },
    {
      title: "Solution",
      detail: "Placing all n rows gives a board.",
      at: "solved",
    },
  ],
  code: code(`
    function solveNQueens(n: number): string[][] {
      const solutions: string[][] = [];
      const queenCols: number[] = []; // queenCols[row] = column of the queen in that row
      function isSafe(row: number, col: number): boolean {
        for (let otherRow = 0; otherRow < queenCols.length; otherRow++) {
          const otherCol = queenCols[otherRow];
          if (otherCol === col) return false; // same column
          if (Math.abs(otherCol - col) === row - otherRow) return false; // same diagonal
        }
        return true;
      }
      function drawBoard(): string[] {
        return queenCols.map((col) => ".".repeat(col) + "Q" + ".".repeat(n - col - 1));
      }
      function placeRow(row: number) {
        if (row === n) { //@solved
          solutions.push(drawBoard());
          return;
        }
        for (let col = 0; col < n; col++) {
          if (!isSafe(row, col)) continue; //@attacked
          queenCols.push(col); //@place
          placeRow(row + 1);
          queenCols.pop(); //@remove
        }
      }
      placeRow(0);
      return solutions; //@ret
    }
  `),
  run({ n }, t) {
    const res: string[][] = [],
      queens: number[] = [];
    const safe = (r: number, c: number) => queens.every((qc, qr) => qc !== c && Math.abs(qc - c) !== r - qr);
    const place = (r: number) => {
      if (r === n) {
        res.push(render(queens, n));
        t.step("solved", `All ${n} queens placed. Solution #${res.length}.`, () => boardView(queens, n, undefined, "active", res.length));
        return;
      }
      for (let c = 0; c < n; c++) {
        if (!safe(r, c)) {
          t.step("attacked", `(${r}, ${c}) is attacked.`, () => boardView(queens, n, [r, c], "danger", res.length));
          continue;
        }
        queens.push(c);
        t.step("place", `Place a queen at (${r}, ${c}).`, () => boardView(queens, n, [r, c], "success", res.length));
        place(r + 1);
        queens.pop();
        t.step("remove", `Remove the queen from (${r}, ${c}).`, () => boardView(queens, n, undefined, "active", res.length));
      }
    };
    place(0);
    t.step("ret", `${res.length} solutions.`, [arr("solutions", res.map((b) => b.join(" / ")), { indexLabels: false })]);
    return res;
  },
});

const sets = defineSolution<Input>({
  id: "sets",
  name: "Backtracking with Column/Diagonal Sets",
  time: "O(n!)",
  space: "O(n)",
  idea: "Every cell on a '\\' diagonal shares r − c, and every cell on a '/' diagonal shares r + c. Keep three sets so the attack check is O(1).",
  approach: [
    {
      title: "O(1) attack checks",
      detail: "Cells on a '\\' diagonal share r − c, and cells on a '/' diagonal share r + c. Keep sets for columns and both kinds of diagonal.",
      at: "attacked",
    },
    {
      title: "Place and mark",
      detail: "Add the column and both diagonals to their sets.",
      at: "place",
    },
    {
      title: "Unmark on backtrack",
      detail: "Remove them so other branches start clean.",
      at: "remove",
    },
    {
      title: "Solution",
      detail: "Same search tree with cheaper checks.",
      at: "solved",
    },
  ],
  code: code(`
    function solveNQueens(n: number): string[][] {
      const solutions: string[][] = [];
      const queenCols: number[] = []; // queenCols[row] = column of the queen in that row
      // Cells on one down-right diagonal share row - col; on one down-left diagonal they share row + col.
      const usedCols = new Set<number>();
      const usedDiagonals = new Set<number>();
      const usedAntiDiagonals = new Set<number>();
      function drawBoard(): string[] {
        return queenCols.map((col) => ".".repeat(col) + "Q" + ".".repeat(n - col - 1));
      }
      function placeRow(row: number) {
        if (row === n) { //@solved
          solutions.push(drawBoard());
          return;
        }
        for (let col = 0; col < n; col++) {
          const attacked = usedCols.has(col) || usedDiagonals.has(row - col) || usedAntiDiagonals.has(row + col);
          if (attacked) continue; //@attacked
          queenCols.push(col); //@place
          usedCols.add(col);
          usedDiagonals.add(row - col);
          usedAntiDiagonals.add(row + col);
          placeRow(row + 1);
          queenCols.pop(); //@remove
          usedCols.delete(col);
          usedDiagonals.delete(row - col);
          usedAntiDiagonals.delete(row + col);
        }
      }
      placeRow(0);
      return solutions; //@ret
    }
  `),
  run({ n }, t) {
    const res: string[][] = [],
      queens: number[] = [];
    const cols = new Set<number>(),
      diag = new Set<number>(),
      anti = new Set<number>();
    const view = (rcPos?: [number, number], tone: Tone = "active") => [
      ...boardView(queens, n, rcPos, tone, res.length),
      vars({ usedCols: `{${[...cols]}}`, "usedDiagonals (row − col)": `{${[...diag]}}`, "usedAntiDiagonals (row + col)": `{${[...anti]}}` }, "used"),
    ];
    const place = (r: number) => {
      if (r === n) {
        res.push(render(queens, n));
        t.step("solved", `Solution #${res.length}.`, () => view());
        return;
      }
      for (let c = 0; c < n; c++) {
        if (cols.has(c) || diag.has(r - c) || anti.has(r + c)) {
          const why = cols.has(c) ? `column ${c}` : diag.has(r - c) ? `diagonal r−c = ${r - c}` : `anti-diagonal r+c = ${r + c}`;
          t.step("attacked", `(${r}, ${c}): ${why} is taken.`, () => view([r, c], "danger"));
          continue;
        }
        queens.push(c);
        cols.add(c);
        diag.add(r - c);
        anti.add(r + c);
        t.step("place", `Place at (${r}, ${c}).`, () => view([r, c], "success"));
        place(r + 1);
        queens.pop();
        cols.delete(c);
        diag.delete(r - c);
        anti.delete(r + c);
        t.step("remove", `Lift the queen at (${r}, ${c}).`, () => view());
      }
    };
    place(0);
    t.step("ret", `${res.length} solutions.`, [arr("solutions", res.map((b) => b.join(" / ")), { indexLabels: false })]);
    return res;
  },
});

export default defineProblem<Input>({
  description: "Place n queens on an n×n chessboard so that no two attack each other (same row, column or diagonal). Return every distinct board, with 'Q' for a queen and '.' for an empty square.",
  input: { default: "n = 4", parse: (a) => ({ n: a.int("n") }) },
  examples: [
    { input: "n = 4", output: [[".Q..", "...Q", "Q...", "..Q."], ["..Q.", "Q...", "...Q", ".Q.."]] },
    { input: "n = 1", output: [["Q"]] },
  ],
  normalize: (v) => (v as string[][]).map((b) => b.join("/")).sort(),
  solutions: [scanCheck, sets],
});

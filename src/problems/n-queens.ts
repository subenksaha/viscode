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
  code: code(`
    function solveNQueens(n: number): string[][] {
      const res: string[][] = [], queens: number[] = []; // queens[r] = column
      const safe = (r: number, c: number) => queens.every((qc, qr) => qc !== c && Math.abs(qc - c) !== r - qr);
      function place(r: number) {
        if (r === n) { res.push(queens.map((c) => ".".repeat(c) + "Q" + ".".repeat(n - c - 1))); return; } //@solved
        for (let c = 0; c < n; c++) {
          if (!safe(r, c)) continue; //@attacked
          queens.push(c); //@place
          place(r + 1);
          queens.pop(); //@remove
        }
      }
      place(0);
      return res; //@ret
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
  code: code(`
    function solveNQueens(n: number): string[][] {
      const res: string[][] = [], queens: number[] = [];
      const cols = new Set<number>(), diag = new Set<number>(), anti = new Set<number>();
      function place(r: number) {
        if (r === n) { res.push(queens.map((c) => ".".repeat(c) + "Q" + ".".repeat(n - c - 1))); return; } //@solved
        for (let c = 0; c < n; c++) {
          if (cols.has(c) || diag.has(r - c) || anti.has(r + c)) continue; //@attacked
          queens.push(c); cols.add(c); diag.add(r - c); anti.add(r + c); //@place
          place(r + 1);
          queens.pop(); cols.delete(c); diag.delete(r - c); anti.delete(r + c); //@remove
        }
      }
      place(0);
      return res; //@ret
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
      vars({ cols: `{${[...cols]}}`, "r−c": `{${[...diag]}}`, "r+c": `{${[...anti]}}` }, "used"),
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

import { grid, map, rc, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  board: string[][];
}

const box = (r: number, c: number) => Math.floor(r / 3) * 3 + Math.floor(c / 3);

const threePasses = defineSolution<Input>({
  id: "three-passes",
  name: "Check Rows, Columns, Boxes Separately",
  time: "O(81)",
  space: "O(9)",
  idea: "Run three passes over the board: one per row, one per column and one per 3×3 box. Each unit uses a fresh set; a repeated digit makes the board invalid.",
  code: code(`
    function isValidSudoku(board: string[][]): boolean {
      const cell = [
        (u: number, k: number) => board[u][k],                  // rows
        (u: number, k: number) => board[k][u],                  // columns
        (u: number, k: number) => board[3 * Math.floor(u / 3) + Math.floor(k / 3)][3 * (u % 3) + (k % 3)], // boxes
      ];
      for (const get of cell)
        for (let u = 0; u < 9; u++) { //@unit
          const seen = new Set<string>();
          for (let k = 0; k < 9; k++) { //@cell
            const d = get(u, k);
            if (d === ".") continue;
            if (seen.has(d)) return false; //@dup
            seen.add(d);
          }
        }
      return true; //@ret
    }
  `),
  run({ board }, t) {
    const kinds = ["row", "column", "box"] as const;
    const pos = [
      (u: number, k: number) => [u, k],
      (u: number, k: number) => [k, u],
      (u: number, k: number) => [3 * Math.floor(u / 3) + Math.floor(k / 3), 3 * (u % 3) + (k % 3)],
    ];
    for (let p = 0; p < 3; p++)
      for (let u = 0; u < 9; u++) {
        const seen = new Set<string>();
        const unit = Array.from({ length: 9 }, (_, k) => pos[p](u, k));
        const view = (cur?: number[], tone: Tone = "active") => {
          const tn: Record<string, Tone> = {};
          unit.forEach(([r, c]) => (tn[rc(r, c)] = "window"));
          if (cur) tn[rc(cur[0], cur[1])] = tone;
          return [vars({ checking: `${kinds[p]} ${u}` }), grid("board", board, { tones: tn }), map("seen", seen)];
        };
        t.step("unit", `Check ${kinds[p]} ${u}.`, view);
        for (let k = 0; k < 9; k++) {
          const [r, c] = unit[k];
          const d = board[r][c];
          if (d === ".") continue;
          if (seen.has(d)) {
            t.step("dup", `${d} appears twice in ${kinds[p]} ${u}. Invalid.`, () => view([r, c], "danger"));
            return false;
          }
          seen.add(d);
        }
      }
    t.step("ret", "No unit has a repeated digit. Valid.");
    return true;
  },
});

const onePass = defineSolution<Input>({
  id: "one-pass",
  name: "One Pass with 27 Sets",
  time: "O(81)",
  space: "O(81)",
  idea: "Visit each filled cell once and check three sets at the same time: its row, its column and its box (index ⌊r/3⌋·3 + ⌊c/3⌋).",
  code: code(`
    function isValidSudoku(board: string[][]): boolean {
      const rows = Array.from({ length: 9 }, () => new Set<string>());
      const cols = Array.from({ length: 9 }, () => new Set<string>());
      const boxes = Array.from({ length: 9 }, () => new Set<string>()); //@init
      for (let r = 0; r < 9; r++)
        for (let c = 0; c < 9; c++) {
          const d = board[r][c];
          if (d === ".") continue;
          const b = Math.floor(r / 3) * 3 + Math.floor(c / 3); //@cell
          if (rows[r].has(d) || cols[c].has(d) || boxes[b].has(d)) return false; //@dup
          rows[r].add(d); cols[c].add(d); boxes[b].add(d); //@add
        }
      return true; //@ret
    }
  `),
  run({ board }, t) {
    const rows = Array.from({ length: 9 }, () => new Set<string>());
    const cols = Array.from({ length: 9 }, () => new Set<string>());
    const boxes = Array.from({ length: 9 }, () => new Set<string>());
    const view = (r: number, c: number, tone: Tone = "active") => {
      const b = box(r, c);
      const tn: Record<string, Tone> = {};
      for (let i = 0; i < 9; i++)
        for (let j = 0; j < 9; j++) if (i === r || j === c || box(i, j) === b) tn[rc(i, j)] = "window";
      tn[rc(r, c)] = tone;
      return [
        vars({ digit: board[r][c], box: b }),
        grid("board", board, { tones: tn }),
        map(`rows[${r}] · cols[${c}] · boxes[${b}]`, [
          ["row", `{${[...rows[r]].sort()}}`],
          ["col", `{${[...cols[c]].sort()}}`],
          ["box", `{${[...boxes[b]].sort()}}`],
        ]),
      ];
    };
    t.step("init", "27 empty sets: 9 rows, 9 columns, 9 boxes.", [grid("board", board)]);
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++) {
        const d = board[r][c];
        if (d === ".") continue;
        const b = box(r, c);
        t.step("cell", `${d} at (${r}, ${c}), box ${b}.`, () => view(r, c));
        if (rows[r].has(d) || cols[c].has(d) || boxes[b].has(d)) {
          const where = rows[r].has(d) ? "row" : cols[c].has(d) ? "column" : "box";
          t.step("dup", `${d} is already in this ${where}. Invalid.`, () => view(r, c, "danger"));
          return false;
        }
        rows[r].add(d);
        cols[c].add(d);
        boxes[b].add(d);
        t.step("add", `Record ${d} in row ${r}, column ${c} and box ${b}.`, () => view(r, c, "success"));
      }
    t.step("ret", "Every filled cell checked. Valid.");
    return true;
  },
});

const VALID =
  '[["5","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]]';
const INVALID =
  '[["8","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]]';

export default defineProblem<Input>({
  description: "Determine whether a partially filled 9×9 Sudoku board is valid: no digit 1–9 may repeat within a row, a column or a 3×3 box. Empty cells are '.'. The board need not be solvable.",
  input: { default: `board = ${INVALID}`, parse: (a) => ({ board: a.matrix<string>("board") }) },
  examples: [
    { input: `board = ${VALID}`, output: true },
    { input: `board = ${INVALID}`, output: false },
  ],
  solutions: [threePasses, onePass],
});

import { grid, map, rc, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  matrix: number[][];
}

const copy = defineSolution<Input>({
  id: "copy",
  name: "Copy the Matrix",
  time: "O(m·n·(m+n))",
  space: "O(m·n)",
  idea: "Scan a frozen copy so new zeros do not spread. For every original zero, clear its row and column in the real matrix.",
  approach: [
    {
      title: "Freeze a copy",
      detail: "Zeros written during the scan must not trigger more zeroing, so read from a snapshot.",
      at: "copy",
    },
    {
      title: "Find an original zero",
      detail: "Scan the snapshot cell by cell.",
      at: "zero",
    },
    {
      title: "Clear its row and column",
      detail: "Write zeros across the real matrix. Clearing a full row and column per zero makes this O(m·n·(m+n)).",
      at: "clear",
    },
  ],
  code: code(`
    function setZeroes(matrix: number[][]): void {
      const rows = matrix.length;
      const cols = matrix[0].length;
      // Look at a copy so the zeros we write don't trigger more zeros.
      const original = matrix.map((line) => [...line]); //@copy
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) { //@scan
          if (original[row][col] === 0) { //@zero
            for (let c = 0; c < cols; c++) matrix[row][c] = 0;
            for (let r = 0; r < rows; r++) matrix[r][col] = 0; //@clear
          }
        }
      }
    }
  `),
  run({ matrix }, t) {
    const orig = matrix.map((row) => [...row]);
    const m = matrix.length,
      n = matrix[0].length;
    t.step("copy", "Freeze a copy of the input.", [grid("matrix", matrix)]);
    for (let r = 0; r < m; r++)
      for (let c = 0; c < n; c++) {
        if (orig[r][c] !== 0) {
          t.step("scan", `orig[${r}][${c}] = ${orig[r][c]}.`, () => [grid("matrix", matrix, { tones: tones([rc(r, c), "active"]) })]);
          continue;
        }
        t.step("zero", `orig[${r}][${c}] is 0.`, () => [grid("matrix", matrix, { tones: tones([rc(r, c), "danger"]) })]);
        for (let k = 0; k < n; k++) matrix[r][k] = 0;
        for (let k = 0; k < m; k++) matrix[k][c] = 0;
        const tn: Record<string, Tone> = {};
        for (let k = 0; k < n; k++) tn[rc(r, k)] = "danger";
        for (let k = 0; k < m; k++) tn[rc(k, c)] = "danger";
        t.step("clear", `Clear row ${r} and column ${c}.`, () => [grid("matrix", matrix, { tones: tn })]);
      }
    return matrix;
  },
});

const sets = defineSolution<Input>({
  id: "row-col-sets",
  name: "Row & Column Sets",
  time: "O(m·n)",
  space: "O(m + n)",
  idea: "First pass: record which rows and columns contain a zero. Second pass: zero every cell whose row or column was recorded.",
  approach: [
    {
      title: "Record zero rows and columns",
      detail: "The first pass only notes which rows and columns contain a zero.",
      at: "mark",
    },
    {
      title: "Apply",
      detail: "The second pass zeroes every cell in a marked row or column. O(m·n) time, O(m + n) space.",
      at: "apply",
    },
    {
      title: "Why two passes",
      detail: "Separating \"find\" from \"write\" stops new zeros from spreading further.",
      at: "apply",
      nth: -1,
    },
  ],
  code: code(`
    function setZeroes(matrix: number[][]): void {
      const zeroRows = new Set<number>();
      const zeroCols = new Set<number>();
      for (let row = 0; row < matrix.length; row++) {
        for (let col = 0; col < matrix[0].length; col++) { //@scan
          if (matrix[row][col] === 0) { //@mark
            zeroRows.add(row);
            zeroCols.add(col);
          }
        }
      }
      for (let row = 0; row < matrix.length; row++) {
        for (let col = 0; col < matrix[0].length; col++) {
          if (zeroRows.has(row) || zeroCols.has(col)) matrix[row][col] = 0; //@apply
        }
      }
    }
  `),
  run({ matrix }, t) {
    const rows = new Set<number>(),
      cols = new Set<number>();
    const m = matrix.length,
      n = matrix[0].length;
    const view = (r: number, c: number, tone: Tone = "active") => [grid("matrix", matrix, { tones: tones([rc(r, c), tone]) }), map("zero rows", rows), map("zero cols", cols)];
    for (let r = 0; r < m; r++)
      for (let c = 0; c < n; c++) {
        if (matrix[r][c] === 0) {
          rows.add(r);
          cols.add(c);
          t.step("mark", `Zero at (${r}, ${c}): mark row ${r} and column ${c}.`, () => view(r, c, "danger"));
        } else t.step("scan", `(${r}, ${c}) = ${matrix[r][c]}.`, () => view(r, c));
      }
    for (let r = 0; r < m; r++)
      for (let c = 0; c < n; c++)
        if (rows.has(r) || cols.has(c)) {
          matrix[r][c] = 0;
          t.step("apply", `Row ${r} or column ${c} is marked: set (${r}, ${c}) to 0.`, () => view(r, c, "danger"));
        }
    return matrix;
  },
});

const inPlace = defineSolution<Input>({
  id: "first-row-col-markers",
  name: "First Row & Column as Markers",
  time: "O(m·n)",
  space: "O(1)",
  idea: "Use row 0 and column 0 as the marker sets. Remember separately whether row 0 and column 0 themselves contained a zero, and clear them last.",
  approach: [
    {
      title: "Save the flags for row 0 and column 0",
      detail: "Row 0 and column 0 will hold the markers, so first remember whether they contained zeros themselves.",
      at: "flags",
    },
    {
      title: "Mark in the first row and column",
      detail: "For each inner zero, set matrix[r][0] and matrix[0][c] to 0. Then zero any inner cell whose row or column marker is 0.",
      at: "apply",
    },
    {
      title: "Clear row 0 last",
      detail: "Only now is it safe to overwrite the markers.",
      at: "row0",
    },
    {
      title: "Clear column 0 last",
      detail: "The flags decide whether to clear column 0 too. O(1) extra space.",
      at: "col0",
    },
  ],
  code: code(`
    function setZeroes(matrix: number[][]): void {
      const rows = matrix.length;
      const cols = matrix[0].length;
      // Use the first row and first column as markers. Remember first whether they had zeros themselves.
      const firstRowHasZero = matrix[0].includes(0); //@flags
      const firstColHasZero = matrix.some((line) => line[0] === 0);
      for (let row = 1; row < rows; row++) {
        for (let col = 1; col < cols; col++) {
          if (matrix[row][col] === 0) { //@mark
            matrix[row][0] = 0; // mark this row
            matrix[0][col] = 0; // mark this column
          }
        }
      }
      for (let row = 1; row < rows; row++) {
        for (let col = 1; col < cols; col++) {
          if (matrix[row][0] === 0 || matrix[0][col] === 0) matrix[row][col] = 0; //@apply
        }
      }
      if (firstRowHasZero) { //@row0
        for (let col = 0; col < cols; col++) matrix[0][col] = 0;
      }
      if (firstColHasZero) { //@col0
        for (let row = 0; row < rows; row++) matrix[row][0] = 0;
      }
    }
  `),
  run({ matrix }, t) {
    const m = matrix.length,
      n = matrix[0].length;
    const row0 = matrix[0].includes(0),
      col0 = matrix.some((row) => row[0] === 0);
    const markerTones = () => {
      const tn: Record<string, Tone> = {};
      for (let c = 0; c < n; c++) tn[rc(0, c)] = "visited";
      for (let r = 0; r < m; r++) tn[rc(r, 0)] = "visited";
      return tn;
    };
    const view = (cells: [number, number][] = [], tone: Tone = "active") => [
      vars({ firstRowHasZero: row0, firstColHasZero: col0 }),
      grid("matrix (violet: marker row/column)", matrix, { tones: { ...markerTones(), ...tones(...cells.map(([r, c]) => [rc(r, c), tone] as [string, Tone])) } }),
    ];
    t.step("flags", `Does row 0 have a zero? ${row0}. Does column 0? ${col0}.`, view());
    for (let r = 1; r < m; r++)
      for (let c = 1; c < n; c++)
        if (matrix[r][c] === 0) {
          matrix[r][0] = matrix[0][c] = 0;
          t.step("mark", `Zero at (${r}, ${c}): mark matrix[${r}][0] and matrix[0][${c}].`, () => view([[r, c], [r, 0], [0, c]], "danger"));
        }
    for (let r = 1; r < m; r++)
      for (let c = 1; c < n; c++)
        if (matrix[r][0] === 0 || matrix[0][c] === 0) {
          matrix[r][c] = 0;
          t.step("apply", `A marker says (${r}, ${c}) must be 0.`, () => view([[r, c]], "danger"));
        }
    if (row0) {
      for (let c = 0; c < n; c++) matrix[0][c] = 0;
      t.step("row0", "Row 0 had a zero: clear it.", view());
    }
    if (col0) {
      for (let r = 0; r < m; r++) matrix[r][0] = 0;
      t.step("col0", "Column 0 had a zero: clear it.", view());
    }
    if (!row0 && !col0) t.step("col0", "Done.", view());
    return matrix;
  },
});

export default defineProblem<Input>({
  description: "If an element of an m × n matrix is 0, set its entire row and column to 0. Do it in place.",
  input: { default: "matrix = [[0,1,2,0],[3,4,5,2],[1,3,1,5]]", parse: (a) => ({ matrix: a.matrix<number>("matrix") }) },
  examples: [
    { input: "matrix = [[1,1,1],[1,0,1],[1,1,1]]", output: [[1, 0, 1], [0, 0, 0], [1, 0, 1]] },
    { input: "matrix = [[0,1,2,0],[3,4,5,2],[1,3,1,5]]", output: [[0, 0, 0, 0], [0, 4, 5, 0], [0, 3, 1, 0]] },
  ],
  solutions: [copy, sets, inPlace],
});

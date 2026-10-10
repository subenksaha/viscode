import { grid, rc, tones } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  matrix: number[][];
}

const extra = defineSolution<Input>({
  id: "extra-matrix",
  name: "Extra Matrix",
  time: "O(n²)",
  space: "O(n²)",
  idea: "Element (r, c) moves to (c, n−1−r). Fill a new matrix, then copy it back.",
  code: code(`
    function rotate(matrix: number[][]): void {
      const n = matrix.length;
      const out = matrix.map((row) => row.map(() => 0)); //@init
      for (let r = 0; r < n; r++)
        for (let c = 0; c < n; c++) out[c][n - 1 - r] = matrix[r][c]; //@place
      for (let r = 0; r < n; r++) matrix[r] = out[r]; //@copy
    }
  `),
  run({ matrix }, t) {
    const n = matrix.length;
    const out: (number | null)[][] = matrix.map((row) => row.map(() => null));
    t.step("init", "Make an empty n × n matrix.", [grid("matrix", matrix), grid("rotated", out)]);
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++) {
        out[c][n - 1 - r] = matrix[r][c];
        t.step("place", `(${r}, ${c}) → (${c}, ${n - 1 - r}).`, () => [
          grid("matrix", matrix, { tones: tones([rc(r, c), "active"]) }),
          grid("rotated", out, { tones: tones([rc(c, n - 1 - r), "success"]) }),
        ]);
      }
    for (let r = 0; r < n; r++) matrix[r] = out[r] as number[];
    t.step("copy", "Copy the result back.", [grid("matrix", matrix)]);
    return matrix;
  },
});

const transposeReverse = defineSolution<Input>({
  id: "transpose-reverse",
  name: "Transpose + Reverse Rows",
  time: "O(n²)",
  space: "O(1)",
  idea: "A clockwise rotation equals a transpose (swap across the main diagonal) followed by reversing every row.",
  code: code(`
    function rotate(matrix: number[][]): void {
      const n = matrix.length;
      for (let r = 0; r < n; r++)
        for (let c = r + 1; c < n; c++) //@transpose
          [matrix[r][c], matrix[c][r]] = [matrix[c][r], matrix[r][c]];
      for (const row of matrix) row.reverse(); //@reverse
    }
  `),
  run({ matrix }, t) {
    const n = matrix.length;
    for (let r = 0; r < n; r++)
      for (let c = r + 1; c < n; c++) {
        [matrix[r][c], matrix[c][r]] = [matrix[c][r], matrix[r][c]];
        t.step("transpose", `Swap (${r}, ${c}) ↔ (${c}, ${r}).`, () => [grid("matrix", matrix, { tones: tones([rc(r, c), "active"], [rc(c, r), "compare"]) })]);
      }
    matrix.forEach((row, r) => {
      row.reverse();
      t.step("reverse", `Reverse row ${r}.`, () => [grid("matrix", matrix, { tones: tones(...row.map((_, c) => [rc(r, c), "success"] as [string, "success"])) })]);
    });
    return matrix;
  },
});

const layers = defineSolution<Input>({
  id: "four-way-swap",
  name: "Rotate Layer by Layer",
  time: "O(n²)",
  space: "O(1)",
  idea: "Work ring by ring from the outside in. Each position on a ring trades places with three others in a 4-cycle: top → right → bottom → left → top.",
  code: code(`
    function rotate(matrix: number[][]): void {
      const n = matrix.length;
      for (let layer = 0; layer < n >> 1; layer++) { //@layer
        const first = layer, last = n - 1 - layer;
        for (let i = first; i < last; i++) {
          const off = i - first;
          const top = matrix[first][i]; //@save
          matrix[first][i] = matrix[last - off][first]; // left → top
          matrix[last - off][first] = matrix[last][last - off]; // bottom → left
          matrix[last][last - off] = matrix[i][last]; // right → bottom
          matrix[i][last] = top; //@cycle
        }
      }
    }
  `),
  run({ matrix }, t) {
    const n = matrix.length;
    for (let layer = 0; layer < n >> 1; layer++) {
      const first = layer,
        last = n - 1 - layer;
      t.step("layer", `Ring ${layer}: rows/cols ${first}..${last}.`, () => [grid("matrix", matrix)]);
      for (let i = first; i < last; i++) {
        const off = i - first;
        const cells: [number, number][] = [
          [first, i],
          [i, last],
          [last, last - off],
          [last - off, first],
        ];
        const ring = () => [grid("matrix", matrix, { tones: tones([rc(...cells[0]), "active"], [rc(...cells[1]), "compare"], [rc(...cells[2]), "visited"], [rc(...cells[3]), "success"]) })];
        const top = matrix[first][i];
        t.step("save", `These 4 cells rotate together. Save top = ${top}.`, ring);
        matrix[first][i] = matrix[last - off][first];
        matrix[last - off][first] = matrix[last][last - off];
        matrix[last][last - off] = matrix[i][last];
        matrix[i][last] = top;
        t.step("cycle", "left → top, bottom → left, right → bottom, top → right.", ring);
      }
    }
    return matrix;
  },
});

export default defineProblem<Input>({
  description: "Rotate an n × n matrix 90° clockwise in place.",
  input: { default: "matrix = [[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16]]", parse: (a) => ({ matrix: a.matrix<number>("matrix") }) },
  examples: [
    { input: "matrix = [[1,2,3],[4,5,6],[7,8,9]]", output: [[7, 4, 1], [8, 5, 2], [9, 6, 3]] },
    { input: "matrix = [[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]", output: [[15, 13, 2, 5], [14, 3, 4, 1], [12, 6, 8, 9], [16, 7, 10, 11]] },
  ],
  solutions: [extra, transposeReverse, layers],
});

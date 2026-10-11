import { arr, grid, rc, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  m: number;
  n: number;
}

const table = defineSolution<Input>({
  id: "2d-dp",
  name: "2D DP Grid",
  time: "O(m·n)",
  space: "O(m·n)",
  idea: "You can only arrive from above or from the left, so paths(r, c) = paths(r−1, c) + paths(r, c−1). The first row and column have one path each.",
  code: code(`
    function uniquePaths(m: number, n: number): number {
      // dp[row][col] = number of paths to reach that cell. The first row and column have just one.
      const dp = Array.from({ length: m }, () => new Array(n).fill(1)); //@init
      for (let row = 1; row < m; row++) { //@r
        for (let col = 1; col < n; col++) { //@c
          const fromAbove = dp[row - 1][col];
          const fromLeft = dp[row][col - 1];
          dp[row][col] = fromAbove + fromLeft; //@fill
        }
      }
      return dp[m - 1][n - 1]; //@ret
    }
  `),
  run({ m, n }, t) {
    const dp: (number | null)[][] = Array.from({ length: m }, (_, r) => Array.from({ length: n }, (_, c) => (r === 0 || c === 0 ? 1 : null)));
    t.step("init", "Edge cells have exactly one path.", [grid("dp", dp)]);
    for (let r = 1; r < m; r++) {
      t.step("r", `Row ${r}.`, () => [grid("dp", dp)]);
      for (let c = 1; c < n; c++) {
        dp[r][c] = dp[r - 1][c]! + dp[r][c - 1]!;
        t.step("fill", `dp[${r}][${c}] = ${dp[r - 1][c]} (up) + ${dp[r][c - 1]} (left) = ${dp[r][c]}.`, () => [
          grid("dp", dp, { tones: tones([rc(r - 1, c), "compare"], [rc(r, c - 1), "compare"], [rc(r, c), "success"]) }),
        ]);
      }
    }
    t.step("ret", `Return ${dp[m - 1][n - 1]}.`, [grid("dp", dp, { tones: tones([rc(m - 1, n - 1), "success"]) })]);
    return dp[m - 1][n - 1];
  },
});

const row = defineSolution<Input>({
  id: "1d-dp",
  name: "1D Rolling Row",
  time: "O(m·n)",
  space: "O(n)",
  idea: "Keep one row. Before the update, row[c] holds the value from above; row[c−1] already holds the new value to the left.",
  code: code(`
    function uniquePaths(m: number, n: number): number {
      // Keep only one row. Before updating, row[col] still holds the value from the row above.
      const row = new Array(n).fill(1); //@init
      for (let r = 1; r < m; r++) { //@r
        for (let col = 1; col < n; col++) {
          row[col] = row[col] + row[col - 1]; // from above + from left //@fill
        }
      }
      return row[n - 1]; //@ret
    }
  `),
  run({ m, n }, t) {
    const row = new Array(n).fill(1);
    t.step("init", "The first row is all 1s.", [arr("row", row)]);
    for (let r = 1; r < m; r++) {
      t.step("r", `Row ${r}.`, [vars({ r }), arr("row", row)]);
      for (let c = 1; c < n; c++) {
        row[c] += row[c - 1];
        t.step("fill", `row[${c}] += row[${c - 1}] → ${row[c]}.`, () => [vars({ r }), arr("row", row, { tones: tones([c - 1, "compare"], [c, "success"]) })]);
      }
    }
    t.step("ret", `Return ${row[n - 1]}.`, [arr("row", row, { tones: tones([n - 1, "success"]) })]);
    return row[n - 1];
  },
});

const combinatorics = defineSolution<Input>({
  id: "combinatorics",
  name: "Combinatorics",
  time: "O(min(m, n))",
  space: "O(1)",
  idea: "Every path makes (m−1) down moves and (n−1) right moves. Choose which of the m+n−2 moves go down: C(m+n−2, m−1).",
  code: code(`
    function uniquePaths(m: number, n: number): number {
      // Every path is (m - 1) downs and (n - 1) rights in some order: choose k of the total moves.
      const totalMoves = m + n - 2; //@init
      const k = Math.min(m, n) - 1;
      let result = 1;
      for (let i = 1; i <= k; i++) { //@loop
        result = (result * (totalMoves - k + i)) / i; //@mul
      }
      return Math.round(result); //@ret
    }
  `),
  run({ m, n }, t) {
    const total = m + n - 2,
      k = Math.min(m, n) - 1;
    let res = 1;
    t.step("init", `Choose ${k} of ${total} moves: C(${total}, ${k}).`, [vars({ totalMoves: total, k, result: res })]);
    for (let i = 1; i <= k; i++) {
      t.step("loop", `i = ${i}.`, [vars({ totalMoves: total, k, i, result: res })]);
      res = (res * (total - k + i)) / i;
      t.step("mul", `result × ${total - k + i} ÷ ${i} = ${res}.`, [vars({ totalMoves: total, k, i, result: res })]);
    }
    t.step("ret", `Return ${Math.round(res)}.`, [vars({ answer: Math.round(res) })]);
    return Math.round(res);
  },
});

export default defineProblem<Input>({
  description: "A robot starts at the top-left of an m × n grid and can only move down or right. How many unique paths lead to the bottom-right corner?",
  input: { default: "m = 3, n = 7", parse: (a) => ({ m: a.int("m"), n: a.int("n") }) },
  examples: [
    { input: "m = 3, n = 7", output: 28 },
    { input: "m = 3, n = 2", output: 3 },
    { input: "m = 1, n = 1", output: 1 },
  ],
  solutions: [table, row, combinatorics],
});

import { arr, grid, map, rc, tones } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  word1: string;
  word2: string;
}

const memo = defineSolution<Input>({
  id: "memo",
  name: "Top-down on (i, j)",
  time: "O(m·n)",
  space: "O(m·n)",
  idea: "dist(i, j) converts word1[i..] into word2[j..]. Equal letters cost nothing; otherwise pay 1 and take the best of insert (j+1), delete (i+1) or replace (both +1).",
  code: code(`
    function minDistance(word1: string, word2: string): number {
      const memo = new Map<string, number>();
      // Fewest edits to turn word1[i..] into word2[j..].
      function distance(i: number, j: number): number {
        if (i === word1.length) return word2.length - j; //@base-a
        if (j === word2.length) return word1.length - i; //@base-b
        const key = i + "," + j;
        if (memo.has(key)) return memo.get(key)!; //@hit
        let result: number;
        if (word1[i] === word2[j]) { //@cmp
          result = distance(i + 1, j + 1);
        } else {
          const insert = distance(i, j + 1);
          const remove = distance(i + 1, j);
          const replace = distance(i + 1, j + 1);
          result = 1 + Math.min(insert, remove, replace);
        }
        memo.set(key, result); //@store
        return result;
      }
      return distance(0, 0); //@ret
    }
  `),
  run({ word1: a, word2: b }, t) {
    const memo = new Map<string, number>();
    const view = (i: number, j: number, key?: string) => [
      arr("word1", [...a], { tones: tones([i, "active"]), pointers: { i: i < a.length ? i : null } }),
      arr("word2", [...b], { tones: tones([j, "active"]), pointers: { j: j < b.length ? j : null } }),
      map("memo (i,j → edits)", memo, tones([key, "success"])),
    ];
    const dist = (i: number, j: number): number => {
      if (i === a.length) {
        t.step("base-a", `word1 used up: insert the remaining ${b.length - j}.`, () => view(i, j));
        return b.length - j;
      }
      if (j === b.length) {
        t.step("base-b", `word2 used up: delete the remaining ${a.length - i}.`, () => view(i, j));
        return a.length - i;
      }
      const key = `${i},${j}`;
      if (memo.has(key)) {
        t.step("hit", `dist(${key}) cached = ${memo.get(key)}.`, () => view(i, j, key));
        return memo.get(key)!;
      }
      t.step("cmp", a[i] === b[j] ? `'${a[i]}' = '${b[j]}': free, move both.` : `'${a[i]}' ≠ '${b[j]}': try insert, delete, replace.`, () => view(i, j));
      const res = a[i] === b[j] ? dist(i + 1, j + 1) : 1 + Math.min(dist(i, j + 1), dist(i + 1, j), dist(i + 1, j + 1));
      memo.set(key, res);
      t.step("store", `dist(${key}) = ${res}.`, () => view(i, j, key));
      return res;
    };
    const res = dist(0, 0);
    t.step("ret", `Return ${res}.`, view(0, 0, "0,0"));
    return res;
  },
});

const table = defineSolution<Input>({
  id: "table",
  name: "Bottom-up Table",
  time: "O(m·n)",
  space: "O(m·n)",
  idea: "dp[i][j] = edits to turn the first i letters of word1 into the first j of word2. Matching letters copy the diagonal; otherwise 1 + min(left = insert, up = delete, diagonal = replace).",
  code: code(`
    function minDistance(word1: string, word2: string): number {
      const rows = word1.length;
      const cols = word2.length;
      // dp[i][j] = fewest edits to turn the first i letters of word1 into the first j of word2
      const dp = Array.from({ length: rows + 1 }, () => new Array(cols + 1).fill(0)); //@init
      for (let i = 0; i <= rows; i++) dp[i][0] = i; // delete everything
      for (let j = 0; j <= cols; j++) dp[0][j] = j; // insert everything
      for (let i = 1; i <= rows; i++) {
        for (let j = 1; j <= cols; j++) { //@cell
          if (word1[i - 1] === word2[j - 1]) {
            dp[i][j] = dp[i - 1][j - 1];
          } else {
            const insert = dp[i][j - 1];
            const remove = dp[i - 1][j];
            const replace = dp[i - 1][j - 1];
            dp[i][j] = 1 + Math.min(insert, remove, replace);
          }
        }
      }
      return dp[rows][cols]; //@ret
    }
  `),
  run({ word1: a, word2: b }, t) {
    const dp: (number | null)[][] = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : null)));
    const labels = { rowLabels: ["∅", ...a], colLabels: ["∅", ...b] };
    t.step("init", "Turning a prefix into the empty string (or back) costs its length.", [grid("dp", dp, labels)]);
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++) {
        const match = a[i - 1] === b[j - 1];
        dp[i][j] = match ? dp[i - 1][j - 1]! : 1 + Math.min(dp[i][j - 1]!, dp[i - 1][j]!, dp[i - 1][j - 1]!);
        t.step("cell", match ? `'${a[i - 1]}' = '${b[j - 1]}': copy the diagonal, ${dp[i][j]}.` : `'${a[i - 1]}' → '${b[j - 1]}': 1 + min(insert, delete, replace) = ${dp[i][j]}.`, () => [
          grid("dp", dp, {
            ...labels,
            tones: match ? tones([rc(i - 1, j - 1), "compare"], [rc(i, j), "success"]) : tones([rc(i, j - 1), "compare"], [rc(i - 1, j), "compare"], [rc(i - 1, j - 1), "compare"], [rc(i, j), "active"]),
          }),
        ]);
      }
    const res = dp[a.length][b.length]!;
    t.step("ret", `Return ${res}.`, [grid("dp", dp, { ...labels, tones: tones([rc(a.length, b.length), "success"]) })]);
    return res;
  },
});

export default defineProblem<Input>({
  description: "Return the minimum number of operations (insert a character, delete a character, or replace a character) needed to convert word1 into word2.",
  input: { default: 'word1 = "horse", word2 = "ros"', parse: (a) => ({ word1: a.str("word1"), word2: a.str("word2") }) },
  examples: [
    { input: 'word1 = "horse", word2 = "ros"', output: 3 },
    { input: 'word1 = "intention", word2 = "execution"', output: 5 },
    { input: 'word1 = "", word2 = "a"', output: 1 },
  ],
  solutions: [memo, table],
});

import { arr, grid, map, rc, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  text1: string;
  text2: string;
}

const memo = defineSolution<Input>({
  id: "memo",
  name: "Top-down Memoization",
  time: "O(m·n)",
  space: "O(m·n)",
  idea: "lcs(i, j): if the characters match, take 1 + lcs(i+1, j+1); otherwise skip one character from either string and take the better result.",
  approach: [
    {
      title: "Compare the current characters",
      detail: "lcs(i, j) is the LCS of the suffixes text1[i..] and text2[j..]. On a match, use that character and move both indices forward.",
      at: "cmp",
    },
    {
      title: "On a mismatch, skip one side",
      detail: "One of the two characters can't be in the LCS, so try dropping either and take the better result.",
      at: "cmp",
      nth: 2,
    },
    {
      title: "Base case: a string runs out",
      detail: "An empty suffix has no common subsequence, so the result is 0.",
      at: "base",
    },
    {
      title: "Memoize (i, j)",
      detail: "There are only m·n distinct (i, j) pairs, so caching keeps the total work at O(m·n).",
      at: "hit",
    },
  ],
  code: code(`
    function longestCommonSubsequence(text1: string, text2: string): number {
      const memo = new Map<string, number>();
      // Length of the LCS of text1[i..] and text2[j..].
      function lcs(i: number, j: number): number {
        if (i === text1.length || j === text2.length) return 0; //@base
        const key = i + "," + j;
        if (memo.has(key)) return memo.get(key)!; //@hit
        let result: number;
        if (text1[i] === text2[j]) { //@cmp
          result = 1 + lcs(i + 1, j + 1);
        } else {
          result = Math.max(lcs(i + 1, j), lcs(i, j + 1));
        }
        memo.set(key, result); //@store
        return result;
      }
      return lcs(0, 0); //@ret
    }
  `),
  run({ text1: a, text2: b }, t) {
    const cache = new Map<string, number>();
    const view = (i: number, j: number, key?: string) => [
      arr("text1", [...a], { tones: tones([i, "active"]), pointers: { i } }),
      arr("text2", [...b], { tones: tones([j, "active"]), pointers: { j } }),
      map("memo (i,j → lcs)", cache, tones([key, "success"])),
    ];
    const lcs = (i: number, j: number): number => {
      if (i === a.length || j === b.length) {
        t.step("base", "One string is exhausted: 0.", () => view(i, j));
        return 0;
      }
      const key = `${i},${j}`;
      if (cache.has(key)) {
        t.step("hit", `lcs(${key}) cached = ${cache.get(key)}.`, () => view(i, j, key));
        return cache.get(key)!;
      }
      const match = a[i] === b[j];
      t.step("cmp", match ? `'${a[i]}' matches: 1 + lcs(${i + 1},${j + 1}).` : `'${a[i]}' ≠ '${b[j]}': try skipping either one.`, () => view(i, j));
      const res = match ? 1 + lcs(i + 1, j + 1) : Math.max(lcs(i + 1, j), lcs(i, j + 1));
      cache.set(key, res);
      t.step("store", `lcs(${key}) = ${res}.`, () => view(i, j, key));
      return res;
    };
    const res = lcs(0, 0);
    t.step("ret", `Return ${res}.`, view(0, 0, "0,0"));
    return res;
  },
});

const table = defineSolution<Input>({
  id: "table",
  name: "Bottom-up 2D Table",
  time: "O(m·n)",
  space: "O(m·n)",
  idea: "dp[i][j] = LCS of the first i chars of text1 and the first j chars of text2. On a match take the diagonal + 1, otherwise the max of the cell above and the cell to the left.",
  approach: [
    {
      title: "Zero border",
      detail: "Row 0 and column 0 stand for an empty prefix, so their LCS is 0.",
      at: "init",
    },
    {
      title: "Match: diagonal + 1",
      detail: "If text1[i−1] === text2[j−1], extend the LCS of both shorter prefixes: dp[i−1][j−1] + 1.",
      at: "cell",
    },
    {
      title: "Mismatch: best neighbor",
      detail: "Otherwise drop one character: dp[i][j] = max(dp[i−1][j], dp[i][j−1]).",
      at: "cell",
      nth: 2,
    },
    {
      title: "Bottom-right is the answer",
      detail: "dp[m][n] covers both full strings.",
      at: "ret",
    },
  ],
  code: code(`
    function longestCommonSubsequence(text1: string, text2: string): number {
      // dp[i][j] = LCS length of the first i letters of text1 and the first j of text2
      const dp = Array.from({ length: text1.length + 1 }, () => new Array(text2.length + 1).fill(0)); //@init
      for (let i = 1; i <= text1.length; i++) { //@i
        for (let j = 1; j <= text2.length; j++) { //@j
          if (text1[i - 1] === text2[j - 1]) { //@cell
            dp[i][j] = dp[i - 1][j - 1] + 1;
          } else {
            dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
          }
        }
      }
      return dp[text1.length][text2.length]; //@ret
    }
  `),
  run({ text1: a, text2: b }, t) {
    const dp: (number | null)[][] = Array.from({ length: a.length + 1 }, (_, i) =>
      Array.from({ length: b.length + 1 }, (_, j) => (i === 0 || j === 0 ? 0 : null)),
    );
    const view = (i?: number, j?: number, match?: boolean) => [
      grid("dp", dp, {
        rowLabels: ["∅", ...a],
        colLabels: ["∅", ...b],
        tones:
          i === undefined || j === undefined
            ? {}
            : match
              ? tones([rc(i - 1, j - 1), "compare"], [rc(i, j), "success"])
              : tones([rc(i - 1, j), "compare"], [rc(i, j - 1), "compare"], [rc(i, j), "active"]),
      }),
    ];
    t.step("init", "Row 0 and column 0 are 0: an empty string has no common subsequence.", view());
    for (let i = 1; i <= a.length; i++) {
      t.step("i", `Row for '${a[i - 1]}'.`, () => view());
      for (let j = 1; j <= b.length; j++) {
        const match = a[i - 1] === b[j - 1];
        dp[i][j] = match ? dp[i - 1][j - 1]! + 1 : Math.max(dp[i - 1][j]!, dp[i][j - 1]!);
        t.step("cell", match ? `'${a[i - 1]}' = '${b[j - 1]}': diagonal + 1 = ${dp[i][j]}.` : `'${a[i - 1]}' ≠ '${b[j - 1]}': max(up, left) = ${dp[i][j]}.`, () => view(i, j, match));
      }
    }
    const res = dp[a.length][b.length]!;
    t.step("ret", `Return dp[${a.length}][${b.length}] = ${res}.`, [grid("dp", dp, { rowLabels: ["∅", ...a], colLabels: ["∅", ...b], tones: tones([rc(a.length, b.length), "success"]) })]);
    return res;
  },
});

const rolling = defineSolution<Input>({
  id: "rolling-row",
  name: "1D Rolling Row",
  time: "O(m·n)",
  space: "O(n)",
  idea: "Each row only needs the row above it. Keep one row and remember the old diagonal value in a variable.",
  approach: [
    {
      title: "One row is enough",
      detail: "Each cell needs only the cell above, the one to the left, and the upper-left diagonal. Keep a single row and overwrite it.",
      at: "init",
    },
    {
      title: "Match uses the saved diagonal",
      detail: "Before overwriting dp[j], the old value is the \"above\" cell. The diagonal variable holds the old dp[j−1] from the previous row.",
      at: "cell",
    },
    {
      title: "Mismatch",
      detail: "dp[j] = max(above, dp[j−1]), where dp[j−1] is already the current row's value.",
      at: "cell",
      nth: 2,
    },
    {
      title: "Same answer, O(n) memory",
      detail: "dp[n] after the last row equals the full table's bottom-right cell.",
      at: "ret",
    },
  ],
  code: code(`
    function longestCommonSubsequence(text1: string, text2: string): number {
      // One row of the 2D table. Before updating, dp[j] still holds the row above.
      const dp = new Array(text2.length + 1).fill(0); //@init
      for (let i = 1; i <= text1.length; i++) { //@i
        let diagonal = 0; // the old dp[j - 1] from the row above
        for (let j = 1; j <= text2.length; j++) { //@j
          const above = dp[j];
          if (text1[i - 1] === text2[j - 1]) { //@cell
            dp[j] = diagonal + 1;
          } else {
            dp[j] = Math.max(above, dp[j - 1]);
          }
          diagonal = above; //@diag
        }
      }
      return dp[text2.length]; //@ret
    }
  `),
  run({ text1: a, text2: b }, t) {
    const dp = new Array(b.length + 1).fill(0);
    const view = (i?: number, j?: number, diag?: number) => [
      vars({ char: i !== undefined ? a[i - 1] : undefined, diagonal: diag }),
      arr("dp (current row)", dp, { indexLabels: ["∅", ...b], tones: tones([j, "active"]) }),
    ];
    t.step("init", "One row of zeros.", view());
    for (let i = 1; i <= a.length; i++) {
      let diag = 0;
      t.step("i", `Row for '${a[i - 1]}'.`, () => view(i, undefined, diag));
      for (let j = 1; j <= b.length; j++) {
        const up = dp[j];
        const match = a[i - 1] === b[j - 1];
        dp[j] = match ? diag + 1 : Math.max(up, dp[j - 1]);
        t.step("cell", match ? `Match: diag + 1 = ${dp[j]}.` : `No match: max(up ${up}, left ${dp[j - 1]}) = ${dp[j]}.`, () => view(i, j, diag));
        diag = up;
      }
    }
    t.step("ret", `Return ${dp[b.length]}.`, view());
    return dp[b.length];
  },
});

export default defineProblem<Input>({
  description: "Return the length of the longest common subsequence of text1 and text2, or 0 if there is none.",
  input: {
    default: 'text1 = "abcde", text2 = "ace"',
    parse: (a) => ({ text1: a.str("text1"), text2: a.str("text2") }),
  },
  examples: [
    { input: 'text1 = "abcde", text2 = "ace"', output: 3 },
    { input: 'text1 = "abc", text2 = "abc"', output: 3 },
    { input: 'text1 = "abc", text2 = "def"', output: 0 },
  ],
  solutions: [memo, table, rolling],
});

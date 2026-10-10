import { arr, grid, map, rc, tones } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  s: string;
  t: string;
}

const memo = defineSolution<Input>({
  id: "memo",
  name: "Top-down on (i, j)",
  time: "O(m·n)",
  space: "O(m·n)",
  idea: "count(i, j) = ways to form t[j..] from s[i..]. You can always skip s[i]; if s[i] = t[j] you may also use it to match t[j].",
  code: code(`
    function numDistinct(s: string, t: string): number {
      const memo = new Map<string, number>();
      const count = (i: number, j: number): number => {
        if (j === t.length) return 1; //@full
        if (i === s.length) return 0; //@empty
        const key = i + "," + j;
        if (memo.has(key)) return memo.get(key)!; //@hit
        let res = count(i + 1, j); // skip s[i]
        if (s[i] === t[j]) res += count(i + 1, j + 1); //@match
        memo.set(key, res); //@store
        return res;
      };
      return count(0, 0); //@ret
    }
  `),
  run({ s, t: target }, t) {
    const memo = new Map<string, number>();
    const view = (i: number, j: number, key?: string) => [
      arr("s", [...s], { tones: tones([i, "active"]), pointers: { i: i < s.length ? i : null } }),
      arr("t", [...target], { tones: tones([j, "active"]), pointers: { j: j < target.length ? j : null } }),
      map("memo (i,j → ways)", memo, tones([key, "success"])),
    ];
    const count = (i: number, j: number): number => {
      if (j === target.length) {
        t.step("full", "All of t matched: 1 way.", () => view(i, j));
        return 1;
      }
      if (i === s.length) {
        t.step("empty", "s ran out first: 0 ways.", () => view(i, j));
        return 0;
      }
      const key = `${i},${j}`;
      if (memo.has(key)) {
        t.step("hit", `count(${key}) cached = ${memo.get(key)}.`, () => view(i, j, key));
        return memo.get(key)!;
      }
      let res = count(i + 1, j);
      if (s[i] === target[j]) {
        t.step("match", `'${s[i]}' matches t[${j}]: also try using it.`, () => view(i, j));
        res += count(i + 1, j + 1);
      }
      memo.set(key, res);
      t.step("store", `count(${key}) = ${res}.`, () => view(i, j, key));
      return res;
    };
    const res = count(0, 0);
    t.step("ret", `Return ${res}.`, view(0, 0, "0,0"));
    return res;
  },
});

const table = defineSolution<Input>({
  id: "table",
  name: "Bottom-up Table",
  time: "O(m·n)",
  space: "O(m·n)",
  idea: "dp[i][j] = ways the first i chars of s form the first j chars of t. dp[i][j] = dp[i−1][j] (ignore s[i−1]) + dp[i−1][j−1] when s[i−1] = t[j−1].",
  code: code(`
    function numDistinct(s: string, t: string): number {
      const dp = Array.from({ length: s.length + 1 }, () => new Array(t.length + 1).fill(0));
      for (let i = 0; i <= s.length; i++) dp[i][0] = 1; //@init
      for (let i = 1; i <= s.length; i++)
        for (let j = 1; j <= t.length; j++) //@cell
          dp[i][j] = dp[i - 1][j] + (s[i - 1] === t[j - 1] ? dp[i - 1][j - 1] : 0);
      return dp[s.length][t.length]; //@ret
    }
  `),
  run({ s, t: target }, t) {
    const dp: (number | null)[][] = Array.from({ length: s.length + 1 }, () => Array.from({ length: target.length + 1 }, (_, j) => (j === 0 ? 1 : null)));
    for (let j = 1; j <= target.length; j++) dp[0][j] = 0;
    const labels = { rowLabels: ["∅", ...s], colLabels: ["∅", ...target] };
    t.step("init", "Empty t can be formed one way; non-empty t from empty s in zero ways.", [grid("dp", dp, labels)]);
    for (let i = 1; i <= s.length; i++)
      for (let j = 1; j <= target.length; j++) {
        const match = s[i - 1] === target[j - 1];
        dp[i][j] = dp[i - 1][j]! + (match ? dp[i - 1][j - 1]! : 0);
        t.step("cell", match ? `'${s[i - 1]}' = '${target[j - 1]}': up + diagonal = ${dp[i][j]}.` : `'${s[i - 1]}' ≠ '${target[j - 1]}': copy from above = ${dp[i][j]}.`, () => [
          grid("dp", dp, { ...labels, tones: tones([rc(i - 1, j), "compare"], [match ? rc(i - 1, j - 1) : null, "compare"], [rc(i, j), "active"]) }),
        ]);
      }
    const res = dp[s.length][target.length]!;
    t.step("ret", `Return ${res}.`, [grid("dp", dp, { ...labels, tones: tones([rc(s.length, target.length), "success"]) })]);
    return res;
  },
});

export default defineProblem<Input>({
  description: "Given strings s and t, return the number of distinct subsequences of s that equal t.",
  input: { default: 's = "rabbbit", t = "rabbit"', parse: (a) => ({ s: a.str("s"), t: a.str("t") }) },
  examples: [
    { input: 's = "rabbbit", t = "rabbit"', output: 3 },
    { input: 's = "babgbag", t = "bag"', output: 5 },
    { input: 's = "abc", t = "abcd"', output: 0 },
  ],
  solutions: [memo, table],
});

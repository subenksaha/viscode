import { arr, grid, map, rc, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  s1: string;
  s2: string;
  s3: string;
}

const memo = defineSolution<Input>({
  id: "memo",
  name: "Top-down on (i, j)",
  time: "O(m·n)",
  space: "O(m·n)",
  idea: "After using i chars of s1 and j of s2, the next char of s3 is s3[i+j]. Take it from s1 if it matches s1[i], or from s2 if it matches s2[j]. Memoize failures on (i, j).",
  approach: [
    {
      title: "The next character is forced",
      detail: "After using i chars of s1 and j of s2, s3[i + j] must come from s1[i] or from s2[j].",
      at: "try",
    },
    {
      title: "Try both sources",
      detail: "If both match, try s1 first, then s2. Memoize (i, j) so no failing state is explored twice.",
      at: "try",
      nth: 2,
    },
    {
      title: "All matched",
      detail: "i + j reaching |s3| means a valid interleaving.",
      at: "done",
    },
    {
      title: "Answer",
      detail: "O(m·n) states.",
      at: "ret",
    },
  ],
  code: code(`
    function isInterleave(s1: string, s2: string, s3: string): boolean {
      if (s1.length + s2.length !== s3.length) return false;
      const memo = new Map<string, boolean>();
      // Can s1[i..] and s2[j..] interleave to form s3[i + j..]?
      function canForm(i: number, j: number): boolean {
        if (i + j === s3.length) return true; //@done
        const key = i + "," + j;
        if (memo.has(key)) return memo.get(key)!; //@hit
        const nextChar = s3[i + j];
        let result = false;
        if (s1[i] === nextChar && canForm(i + 1, j)) result = true; //@try
        if (!result && s2[j] === nextChar && canForm(i, j + 1)) result = true;
        memo.set(key, result);
        return result;
      }
      return canForm(0, 0); //@ret
    }
  `),
  run({ s1, s2, s3 }, t) {
    if (s1.length + s2.length !== s3.length) {
      t.step("ret", "Lengths don't add up: false.", [vars({ "|s1|+|s2|": s1.length + s2.length, "|s3|": s3.length })]);
      return false;
    }
    const memo = new Map<string, boolean>();
    const view = (i: number, j: number, key?: string) => [
      arr("s1", [...s1], { tones: tones([i, "active"]), pointers: { i: i < s1.length ? i : null } }),
      arr("s2", [...s2], { tones: tones([j, "active"]), pointers: { j: j < s2.length ? j : null } }),
      arr("s3", [...s3], { tones: tones([i + j, "compare"]), window: i + j > 0 ? [0, i + j - 1] : null }),
      map("memo (i,j → ok)", memo, tones([key, memo.get(key ?? "") ? "success" : "danger"])),
    ];
    const go = (i: number, j: number): boolean => {
      if (i + j === s3.length) {
        t.step("done", "All of s3 is matched.", () => view(i, j));
        return true;
      }
      const key = `${i},${j}`;
      if (memo.has(key)) {
        t.step("hit", `(${key}) already known: ${memo.get(key)}.`, () => view(i, j, key));
        return memo.get(key)!;
      }
      t.step("try", `Next char '${s3[i + j]}': s1 offers '${s1[i] ?? "—"}', s2 offers '${s2[j] ?? "—"}'.`, () => view(i, j));
      const res = (s1[i] === s3[i + j] && go(i + 1, j)) || (s2[j] === s3[i + j] && go(i, j + 1));
      memo.set(key, res);
      return res;
    };
    const res = go(0, 0);
    t.step("ret", `Return ${res}.`, view(0, 0, "0,0"));
    return res;
  },
});

const table = defineSolution<Input>({
  id: "table",
  name: "Bottom-up Table",
  time: "O(m·n)",
  space: "O(m·n)",
  idea: "dp[i][j] = can the first i chars of s1 and the first j of s2 form the first i+j of s3? Come from above if s1[i−1] matches, or from the left if s2[j−1] matches.",
  approach: [
    {
      title: "dp[0][0] = true",
      detail: "Two empty prefixes form an empty prefix.",
      at: "init",
    },
    {
      title: "From above or the left",
      detail: "dp[i][j] is true if s1[i−1] matches s3[i+j−1] and dp[i−1][j] is true, or s2[j−1] matches and dp[i][j−1] is true.",
      at: "cell",
      nth: 3,
    },
    {
      title: "Answer",
      detail: "dp[m][n].",
      at: "ret",
    },
  ],
  code: code(`
    function isInterleave(s1: string, s2: string, s3: string): boolean {
      const len1 = s1.length;
      const len2 = s2.length;
      if (len1 + len2 !== s3.length) return false;
      // dp[i][j] = can the first i of s1 and first j of s2 form the first i + j of s3?
      const dp = Array.from({ length: len1 + 1 }, () => new Array(len2 + 1).fill(false));
      dp[0][0] = true; //@init
      for (let i = 0; i <= len1; i++) {
        for (let j = 0; j <= len2; j++) { //@cell
          const target = s3[i + j - 1];
          if (i > 0 && s1[i - 1] === target && dp[i - 1][j]) dp[i][j] = true;
          if (j > 0 && s2[j - 1] === target && dp[i][j - 1]) dp[i][j] = true;
        }
      }
      return dp[len1][len2]; //@ret
    }
  `),
  run({ s1, s2, s3 }, t) {
    const m = s1.length,
      n = s2.length;
    if (m + n !== s3.length) {
      t.step("ret", "Lengths don't add up: false.");
      return false;
    }
    const dp: (string | null)[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(null));
    const bool = (i: number, j: number) => dp[i][j] === "T";
    const labels = { rowLabels: ["∅", ...s1], colLabels: ["∅", ...s2] };
    dp[0][0] = "T";
    t.step("init", "Two empty prefixes make an empty prefix.", [grid("dp", dp, labels)]);
    for (let i = 0; i <= m; i++)
      for (let j = 0; j <= n; j++) {
        if (!i && !j) continue;
        const up = !!i && s1[i - 1] === s3[i + j - 1] && bool(i - 1, j);
        const left = !!j && s2[j - 1] === s3[i + j - 1] && bool(i, j - 1);
        dp[i][j] = up || left ? "T" : "·";
        t.step("cell", `s3[${i + j - 1}] = '${s3[i + j - 1]}': ${up ? "from s1 (above)" : left ? "from s2 (left)" : "no way"}.`, () => [
          arr("s3", [...s3], { tones: tones([i + j - 1, "active"]) }),
          grid("dp", dp, { ...labels, tones: tones([i ? rc(i - 1, j) : null, up ? "success" : "compare"], [j ? rc(i, j - 1) : null, left ? "success" : "compare"], [rc(i, j), "active"]) }),
        ]);
      }
    const res = bool(m, n);
    t.step("ret", `dp[${m}][${n}] = ${res}.`, [grid("dp", dp, { ...labels, tones: tones([rc(m, n), res ? "success" : "danger"]) })]);
    return res;
  },
});

export default defineProblem<Input>({
  description: "Return whether s3 can be formed by interleaving s1 and s2: splitting both into pieces and merging the pieces while keeping each string's characters in order.",
  input: { default: 's1 = "aab", s2 = "axy", s3 = "aaxaby"', parse: (a) => ({ s1: a.str("s1"), s2: a.str("s2"), s3: a.str("s3") }) },
  examples: [
    { input: 's1 = "aabcc", s2 = "dbbca", s3 = "aadbbcbcac"', output: true },
    { input: 's1 = "aabcc", s2 = "dbbca", s3 = "aadbbbaccc"', output: false },
    { input: 's1 = "", s2 = "", s3 = ""', output: true },
  ],
  solutions: [memo, table],
});

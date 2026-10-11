import { arr, grid, map, rc, tones } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  s: string;
  p: string;
}

const memo = defineSolution<Input>({
  id: "memo",
  name: "Top-down on (i, j)",
  time: "O(m·n)",
  space: "O(m·n)",
  idea: "match(i, j): does s[i..] match p[j..]? If p[j+1] is '*', either skip 'x*' entirely or, when s[i] matches x, consume one char of s and stay on the star. Otherwise match one char and move both.",
  approach: [
    {
      title: "Does the first character match?",
      detail: "'.' matches any character.",
      at: "first",
    },
    {
      title: "Star: zero or more",
      detail: "Skip 'x*' entirely (j + 2), or if the first character matches, consume one character and stay on the star (i + 1, j).",
      at: "star",
    },
    {
      title: "Plain character",
      detail: "Must match, then advance both.",
      at: "single",
    },
    {
      title: "End of pattern",
      detail: "Matches only if s is also used up.",
      at: "end",
    },
  ],
  code: code(`
    function isMatch(s: string, p: string): boolean {
      const memo = new Map<string, boolean>();
      // Does s[i..] match the pattern p[j..]?
      function matches(i: number, j: number): boolean {
        if (j === p.length) return i === s.length; //@end
        const key = i + "," + j;
        if (memo.has(key)) return memo.get(key)!; //@hit
        const firstMatches = i < s.length && (p[j] === "." || p[j] === s[i]); //@first
        let result: boolean;
        if (p[j + 1] === "*") {
          // Either skip "x*" entirely, or use it to eat one character and stay on it.
          result = matches(i, j + 2) || (firstMatches && matches(i + 1, j)); //@star
        } else {
          result = firstMatches && matches(i + 1, j + 1); //@single
        }
        memo.set(key, result);
        return result;
      }
      return matches(0, 0); //@ret
    }
  `),
  run({ s, p }, t) {
    const memo = new Map<string, boolean>();
    const view = (i: number, j: number, key?: string) => [
      arr("s", [...s], { tones: tones([i, "active"]), pointers: { i: i < s.length ? i : null } }),
      arr("p", [...p], { tones: tones([j, "active"], [p[j + 1] === "*" ? j + 1 : null, "compare"]), pointers: { j: j < p.length ? j : null } }),
      map("memo (i,j → match)", memo, tones([key, memo.get(key ?? "") ? "success" : "danger"])),
    ];
    const match = (i: number, j: number): boolean => {
      if (j === p.length) {
        t.step("end", i === s.length ? "Pattern and string both done: match." : "Pattern done but string isn't.", () => view(i, j));
        return i === s.length;
      }
      const key = `${i},${j}`;
      if (memo.has(key)) {
        t.step("hit", `(${key}) cached = ${memo.get(key)}.`, () => view(i, j, key));
        return memo.get(key)!;
      }
      const first = i < s.length && (p[j] === "." || p[j] === s[i]);
      t.step("first", first ? `'${p[j]}' matches '${s[i]}'.` : `'${p[j]}' does not match ${i < s.length ? `'${s[i]}'` : "the end"}.`, () => view(i, j));
      let res: boolean;
      if (p[j + 1] === "*") {
        t.step("star", `'${p[j]}*': try zero copies, then one more copy.`, () => view(i, j));
        res = match(i, j + 2) || (first && match(i + 1, j));
      } else {
        if (first) t.step("single", "Advance both.", () => view(i, j));
        res = first && match(i + 1, j + 1);
      }
      memo.set(key, res);
      return res;
    };
    const res = match(0, 0);
    t.step("ret", `Return ${res}.`, view(0, 0, "0,0"));
    return res;
  },
});

const table = defineSolution<Input>({
  id: "table",
  name: "Bottom-up Table",
  time: "O(m·n)",
  space: "O(m·n)",
  idea: "dp[i][j] = do the first i chars of s match the first j of p? For 'x*' at p[j−2..j−1]: zero copies (dp[i][j−2]) or one more copy (dp[i−1][j] if s[i−1] matches x). Otherwise match the single char diagonally.",
  approach: [
    {
      title: "Empty matches empty",
      detail: "dp[0][0] = true.",
      at: "init",
    },
    {
      title: "Fill",
      detail: "For '*': dp[i][j−2] (zero copies) or (match && dp[i−1][j]) (one more copy). Otherwise match the single character diagonally.",
      at: "cell",
      nth: 2,
    },
    {
      title: "Answer",
      detail: "dp[m][n].",
      at: "ret",
    },
  ],
  code: code(`
    function isMatch(s: string, p: string): boolean {
      const m = s.length;
      const n = p.length;
      // dp[i][j] = do the first i characters of s match the first j characters of p?
      const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(false));
      dp[0][0] = true; //@init
      // Does s's i-th character match p's j-th character (both counted from 1)?
      const charMatches = (i: number, j: number) => p[j - 1] === "." || p[j - 1] === s[i - 1];
      for (let i = 0; i <= m; i++) {
        for (let j = 1; j <= n; j++) { //@cell
          if (p[j - 1] === "*") {
            const skipStar = dp[i][j - 2];
            const useStar = i > 0 && charMatches(i, j - 1) && dp[i - 1][j];
            dp[i][j] = skipStar || useStar;
          } else {
            dp[i][j] = i > 0 && charMatches(i, j) && dp[i - 1][j - 1];
          }
        }
      }
      return dp[m][n]; //@ret
    }
  `),
  run({ s, p }, t) {
    const m = s.length,
      n = p.length;
    const dp: (string | null)[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(null));
    const T = (i: number, j: number) => dp[i][j] === "T";
    for (let i = 1; i <= m; i++) dp[i][0] = "·";
    dp[0][0] = "T";
    const labels = { rowLabels: ["∅", ...s], colLabels: ["∅", ...p] };
    const eq = (i: number, j: number) => p[j - 1] === "." || p[j - 1] === s[i - 1];
    t.step("init", "Empty matches empty.", [grid("dp", dp, labels)]);
    for (let i = 0; i <= m; i++)
      for (let j = 1; j <= n; j++) {
        let ok: boolean, from: string[];
        if (p[j - 1] === "*") {
          const zero = T(i, j - 2),
            more = i > 0 && eq(i, j - 1) && T(i - 1, j);
          ok = zero || more;
          from = [rc(i, j - 2), ...(i > 0 ? [rc(i - 1, j)] : [])];
          dp[i][j] = ok ? "T" : "·";
          t.step("cell", `'${p[j - 2]}*' vs ${i ? `'${s[i - 1]}'` : "∅"}: ${zero ? "zero copies works" : more ? "one more copy works" : "no"}.`, () => [
            grid("dp", dp, { ...labels, tones: tones(...from.map((f) => [f, "compare"] as [string, "compare"]), [rc(i, j), ok ? "success" : "active"]) }),
          ]);
        } else {
          ok = i > 0 && eq(i, j) && T(i - 1, j - 1);
          dp[i][j] = ok ? "T" : "·";
          if (i > 0)
            t.step("cell", `'${p[j - 1]}' vs '${s[i - 1]}': ${eq(i, j) ? (ok ? "match, diagonal is true" : "match, but diagonal is false") : "no match"}.`, () => [
              grid("dp", dp, { ...labels, tones: tones([rc(i - 1, j - 1), "compare"], [rc(i, j), ok ? "success" : "active"]) }),
            ]);
        }
      }
    const res = T(m, n);
    t.step("ret", `dp[${m}][${n}] = ${res}.`, [grid("dp", dp, { ...labels, tones: tones([rc(m, n), res ? "success" : "danger"]) })]);
    return res;
  },
});

export default defineProblem<Input>({
  description: "Implement regular-expression matching with '.' (any single character) and '*' (zero or more of the preceding element). The match must cover the entire string s.",
  input: { default: 's = "aab", p = "c*a*b"', parse: (a) => ({ s: a.str("s"), p: a.str("p") }) },
  examples: [
    { input: 's = "aa", p = "a"', output: false },
    { input: 's = "aa", p = "a*"', output: true },
    { input: 's = "ab", p = ".*"', output: true },
    { input: 's = "mississippi", p = "mis*is*p*."', output: false },
  ],
  solutions: [memo, table],
});

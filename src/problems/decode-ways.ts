import { arr, map, range, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  s: string;
}

const memo = defineSolution<Input>({
  id: "memo",
  name: "Top-down Memoization",
  time: "O(n)",
  space: "O(n)",
  idea: "ways(i) = ways(i+1) if s[i] is 1–9, plus ways(i+2) if s[i..i+1] is 10–26. A leading '0' decodes to nothing.",
  code: code(`
    function numDecodings(s: string): number {
      const memo = new Map<number, number>();
      function ways(i: number): number {
        if (i === s.length) return 1; //@end
        if (s[i] === "0") return 0; //@zero
        if (memo.has(i)) return memo.get(i)!; //@hit
        let res = ways(i + 1); //@one
        if (i + 1 < s.length && Number(s.slice(i, i + 2)) <= 26) res += ways(i + 2); //@two
        memo.set(i, res); //@store
        return res;
      }
      return ways(0); //@ret
    }
  `),
  run({ s }, t) {
    const cache = new Map<number, number>();
    const view = (i: number, len = 0, key?: number) => [
      arr("s", [...s], { tones: tones(...range(i, i + len - 1, "active")), pointers: { i: i < s.length ? i : null } }),
      map("memo (start → ways)", cache, tones([key, "success"])),
    ];
    const ways = (i: number): number => {
      if (i === s.length) {
        t.step("end", "Reached the end: one complete decoding.", () => view(i));
        return 1;
      }
      if (s[i] === "0") {
        t.step("zero", `s[${i}] is '0', which cannot start a letter.`, () => view(i, 1));
        return 0;
      }
      if (cache.has(i)) {
        t.step("hit", `ways(${i}) cached = ${cache.get(i)}.`, () => view(i, 0, i));
        return cache.get(i)!;
      }
      t.step("one", `Take '${s[i]}' as one letter.`, () => view(i, 1));
      let res = ways(i + 1);
      if (i + 1 < s.length && Number(s.slice(i, i + 2)) <= 26) {
        t.step("two", `Take '${s.slice(i, i + 2)}' as one letter.`, () => view(i, 2));
        res += ways(i + 2);
      }
      cache.set(i, res);
      t.step("store", `ways(${i}) = ${res}.`, () => view(i, 0, i));
      return res;
    };
    const res = ways(0);
    t.step("ret", `Return ${res}.`, () => view(0, 0, 0));
    return res;
  },
});

const bottomUp = defineSolution<Input>({
  id: "bottom-up",
  name: "Bottom-up DP",
  time: "O(n)",
  space: "O(n)",
  idea: "dp[i] = number of ways to decode the first i characters. Add dp[i−1] if the last digit is valid alone, and dp[i−2] if the last two form 10–26.",
  code: code(`
    function numDecodings(s: string): number {
      const dp = new Array(s.length + 1).fill(0);
      dp[0] = 1; //@init
      for (let i = 1; i <= s.length; i++) { //@loop
        if (s[i - 1] !== "0") dp[i] += dp[i - 1]; //@one
        const two = Number(s.slice(i - 2, i));
        if (i >= 2 && two >= 10 && two <= 26) dp[i] += dp[i - 2]; //@two
      }
      return dp[s.length]; //@ret
    }
  `),
  run({ s }, t) {
    const dp = new Array(s.length + 1).fill(0);
    dp[0] = 1;
    const view = (i?: number, len = 0, from?: number) => [
      arr("s", [...s], { tones: i !== undefined ? tones(...range(i - len, i - 1, "active")) : {} }),
      arr("dp", dp, { tones: tones([from, "compare"], [i, "success"]) }),
    ];
    t.step("init", "dp[0] = 1 (empty prefix).", view());
    for (let i = 1; i <= s.length; i++) {
      t.step("loop", `Prefix of length ${i}.`, view(i));
      if (s[i - 1] !== "0") {
        dp[i] += dp[i - 1];
        t.step("one", `'${s[i - 1]}' is a letter: add dp[${i - 1}]. dp[${i}] = ${dp[i]}.`, view(i, 1, i - 1));
      } else t.step("one", "'0' cannot stand alone.", view(i, 1));
      const two = Number(s.slice(i - 2, i));
      if (i >= 2 && two >= 10 && two <= 26) {
        dp[i] += dp[i - 2];
        t.step("two", `'${s.slice(i - 2, i)}' is a letter: add dp[${i - 2}]. dp[${i}] = ${dp[i]}.`, view(i, 2, i - 2));
      }
    }
    t.step("ret", `Return ${dp[s.length]}.`, view(s.length));
    return dp[s.length];
  },
});

const constant = defineSolution<Input>({
  id: "two-variables",
  name: "Two Variables",
  time: "O(n)",
  space: "O(1)",
  idea: "The bottom-up recurrence only looks two steps back, so keep two counters.",
  code: code(`
    function numDecodings(s: string): number {
      let prev2 = 1, prev1 = s[0] === "0" ? 0 : 1; //@init
      for (let i = 2; i <= s.length; i++) { //@loop
        let cur = s[i - 1] !== "0" ? prev1 : 0; //@one
        const two = Number(s.slice(i - 2, i));
        if (two >= 10 && two <= 26) cur += prev2; //@two
        [prev2, prev1] = [prev1, cur]; //@shift
      }
      return prev1; //@ret
    }
  `),
  run({ s }, t) {
    let prev2 = 1,
      prev1 = s[0] === "0" ? 0 : 1;
    const view = (i?: number, cur?: number) => [vars({ prev2, prev1, cur }), arr("s", [...s], { tones: tones([i !== undefined ? i - 1 : null, "active"]) })];
    t.step("init", `prev2 = 1, prev1 = ${prev1}.`, view());
    for (let i = 2; i <= s.length; i++) {
      t.step("loop", `Character ${i - 1}: '${s[i - 1]}'.`, view(i));
      let cur = s[i - 1] !== "0" ? prev1 : 0;
      t.step("one", `Single digit adds ${s[i - 1] !== "0" ? prev1 : 0}.`, view(i, cur));
      const two = Number(s.slice(i - 2, i));
      if (two >= 10 && two <= 26) {
        cur += prev2;
        t.step("two", `'${s.slice(i - 2, i)}' adds ${prev2}.`, view(i, cur));
      }
      [prev2, prev1] = [prev1, cur];
      t.step("shift", `ways = ${cur}.`, view(i));
    }
    t.step("ret", `Return ${prev1}.`, view());
    return prev1;
  },
});

export default defineProblem<Input>({
  description: "Letters map to numbers: 'A' → 1 … 'Z' → 26. Return how many ways a digit string s can be decoded back into letters.",
  input: { default: 's = "2263"', parse: (a) => ({ s: a.str("s") }) },
  examples: [
    { input: 's = "12"', output: 2 },
    { input: 's = "226"', output: 3 },
    { input: 's = "06"', output: 0 },
    { input: 's = "2101"', output: 1 },
  ],
  solutions: [memo, bottomUp, constant],
});

import { arr, map, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  s: string;
}

const bruteForce = defineSolution<Input>({
  id: "brute-force",
  name: "Brute Force",
  time: "O(n²)",
  space: "O(k)",
  idea: "From every start, extend to the right until a character repeats.",
  code: code(`
    function lengthOfLongestSubstring(s: string): number {
      let best = 0; //@init
      for (let i = 0; i < s.length; i++) { //@i
        const seen = new Set<string>();
        for (let j = i; j < s.length && !seen.has(s[j]); j++) { //@j
          seen.add(s[j]);
          best = Math.max(best, j - i + 1); //@best
        }
      }
      return best; //@ret
    }
  `),
  run({ s }, t) {
    let best = 0;
    const chars = [...s];
    t.step("init", "best = 0.", [arr("s", chars)]);
    for (let i = 0; i < s.length; i++) {
      const seen = new Set<string>();
      t.step("i", `Start at ${i}.`, () => [vars({ best }), arr("s", chars, { pointers: { i } })]);
      let j = i;
      for (; j < s.length && !seen.has(s[j]); j++) {
        seen.add(s[j]);
        best = Math.max(best, j - i + 1);
        const jj = j;
        t.step("best", `"${s.slice(i, j + 1)}" has no repeats. best = ${best}.`, () => [vars({ best }), arr("s", chars, { window: [i, jj], pointers: { i, j: jj } })]);
      }
      if (j < s.length) {
        const jj = j;
        t.step("j", `'${s[j]}' repeats. Stop extending.`, () => [vars({ best }), arr("s", chars, { window: [i, jj - 1], tones: tones([jj, "danger"]), pointers: { i, j: jj } })]);
      }
    }
    t.step("ret", `Return ${best}.`, [vars({ best })]);
    return best;
  },
});

const windowSet = defineSolution<Input>({
  id: "sliding-window-set",
  name: "Sliding Window + Set",
  time: "O(n)",
  space: "O(k)",
  idea: "Grow the window on the right. While the new character is already inside, drop characters from the left.",
  code: code(`
    function lengthOfLongestSubstring(s: string): number {
      const inWin = new Set<string>();
      let lo = 0, best = 0; //@init
      for (let hi = 0; hi < s.length; hi++) { //@hi
        while (inWin.has(s[hi])) inWin.delete(s[lo++]); //@shrink
        inWin.add(s[hi]); //@add
        best = Math.max(best, hi - lo + 1); //@best
      }
      return best; //@ret
    }
  `),
  run({ s }, t) {
    const inWin = new Set<string>();
    let lo = 0,
      best = 0;
    const chars = [...s];
    const view = (hi: number, dup = false) => [
      vars({ best }),
      arr("s", chars, { window: lo <= hi - (dup ? 1 : 0) ? [lo, hi - (dup ? 1 : 0)] : null, tones: tones([hi, dup ? "danger" : "active"]), pointers: { lo, hi } }),
      map("window chars", inWin),
    ];
    t.step("init", "Empty window.", [arr("s", chars)]);
    for (let hi = 0; hi < s.length; hi++) {
      t.step("hi", `Bring in s[${hi}] = '${s[hi]}'.`, () => view(hi, inWin.has(s[hi])));
      while (inWin.has(s[hi])) {
        inWin.delete(s[lo++]);
        t.step("shrink", `'${s[hi]}' is already inside. Drop '${s[lo - 1]}' from the left.`, () => view(hi, inWin.has(s[hi])));
      }
      inWin.add(s[hi]);
      t.step("add", `Add '${s[hi]}'.`, () => view(hi));
      best = Math.max(best, hi - lo + 1);
      t.step("best", `Window length ${hi - lo + 1}. best = ${best}.`, () => view(hi));
    }
    t.step("ret", `Return ${best}.`, [vars({ best })]);
    return best;
  },
});

const windowMap = defineSolution<Input>({
  id: "sliding-window-jump",
  name: "Sliding Window + Last Index (Jump)",
  time: "O(n)",
  space: "O(k)",
  idea: "Remember the last index of each character. On a repeat, jump lo straight past the previous occurrence instead of removing characters one by one.",
  code: code(`
    function lengthOfLongestSubstring(s: string): number {
      const last = new Map<string, number>();
      let lo = 0, best = 0; //@init
      for (let hi = 0; hi < s.length; hi++) { //@hi
        if (last.has(s[hi]) && last.get(s[hi])! >= lo) lo = last.get(s[hi])! + 1; //@jump
        last.set(s[hi], hi); //@record
        best = Math.max(best, hi - lo + 1); //@best
      }
      return best; //@ret
    }
  `),
  run({ s }, t) {
    const last = new Map<string, number>();
    let lo = 0,
      best = 0;
    const chars = [...s];
    const view = (hi: number, key?: string) => [vars({ best }), arr("s", chars, { window: [lo, hi], tones: tones([hi, "active"]), pointers: { lo, hi } }), map("last index", last, tones([key, "compare"]))];
    t.step("init", "Empty map.", [arr("s", chars)]);
    for (let hi = 0; hi < s.length; hi++) {
      t.step("hi", `s[${hi}] = '${s[hi]}'.`, () => view(hi, s[hi]));
      if (last.has(s[hi]) && last.get(s[hi])! >= lo) {
        lo = last.get(s[hi])! + 1;
        t.step("jump", `'${s[hi]}' was last seen at ${lo - 1}, inside the window. Jump lo to ${lo}.`, () => view(hi, s[hi]));
      }
      last.set(s[hi], hi);
      t.step("record", `last['${s[hi]}'] = ${hi}.`, () => view(hi, s[hi]));
      best = Math.max(best, hi - lo + 1);
      t.step("best", `best = ${best}.`, () => view(hi));
    }
    t.step("ret", `Return ${best}.`, [vars({ best })]);
    return best;
  },
});

export default defineProblem<Input>({
  description: "Return the length of the longest substring of s that contains no repeated characters.",
  input: { default: 's = "abcabcbb"', parse: (a) => ({ s: a.str("s") }) },
  examples: [
    { input: 's = "abcabcbb"', output: 3 },
    { input: 's = "bbbbb"', output: 1 },
    { input: 's = "pwwkew"', output: 3 },
    { input: 's = ""', output: 0 },
  ],
  solutions: [bruteForce, windowSet, windowMap],
});

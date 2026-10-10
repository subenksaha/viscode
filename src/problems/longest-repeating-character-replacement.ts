import { arr, map, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  s: string;
  k: number;
}

const bruteForce = defineSolution<Input>({
  id: "brute-force",
  name: "Brute Force",
  time: "O(n²)",
  space: "O(26)",
  idea: "For each start, extend the end while tracking letter counts. A window works if its length minus its most frequent letter count is at most k.",
  code: code(`
    function characterReplacement(s: string, k: number): number {
      let best = 0; //@init
      for (let i = 0; i < s.length; i++) { //@i
        const count = new Map<string, number>();
        let top = 0;
        for (let j = i; j < s.length; j++) { //@j
          count.set(s[j], (count.get(s[j]) ?? 0) + 1);
          top = Math.max(top, count.get(s[j])!);
          if (j - i + 1 - top <= k) best = Math.max(best, j - i + 1); //@check
        }
      }
      return best; //@ret
    }
  `),
  run({ s, k }, t) {
    let best = 0;
    const chars = [...s];
    t.step("init", "best = 0.", [arr("s", chars)]);
    for (let i = 0; i < s.length; i++) {
      const count = new Map<string, number>();
      let top = 0;
      t.step("i", `Start at ${i}.`, () => [vars({ best }), arr("s", chars, { pointers: { i } })]);
      for (let j = i; j < s.length; j++) {
        count.set(s[j], (count.get(s[j]) ?? 0) + 1);
        top = Math.max(top, count.get(s[j])!);
        const len = j - i + 1;
        if (len - top <= k) best = Math.max(best, len);
        t.step("check", `Window "${s.slice(i, j + 1)}": ${len} − ${top} = ${len - top} change(s) ${len - top <= k ? "≤" : ">"} k. best = ${best}.`, () => [vars({ k, best }), arr("s", chars, { window: [i, j], pointers: { i, j } }), map("counts", count)]);
      }
    }
    t.step("ret", `Return ${best}.`, [vars({ best })]);
    return best;
  },
});

const slidingWindow = defineSolution<Input>({
  id: "sliding-window",
  name: "Sliding Window",
  time: "O(n)",
  space: "O(26)",
  idea: "Grow the window on the right. If it would need more than k replacements (length − max count > k), slide the left edge forward. maxCount never has to decrease: only a larger maxCount can produce a longer answer.",
  code: code(`
    function characterReplacement(s: string, k: number): number {
      const count = new Map<string, number>();
      let lo = 0, maxCount = 0, best = 0; //@init
      for (let hi = 0; hi < s.length; hi++) { //@hi
        count.set(s[hi], (count.get(s[hi]) ?? 0) + 1);
        maxCount = Math.max(maxCount, count.get(s[hi])!); //@max
        if (hi - lo + 1 - maxCount > k) { //@slide
          count.set(s[lo], count.get(s[lo])! - 1);
          lo++;
        }
        best = Math.max(best, hi - lo + 1); //@best
      }
      return best; //@ret
    }
  `),
  run({ s, k }, t) {
    const count = new Map<string, number>();
    let lo = 0,
      maxCount = 0,
      best = 0;
    const chars = [...s];
    const view = (hi: number) => [vars({ k, maxCount, best }), arr("s", chars, { window: [lo, hi], pointers: { lo, hi } }), map("counts", count)];
    t.step("init", "Empty window.", [arr("s", chars)]);
    for (let hi = 0; hi < s.length; hi++) {
      count.set(s[hi], (count.get(s[hi]) ?? 0) + 1);
      t.step("hi", `Bring in '${s[hi]}'.`, () => view(hi));
      maxCount = Math.max(maxCount, count.get(s[hi])!);
      t.step("max", `Most frequent letter count = ${maxCount}.`, () => view(hi));
      if (hi - lo + 1 - maxCount > k) {
        count.set(s[lo], count.get(s[lo])! - 1);
        lo++;
        t.step("slide", `${hi - lo + 2} − ${maxCount} > ${k}: too many replacements. Slide lo to ${lo}.`, () => view(hi));
      }
      best = Math.max(best, hi - lo + 1);
      t.step("best", `Window length ${hi - lo + 1}. best = ${best}.`, () => view(hi));
    }
    t.step("ret", `Return ${best}.`, [vars({ best })]);
    return best;
  },
});

const perLetter = defineSolution<Input>({
  id: "per-letter",
  name: "One Window per Target Letter",
  time: "O(26 · n)",
  space: "O(1)",
  idea: "Fix the letter the window should become. Then it is a plain window: count characters that differ from it and shrink whenever there are more than k.",
  code: code(`
    function characterReplacement(s: string, k: number): number {
      let best = 0;
      for (const target of new Set(s)) { //@target
        let lo = 0, diff = 0;
        for (let hi = 0; hi < s.length; hi++) { //@hi
          if (s[hi] !== target) diff++;
          while (diff > k) if (s[lo++] !== target) diff--; //@shrink
          best = Math.max(best, hi - lo + 1); //@best
        }
      }
      return best; //@ret
    }
  `),
  run({ s, k }, t) {
    let best = 0;
    const chars = [...s];
    for (const target of new Set(s)) {
      let lo = 0,
        diff = 0;
      t.step("target", `Try making the window all '${target}'.`, [vars({ target, best }), arr("s", chars)]);
      for (let hi = 0; hi < s.length; hi++) {
        if (s[hi] !== target) diff++;
        const shrinking = diff > k;
        while (diff > k) if (s[lo++] !== target) diff--;
        const h = hi;
        t.step(shrinking ? "shrink" : "hi", shrinking ? `Too many changes. Shrink to lo = ${lo}.` : `'${s[hi]}' ${s[hi] === target ? "matches" : "needs a change"}. changes = ${diff}.`, () => [vars({ target, changes: diff, best }), arr("s", chars, { window: [lo, h], pointers: { lo, hi: h } })]);
        best = Math.max(best, hi - lo + 1);
      }
      t.step("best", `best = ${best}.`, [vars({ target, best })]);
    }
    t.step("ret", `Return ${best}.`, [vars({ best })]);
    return best;
  },
});

export default defineProblem<Input>({
  description: "You may change at most k characters of s to any other uppercase letter. Return the length of the longest substring made of a single repeated letter you can get.",
  input: { default: 's = "AABABBA", k = 1', parse: (a) => ({ s: a.str("s"), k: a.int("k") }) },
  examples: [
    { input: 's = "ABAB", k = 2', output: 4 },
    { input: 's = "AABABBA", k = 1', output: 4 },
  ],
  solutions: [bruteForce, perLetter, slidingWindow],
});

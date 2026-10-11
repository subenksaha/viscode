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
  approach: [
    {
      title: "Fix a start",
      detail: "Each start index i begins a candidate substring.",
      at: "i",
    },
    {
      title: "Extend until a repeat",
      detail: "Grow j while s[j] is new to the set, updating best with each valid length.",
      at: "best",
      nth: 3,
    },
    {
      title: "Stop at the first repeat",
      detail: "Once a character repeats, any longer substring from i also contains the repeat, so stop extending. O(n²) overall.",
      at: "j",
    },
  ],
  code: code(`
    function lengthOfLongestSubstring(s: string): number {
      let best = 0; //@init
      for (let i = 0; i < s.length; i++) { //@i
        const seen = new Set<string>();
        for (let j = i; j < s.length; j++) { //@j
          if (seen.has(s[j])) break;
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
  approach: [
    {
      title: "Window [left, right]",
      detail: "The window always holds distinct characters, tracked in a set.",
      at: "init",
    },
    {
      title: "Bring in s[right]",
      detail: "Extend the window by one character on the right.",
      at: "hi",
      nth: 4,
    },
    {
      title: "Shrink while it repeats",
      detail: "While s[right] is already inside, remove s[left] and move left forward.",
      at: "shrink",
    },
    {
      title: "Record the length",
      detail: "After adding s[right], the window is valid, so update best. Each character enters and leaves once: O(n).",
      at: "best",
      nth: 3,
    },
  ],
  code: code(`
    function lengthOfLongestSubstring(s: string): number {
      const inWindow = new Set<string>();
      let left = 0; //@init
      let best = 0;
      for (let right = 0; right < s.length; right++) { //@hi
        // Shrink from the left until s[right] is no longer in the window.
        while (inWindow.has(s[right])) { //@shrink
          inWindow.delete(s[left]);
          left++;
        }
        inWindow.add(s[right]); //@add
        best = Math.max(best, right - left + 1); //@best
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
      arr("s", chars, { window: lo <= hi - (dup ? 1 : 0) ? [lo, hi - (dup ? 1 : 0)] : null, tones: tones([hi, dup ? "danger" : "active"]), pointers: { left: lo, right: hi } }),
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
  idea: "Remember the last index of each character. On a repeat, jump left straight past the previous occurrence instead of removing characters one by one.",
  approach: [
    {
      title: "Last-seen index per character",
      detail: "Remember where each character last appeared.",
      at: "init",
    },
    {
      title: "Jump past a repeat",
      detail: "If s[right] was last seen inside the window, move left to one past that position in one step, instead of removing characters one by one.",
      at: "jump",
    },
    {
      title: "Record and measure",
      detail: "Update lastSeen[s[right]] = right and compare the window length with best.",
      at: "record",
      nth: 4,
    },
    {
      title: "Answer",
      detail: "Each index is visited once. O(n) time.",
      at: "ret",
    },
  ],
  code: code(`
    function lengthOfLongestSubstring(s: string): number {
      const lastSeen = new Map<string, number>(); // letter -> index where we last saw it
      let left = 0; //@init
      let best = 0;
      for (let right = 0; right < s.length; right++) { //@hi
        const char = s[right];
        // If char repeats inside the window, jump left past its last position.
        if (lastSeen.has(char) && lastSeen.get(char)! >= left) { //@jump
          left = lastSeen.get(char)! + 1;
        }
        lastSeen.set(char, right); //@record
        best = Math.max(best, right - left + 1); //@best
      }
      return best; //@ret
    }
  `),
  run({ s }, t) {
    const last = new Map<string, number>();
    let lo = 0,
      best = 0;
    const chars = [...s];
    const view = (hi: number, key?: string) => [vars({ best }), arr("s", chars, { window: [lo, hi], tones: tones([hi, "active"]), pointers: { left: lo, right: hi } }), map("lastSeen", last, tones([key, "compare"]))];
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

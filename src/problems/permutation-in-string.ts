import { arr, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  s1: string;
  s2: string;
}

const sortWindows = defineSolution<Input>({
  id: "sort-windows",
  name: "Sort Every Window",
  time: "O(n · m log m)",
  space: "O(m)",
  idea: "A permutation of s1 sorts to the same string as s1. Sort each window of length |s1| in s2 and compare.",
  approach: [
    {
      title: "Sort s1",
      detail: "Every permutation of s1 sorts to the same string.",
      at: "key",
    },
    {
      title: "Sort each window",
      detail: "Windows have length |s1|.",
      at: "window",
    },
    {
      title: "Match",
      detail: "Sorting each window costs O(m log m).",
      at: "found",
    },
  ],
  code: code(`
    function checkInclusion(s1: string, s2: string): boolean {
      const sortLetters = (word: string) => word.split("").sort().join("");
      const target = sortLetters(s1); //@key
      for (let start = 0; start + s1.length <= s2.length; start++) { //@window
        const window = s2.slice(start, start + s1.length);
        if (sortLetters(window) === target) return true; //@found
      }
      return false; //@none
    }
  `),
  run({ s1, s2 }, t) {
    const key = [...s1].sort().join("");
    const m = s1.length;
    t.step("key", `Sorted s1 = "${key}".`, [vars({ target: key }), arr("s2", [...s2])]);
    for (let i = 0; i + m <= s2.length; i++) {
      const w = [...s2.slice(i, i + m)].sort().join("");
      const hit = w === key;
      const view = [vars({ target: key, window: w }), arr("s2", [...s2], { window: [i, i + m - 1], tones: hit ? tones(...Array.from({ length: m }, (_, k) => [i + k, "success"] as [number, Tone])) : {} })];
      if (hit) {
        t.step("found", `Window "${s2.slice(i, i + m)}" sorts to "${w}". Match.`, view);
        return true;
      }
      t.step("window", `Window "${s2.slice(i, i + m)}" sorts to "${w}". No match.`, view);
    }
    t.step("none", "No window matches.");
    return false;
  },
});

const sliding = defineSolution<Input>({
  id: "sliding-counts",
  name: "Sliding Window with Match Counter",
  time: "O(n)",
  space: "O(26)",
  idea: "Keep letter counts for s1 and for the current window, plus how many of the 26 letters have equal counts. Sliding the window changes two letters; when all 26 match, the window is a permutation.",
  approach: [
    {
      title: "Count s1 and the first window",
      detail: "Two 26-slot arrays.",
      at: "init",
    },
    {
      title: "Count matching letters",
      detail: "matches = how many of the 26 letters have equal counts. 26 means a permutation.",
      at: "matches",
    },
    {
      title: "Slide in",
      detail: "Adding a letter can make that letter match, or break a match it had.",
      at: "add",
    },
    {
      title: "Slide out",
      detail: "Same for the letter leaving. Only two letters change per step, so O(n).",
      at: "drop",
    },
    {
      title: "Check",
      detail: "If matches reaches 26 at any point, return true.",
      at: "check",
      nth: -1,
    },
  ],
  code: code(`
    function checkInclusion(s1: string, s2: string): boolean {
      if (s1.length > s2.length) return false;
      const letterIndex = (letter: string) => letter.charCodeAt(0) - "a".charCodeAt(0);
      const need = new Array(26).fill(0); // letter counts of s1
      const window = new Array(26).fill(0); // letter counts of the current window in s2
      for (let i = 0; i < s1.length; i++) { //@init
        need[letterIndex(s1[i])]++;
        window[letterIndex(s2[i])]++;
      }
      // matches = how many of the 26 letters have the same count in both.
      let matches = 0;
      for (let k = 0; k < 26; k++) { //@matches
        if (need[k] === window[k]) matches++;
      }
      for (let right = s1.length; right < s2.length; right++) {
        if (matches === 26) return true; //@check
        // Add s2[right] to the window.
        const added = letterIndex(s2[right]);
        window[added]++; //@add
        if (window[added] === need[added]) matches++;
        else if (window[added] === need[added] + 1) matches--;
        // Remove the letter that just left the window.
        const removed = letterIndex(s2[right - s1.length]);
        window[removed]--; //@drop
        if (window[removed] === need[removed]) matches++;
        else if (window[removed] === need[removed] - 1) matches--;
      }
      return matches === 26; //@ret
    }
  `),
  run({ s1, s2 }, t) {
    const m = s1.length;
    if (m > s2.length) {
      t.step("init", "s1 is longer than s2: impossible.");
      return false;
    }
    const a = new Array(26).fill(0),
      b = new Array(26).fill(0),
      idx = (c: string) => c.charCodeAt(0) - 97;
    for (let i = 0; i < m; i++) {
      a[idx(s1[i])]++;
      b[idx(s2[i])]++;
    }
    // Only show letters that appear in either string.
    const letters = [...new Set([...s1, ...s2])].sort();
    let matches = 0;
    const view = (l: number, hi?: string, ok = false) => [
      vars({ matches }),
      arr("s2", [...s2], { window: [l, l + m - 1], tones: ok ? tones(...Array.from({ length: m }, (_, k) => [l + k, "success"] as [number, Tone])) : {} }),
      arr("need (s1)", letters.map((c) => a[idx(c)]), { indexLabels: letters }),
      arr("window", letters.map((c) => b[idx(c)]), {
        indexLabels: letters,
        tones: tones(...letters.map((c, k) => [k, a[idx(c)] === b[idx(c)] ? "success" : "danger"] as [number, Tone]), [hi ? letters.indexOf(hi) : null, "active"]),
      }),
    ];
    t.step("init", `Count s1 and the first window "${s2.slice(0, m)}".`, view(0));
    for (let k = 0; k < 26; k++) if (a[k] === b[k]) matches++;
    t.step("matches", `${matches} of 26 letters have equal counts.`, view(0));
    for (let r = m; r < s2.length; r++) {
      const l = r - m;
      if (matches === 26) {
        t.step("check", "All 26 letters match: this window is a permutation.", view(l, undefined, true));
        return true;
      }
      t.step("check", `matches = ${matches}, not 26. Slide.`, view(l));
      const add = idx(s2[r]),
        drop = idx(s2[l]);
      b[add]++;
      if (b[add] === a[add]) matches++;
      else if (b[add] === a[add] + 1) matches--;
      t.step("add", `Add '${s2[r]}' on the right.`, view(l + 1, s2[r]));
      b[drop]--;
      if (b[drop] === a[drop]) matches++;
      else if (b[drop] === a[drop] - 1) matches--;
      t.step("drop", `Drop '${s2[l]}' from the left.`, view(l + 1, s2[l]));
    }
    const ok = matches === 26;
    t.step("ret", ok ? "The last window matches." : "No window matched.", view(s2.length - m, undefined, ok));
    return ok;
  },
});

export default defineProblem<Input>({
  description: "Given strings s1 and s2 of lowercase letters, return true if s2 contains a permutation of s1 as a contiguous substring.",
  input: { default: 's1 = "ab", s2 = "eidbaooo"', parse: (a) => ({ s1: a.str("s1"), s2: a.str("s2") }) },
  examples: [
    { input: 's1 = "ab", s2 = "eidbaooo"', output: true },
    { input: 's1 = "ab", s2 = "eidboaoo"', output: false },
    { input: 's1 = "adc", s2 = "dcda"', output: true },
  ],
  solutions: [sortWindows, sliding],
});

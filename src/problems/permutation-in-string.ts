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
  code: code(`
    function checkInclusion(s1: string, s2: string): boolean {
      const key = [...s1].sort().join(""); //@key
      for (let i = 0; i + s1.length <= s2.length; i++) { //@window
        if ([...s2.slice(i, i + s1.length)].sort().join("") === key) return true; //@found
      }
      return false; //@none
    }
  `),
  run({ s1, s2 }, t) {
    const key = [...s1].sort().join("");
    const m = s1.length;
    t.step("key", `Sorted s1 = "${key}".`, [vars({ key }), arr("s2", [...s2])]);
    for (let i = 0; i + m <= s2.length; i++) {
      const w = [...s2.slice(i, i + m)].sort().join("");
      const hit = w === key;
      const view = [vars({ key, window: w }), arr("s2", [...s2], { window: [i, i + m - 1], tones: hit ? tones(...Array.from({ length: m }, (_, k) => [i + k, "success"] as [number, Tone])) : {} })];
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
  code: code(`
    function checkInclusion(s1: string, s2: string): boolean {
      if (s1.length > s2.length) return false;
      const a = new Array(26).fill(0), b = new Array(26).fill(0), idx = (c: string) => c.charCodeAt(0) - 97;
      for (let i = 0; i < s1.length; i++) { a[idx(s1[i])]++; b[idx(s2[i])]++; } //@init
      let matches = 0;
      for (let k = 0; k < 26; k++) if (a[k] === b[k]) matches++; //@matches
      for (let r = s1.length; r < s2.length; r++) {
        if (matches === 26) return true; //@check
        const add = idx(s2[r]), drop = idx(s2[r - s1.length]);
        b[add]++; if (b[add] === a[add]) matches++; else if (b[add] === a[add] + 1) matches--; //@add
        b[drop]--; if (b[drop] === a[drop]) matches++; else if (b[drop] === a[drop] - 1) matches--; //@drop
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

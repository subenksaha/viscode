import { arr, map, range, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  s: string;
  p: string;
}

const sortEach = defineSolution<Input>({
  id: "sort-each-window",
  name: "Sort Every Window",
  time: "O(n · m log m)",
  space: "O(m)",
  idea: "Sort p once. For every window of length |p| in s, sort it and compare with sorted p.",
  code: code(`
    function findAnagrams(s: string, p: string): number[] {
      const sortLetters = (word: string) => word.split("").sort().join("");
      const target = sortLetters(p); //@key
      const result: number[] = [];
      for (let start = 0; start + p.length <= s.length; start++) { //@window
        const window = s.slice(start, start + p.length);
        if (sortLetters(window) === target) result.push(start); //@match
      }
      return result; //@ret
    }
  `),
  run({ s, p }, t) {
    const key = [...p].sort().join(""),
      res: number[] = [];
    t.step("key", `Sorted p = "${key}".`, [vars({ target: key })]);
    for (let i = 0; i + p.length <= s.length; i++) {
      const w = [...s.slice(i, i + p.length)].sort().join("");
      const hit = w === key;
      if (hit) res.push(i);
      t.step(hit ? "match" : "window", hit ? `"${w}" = "${key}". Record ${i}.` : `Window sorts to "${w}" ≠ "${key}".`, () => [
        vars({ target: key, sorted: w }),
        arr("s", [...s], { tones: tones(...range(i, i + p.length - 1, hit ? "success" : "window")), window: [i, i + p.length - 1] }),
        arr("result", res, { indexLabels: false }),
      ]);
    }
    t.step("ret", `Return [${res}].`, [arr("result", res, { indexLabels: false })]);
    return res;
  },
});

const sliding = defineSolution<Input>({
  id: "sliding-window",
  name: "Fixed Sliding Window with Counts",
  time: "O(n)",
  space: "O(1)",
  idea: "Keep the letter counts of p minus the counts of the current window, and how many letters are still unbalanced. Sliding adds one letter on the right and removes one on the left; when nothing is unbalanced, the window is an anagram.",
  code: code(`
    function findAnagrams(s: string, p: string): number[] {
      // need[letter] = (count in p) - (count in window). All zero means anagram.
      const need = new Map<string, number>();
      for (const letter of p) need.set(letter, (need.get(letter) ?? 0) + 1);
      let unbalanced = need.size; // letters whose need is not zero //@init
      const result: number[] = [];

      function changeNeed(letter: string, amount: number) {
        const before = need.get(letter) ?? 0;
        const after = before + amount;
        need.set(letter, after);
        if (before === 0) unbalanced++; // was balanced, isn't anymore
        else if (after === 0) unbalanced--; // just became balanced
      }

      for (let right = 0; right < s.length; right++) {
        changeNeed(s[right], -1); // s[right] enters the window //@add
        if (right >= p.length) {
          changeNeed(s[right - p.length], +1); // the leftmost letter leaves //@drop
        }
        if (unbalanced === 0) result.push(right - p.length + 1); //@match
      }
      return result; //@ret
    }
  `),
  run({ s, p }, t) {
    const need = new Map<string, number>();
    for (const c of p) need.set(c, (need.get(c) ?? 0) + 1);
    let off = need.size;
    const res: number[] = [];
    const bump = (c: string, d: number) => {
      const before = need.get(c) ?? 0,
        after = before + d;
      need.set(c, after);
      if (before === 0) off++;
      else if (after === 0) off--;
    };
    const view = (r: number, key?: string, hit = false) => {
      const lo = Math.max(0, r - p.length + 1);
      return [
        vars({ unbalanced: off }),
        arr("s", [...s], { tones: tones(...(r >= 0 ? range(lo, r, hit ? "success" : "window") : [])), window: r >= 0 ? [lo, r] : null, pointers: { right: r >= 0 ? r : null } }),
        map("need (p count − window count)", need, tones(...[...need].map(([k, v]) => [k, v === 0 ? "success" : "muted"] as [string, "success" | "muted"]), [key, "active"])),
        arr("result", res, { indexLabels: false }),
      ];
    };
    t.step("init", `Count p. ${off} distinct letter(s) unbalanced.`, view(-1));
    for (let r = 0; r < s.length; r++) {
      bump(s[r], -1);
      t.step("add", `Add '${s[r]}' on the right.`, () => view(r, s[r]));
      if (r >= p.length) {
        const out = s[r - p.length];
        bump(out, +1);
        t.step("drop", `Drop '${out}' from the left.`, () => view(r, out));
      }
      if (off === 0) {
        res.push(r - p.length + 1);
        t.step("match", `Everything balances. Anagram at ${r - p.length + 1}.`, () => view(r, undefined, true));
      }
    }
    t.step("ret", `Return [${res}].`, view(s.length - 1));
    return res;
  },
});

export default defineProblem<Input>({
  description: "Given strings s and p, return the start indices of every substring of s that is an anagram of p, in any order.",
  input: { default: 's = "cbaebabacd", p = "abc"', parse: (a) => ({ s: a.str("s"), p: a.str("p") }) },
  examples: [
    { input: 's = "cbaebabacd", p = "abc"', output: [0, 6] },
    { input: 's = "abab", p = "ab"', output: [0, 1, 2] },
    { input: 's = "a", p = "ab"', output: [] },
  ],
  solutions: [sortEach, sliding],
});

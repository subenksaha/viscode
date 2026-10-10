import { arr, map, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  s: string;
}

const counts = defineSolution<Input>({
  id: "count-pairs",
  name: "Count Pairs",
  time: "O(n)",
  space: "O(1)",
  idea: "A palindrome uses letters in mirrored pairs, plus at most one odd letter in the middle. Take every pair you can, then add 1 if any letter is left over.",
  code: code(`
    function longestPalindrome(s: string): number {
      const count = new Map<string, number>();
      for (const c of s) count.set(c, (count.get(c) ?? 0) + 1); //@count
      let len = 0, odd = false; //@init
      for (const n of count.values()) { //@loop
        len += n - (n % 2); //@pairs
        if (n % 2) odd = true; //@odd
      }
      return len + (odd ? 1 : 0); //@ret
    }
  `),
  run({ s }, t) {
    const count = new Map<string, number>();
    for (const c of s) count.set(c, (count.get(c) ?? 0) + 1);
    let len = 0,
      odd = false;
    const view = (key?: string) => [vars({ len, odd }), map("count", count, tones([key, "active"]))];
    t.step("count", "Count every character.", view());
    t.step("init", "len = 0, no odd count seen yet.", view());
    for (const [c, n] of count) {
      len += n - (n % 2);
      t.step("pairs", `'${c}' × ${n}: use ${n - (n % 2)} as pairs.`, view(c));
      if (n % 2) {
        odd = true;
        t.step("odd", `'${c}' has one left over: it could sit in the middle.`, view(c));
      }
    }
    const res = len + (odd ? 1 : 0);
    t.step("ret", odd ? `${len} + 1 middle letter = ${res}.` : `No leftovers. Return ${res}.`, view());
    return res;
  },
});

const toggleSet = defineSolution<Input>({
  id: "toggle-set",
  name: "Toggle Set",
  time: "O(n)",
  space: "O(1)",
  idea: "Walk the string, keeping the set of characters seen an odd number of times. Seeing one already in the set completes a pair (+2).",
  code: code(`
    function longestPalindrome(s: string): number {
      const open = new Set<string>(); //@init
      let len = 0;
      for (const c of s) { //@loop
        if (open.has(c)) { open.delete(c); len += 2; } //@pair
        else open.add(c); //@open
      }
      return len + (open.size ? 1 : 0); //@ret
    }
  `),
  run({ s }, t) {
    const open = new Set<string>();
    let len = 0;
    const view = (i?: number, key?: string) => [
      vars({ len }),
      arr("s", [...s], { tones: tones([i, "active"]), pointers: { i } }),
      map("unpaired", open, tones([key, "compare"])),
    ];
    t.step("init", "No unpaired characters yet.", view());
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (open.has(c)) {
        open.delete(c);
        len += 2;
        t.step("pair", `'${c}' completes a pair. len = ${len}.`, view(i));
      } else {
        open.add(c);
        t.step("open", `'${c}' is waiting for a partner.`, view(i, c));
      }
    }
    const res = len + (open.size ? 1 : 0);
    t.step("ret", open.size ? `${len} + one leftover in the middle = ${res}.` : `Return ${res}.`, view());
    return res;
  },
});

export default defineProblem<Input>({
  description: "Given a string s of upper- and lowercase letters, return the length of the longest palindrome that can be built from its letters (case-sensitive).",
  input: { default: 's = "abccccdd"', parse: (a) => ({ s: a.str("s") }) },
  examples: [
    { input: 's = "abccccdd"', output: 7 },
    { input: 's = "a"', output: 1 },
    { input: 's = "Aa"', output: 1 },
  ],
  solutions: [counts, toggleSet],
});

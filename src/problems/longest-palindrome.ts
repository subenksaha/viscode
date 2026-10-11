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
  approach: [
    {
      title: "Count characters",
      detail: "A palindrome is pairs mirrored around an optional middle letter.",
      at: "count",
    },
    {
      title: "Use all pairs",
      detail: "Each pair of a letter can go on both sides: add 2·⌊count / 2⌋.",
      at: "pairs",
      nth: 2,
    },
    {
      title: "Note leftovers",
      detail: "A letter with an odd count has one spare.",
      at: "odd",
    },
    {
      title: "One spare in the middle",
      detail: "If any letter is left over, it can sit in the center: +1.",
      at: "ret",
    },
  ],
  code: code(`
    function longestPalindrome(s: string): number {
      const count = new Map<string, number>();
      for (const char of s) count.set(char, (count.get(char) ?? 0) + 1); //@count
      let length = 0; //@init
      let hasOddCount = false;
      for (const times of count.values()) { //@loop
        const pairs = Math.floor(times / 2);
        length += pairs * 2; // pairs go on both sides //@pairs
        if (times % 2 === 1) hasOddCount = true; //@odd
      }
      // One leftover letter can sit in the middle.
      return hasOddCount ? length + 1 : length; //@ret
    }
  `),
  run({ s }, t) {
    const count = new Map<string, number>();
    for (const c of s) count.set(c, (count.get(c) ?? 0) + 1);
    let len = 0,
      odd = false;
    const view = (key?: string) => [vars({ length: len, hasOddCount: odd }), map("count", count, tones([key, "active"]))];
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
  approach: [
    {
      title: "Unpaired set",
      detail: "Track characters seen an odd number of times.",
      at: "init",
    },
    {
      title: "Open a pair",
      detail: "A first sighting waits for a partner.",
      at: "open",
    },
    {
      title: "Close a pair",
      detail: "A second sighting completes a pair, so add 2 and remove it from the set.",
      at: "pair",
    },
    {
      title: "Middle letter",
      detail: "Any leftover unpaired character can sit in the center.",
      at: "ret",
    },
  ],
  code: code(`
    function longestPalindrome(s: string): number {
      const unpaired = new Set<string>(); //@init
      let length = 0;
      for (const char of s) { //@loop
        if (unpaired.has(char)) {
          unpaired.delete(char); //@pair
          length += 2;
        } else {
          unpaired.add(char); //@open
        }
      }
      // One leftover letter can sit in the middle.
      return unpaired.size > 0 ? length + 1 : length; //@ret
    }
  `),
  run({ s }, t) {
    const open = new Set<string>();
    let len = 0;
    const view = (i?: number, key?: string) => [
      vars({ length: len }),
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

import { arr, map, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  s: string;
  t: string;
}

const sorting = defineSolution<Input>({
  id: "sort",
  name: "Sort Both",
  time: "O(n log n)",
  space: "O(n)",
  idea: "Anagrams have the same letters, so sorted they are identical.",
  code: code(`
    function isAnagram(s: string, t: string): boolean {
      if (s.length !== t.length) return false; //@len
      const sortedS = s.split("").sort(); //@sort
      const sortedT = t.split("").sort();
      for (let i = 0; i < sortedS.length; i++) { //@cmp
        if (sortedS[i] !== sortedT[i]) return false;
      }
      return true; //@ret
    }
  `),
  run({ s, t: u }, t) {
    if (s.length !== u.length) {
      t.step("len", "Different lengths. Return false.", [arr("s", [...s]), arr("t", [...u])]);
      return false;
    }
    const a = [...s].sort(),
      b = [...u].sort();
    t.step("sort", "Sort both strings.", [arr("sorted s", a), arr("sorted t", b)]);
    for (let i = 0; i < a.length; i++) {
      const ok = a[i] === b[i];
      t.step("cmp", ok ? `'${a[i]}' = '${b[i]}'.` : `'${a[i]}' ≠ '${b[i]}'. Return false.`, [arr("sorted s", a, { tones: tones([i, ok ? "success" : "danger"]) }), arr("sorted t", b, { tones: tones([i, ok ? "success" : "danger"]) })]);
      if (!ok) return false;
    }
    t.step("ret", "Identical. Return true.", [arr("sorted s", a), arr("sorted t", b)]);
    return true;
  },
});

const hashMap = defineSolution<Input>({
  id: "hash-map",
  name: "Count with a Hash Map",
  time: "O(n)",
  space: "O(k)",
  idea: "Count letters of s up and letters of t down. Every count must end at zero.",
  code: code(`
    function isAnagram(s: string, t: string): boolean {
      if (s.length !== t.length) return false; //@len
      const count = new Map<string, number>();
      for (const letter of s) count.set(letter, (count.get(letter) ?? 0) + 1); //@up
      for (const letter of t) { //@down
        const available = count.get(letter) ?? 0;
        if (available === 0) return false; //@fail
        count.set(letter, available - 1);
      }
      return true; //@ret
    }
  `),
  run({ s, t: u }, t) {
    if (s.length !== u.length) {
      t.step("len", "Different lengths. Return false.");
      return false;
    }
    const count = new Map<string, number>();
    [...s].forEach((ch, i) => {
      count.set(ch, (count.get(ch) ?? 0) + 1);
      t.step("up", `+1 for '${ch}'.`, [arr("s", [...s], { tones: tones([i, "active"]) }), map("count", count, tones([ch, "compare"]))]);
    });
    for (let i = 0; i < u.length; i++) {
      const ch = u[i];
      if (!count.get(ch)) {
        t.step("fail", `'${ch}' has no count left. Return false.`, [arr("t", [...u], { tones: tones([i, "danger"]) }), map("count", count, tones([ch, "danger"]))]);
        return false;
      }
      count.set(ch, count.get(ch)! - 1);
      t.step("down", `−1 for '${ch}'.`, [arr("t", [...u], { tones: tones([i, "active"]) }), map("count", count, tones([ch, "compare"]))]);
    }
    t.step("ret", "Every count is back to 0. Return true.", [map("count", count)]);
    return true;
  },
});

const fixedArray = defineSolution<Input>({
  id: "counter-array",
  name: "26-slot Counter Array",
  time: "O(n)",
  space: "O(1)",
  idea: "For lowercase letters, a fixed array of 26 counters does the same job as a map. Increment for s and decrement for t in the same loop.",
  code: code(`
    function isAnagram(s: string, t: string): boolean {
      if (s.length !== t.length) return false; //@len
      const letterIndex = (letter: string) => letter.charCodeAt(0) - "a".charCodeAt(0);
      // +1 for each letter in s, -1 for each letter in t. Anagrams cancel out to all zeros.
      const balance = new Array(26).fill(0);
      for (let i = 0; i < s.length; i++) { //@loop
        balance[letterIndex(s[i])]++;
        balance[letterIndex(t[i])]--;
      }
      return balance.every((value) => value === 0); //@ret
    }
  `),
  run({ s, t: u }, t) {
    if (s.length !== u.length) {
      t.step("len", "Different lengths. Return false.");
      return false;
    }
    const cnt = new Array(26).fill(0);
    const letters = [..."abcdefghijklmnopqrstuvwxyz"];
    const used = new Set([...s, ...u].map((c) => c.charCodeAt(0) - 97));
    const view = (a?: number, b?: number) => [
      arr("counts (letters that appear)", [...used].sort((x, y) => x - y).map((i) => cnt[i]), {
        indexLabels: [...used].sort((x, y) => x - y).map((i) => letters[i] ?? "?"),
        tones: tones(...[...used].sort((x, y) => x - y).map((i, k) => [i === a ? k : i === b ? k : null, i === a ? "active" : "compare"] as [number | null, "active" | "compare"])),
      }),
    ];
    for (let i = 0; i < s.length; i++) {
      const a = s.charCodeAt(i) - 97,
        b = u.charCodeAt(i) - 97;
      cnt[a]++;
      cnt[b]--;
      t.step("loop", `+1 '${s[i]}', −1 '${u[i]}'.`, [vars({ i }), ...view(a, b)]);
    }
    const ok = cnt.every((c) => c === 0);
    t.step("ret", ok ? "All zero. Return true." : "Some count is not zero. Return false.", view());
    return ok;
  },
});

export default defineProblem<Input>({
  description: "Return true if t is an anagram of s, i.e. uses exactly the same letters the same number of times.",
  input: { default: 's = "anagram", t = "nagaram"', parse: (a) => ({ s: a.str("s"), t: a.str("t") }) },
  examples: [
    { input: 's = "anagram", t = "nagaram"', output: true },
    { input: 's = "rat", t = "car"', output: false },
  ],
  solutions: [sorting, hashMap, fixedArray],
});

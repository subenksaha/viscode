import { arr, map, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  s: string;
}

const memo = defineSolution<Input>({
  id: "memo",
  name: "Top-down on (index, open count)",
  time: "O(n²)",
  space: "O(n²)",
  idea: "canBeValid(i, open): can s[i..] finish with open unmatched '('? A '*' branches three ways: '(' , ')' or nothing. open must never go negative.",
  code: code(`
    function checkValidString(s: string): boolean {
      const memo = new Map<string, boolean>();
      // Can s[i..] be valid if open "(" are still waiting to be closed?
      function canBeValid(i: number, open: number): boolean {
        if (open < 0) return false; //@neg
        if (i === s.length) return open === 0; //@end
        const key = i + "," + open;
        if (memo.has(key)) return memo.get(key)!; //@hit
        const char = s[i];
        let result: boolean;
        if (char === "(") { //@branch
          result = canBeValid(i + 1, open + 1);
        } else if (char === ")") {
          result = canBeValid(i + 1, open - 1);
        } else {
          // "*" can be "(", ")" or nothing.
          result = canBeValid(i + 1, open + 1) || canBeValid(i + 1, open - 1) || canBeValid(i + 1, open);
        }
        memo.set(key, result);
        return result;
      }
      return canBeValid(0, 0); //@ret
    }
  `),
  run({ s }, t) {
    const memo = new Map<string, boolean>();
    const view = (i: number, open: number, key?: string) => [
      vars({ open }),
      arr("s", [...s], { tones: tones([i, "active"]), pointers: { i: i < s.length ? i : null } }),
      map("memo (i,open → ok)", memo, tones([key, memo.get(key ?? "") ? "success" : "danger"])),
    ];
    const ok = (i: number, open: number): boolean => {
      if (open < 0) {
        t.step("neg", "More ')' than '(' so far: dead branch.", () => view(i, open));
        return false;
      }
      if (i === s.length) {
        t.step("end", open === 0 ? "End with everything matched." : `End with ${open} unmatched '('.`, () => view(i, open));
        return open === 0;
      }
      const key = `${i},${open}`;
      if (memo.has(key)) {
        t.step("hit", `(${key}) cached = ${memo.get(key)}.`, () => view(i, open, key));
        return memo.get(key)!;
      }
      const c = s[i];
      t.step("branch", c === "*" ? "'*': try '(' , ')' and empty." : `'${c}'.`, () => view(i, open));
      const res = c === "(" ? ok(i + 1, open + 1) : c === ")" ? ok(i + 1, open - 1) : ok(i + 1, open + 1) || ok(i + 1, open - 1) || ok(i + 1, open);
      memo.set(key, res);
      return res;
    };
    const res = ok(0, 0);
    t.step("ret", `Return ${res}.`, view(0, 0, "0,0"));
    return res;
  },
});

const range = defineSolution<Input>({
  id: "greedy-range",
  name: "Greedy Range of Open Counts",
  time: "O(n)",
  space: "O(1)",
  idea: "Track the smallest and largest possible number of unmatched '(' so far. '(' raises both, ')' lowers both, '*' widens the range by one each way. Fail if max < 0; clamp min at 0; succeed if min ends at 0.",
  code: code(`
    function checkValidString(s: string): boolean {
      // Track the smallest and largest number of unclosed "(" we could have.
      let minOpen = 0; //@init
      let maxOpen = 0;
      for (const char of s) {
        if (char === "(") {
          minOpen++;
          maxOpen++;
        } else if (char === ")") {
          minOpen--;
          maxOpen--;
        } else { //@update
          minOpen--; // treat "*" as ")"
          maxOpen++; // or as "("
        }
        if (maxOpen < 0) return false; // too many ")" no matter what //@fail
        minOpen = Math.max(minOpen, 0); //@clamp
      }
      return minOpen === 0; //@ret
    }
  `),
  run({ s }, t) {
    let lo = 0,
      hi = 0;
    const view = (i?: number, tone: Tone = "active") => [vars({ minOpen: lo, maxOpen: hi }), arr("s", [...s], { tones: tones([i, tone]), pointers: { i } })];
    t.step("init", "No open parentheses yet: range [0, 0].", view());
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c === "(") {
        lo++;
        hi++;
      } else if (c === ")") {
        lo--;
        hi--;
      } else {
        lo--;
        hi++;
      }
      t.step("update", c === "*" ? `'*' could be ')' , empty or '(': range widens to [${lo}, ${hi}].` : `'${c}': range is [${lo}, ${hi}].`, view(i));
      if (hi < 0) {
        t.step("fail", "Even treating every '*' as '(' leaves too many ')'. Invalid.", view(i, "danger"));
        return false;
      }
      if (lo < 0) {
        lo = 0;
        t.step("clamp", "Can't have a negative count: clamp minOpen to 0.", view(i));
      }
    }
    const res = lo === 0;
    t.step("ret", res ? "0 open is achievable: valid." : `At least ${lo} '(' stay open: invalid.`, view(undefined, res ? "success" : "danger"));
    return res;
  },
});

export default defineProblem<Input>({
  description: "Given a string of '(', ')' and '*', return true if it can be valid, where each '*' may be treated as '(', ')' or an empty string.",
  input: { default: 's = "(*))"', parse: (a) => ({ s: a.str("s") }) },
  examples: [
    { input: 's = "()"', output: true },
    { input: 's = "(*)"', output: true },
    { input: 's = "(*))"', output: true },
    { input: 's = "((*"', output: false },
  ],
  solutions: [memo, range],
});

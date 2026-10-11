import { arr, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  digits: string;
}

const KEYS: Record<string, string> = { 2: "abc", 3: "def", 4: "ghi", 5: "jkl", 6: "mno", 7: "pqrs", 8: "tuv", 9: "wxyz" };

const iterative = defineSolution<Input>({
  id: "iterative",
  name: "Iterative Expansion",
  time: "O(4ⁿ · n)",
  space: "O(4ⁿ · n)",
  idea: "Start with [\"\"]. For each digit, replace the list with every existing prefix extended by each of the digit's letters.",
  code: code(`
    function letterCombinations(digits: string): string[] {
      if (digits.length === 0) return []; //@empty
      const lettersOf = ["", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"];
      let combinations = [""]; //@init
      for (const digit of digits) { //@digit
        const next: string[] = [];
        for (const prefix of combinations) { //@expand
          for (const letter of lettersOf[Number(digit)]) {
            next.push(prefix + letter);
          }
        }
        combinations = next;
      }
      return combinations; //@ret
    }
  `),
  run({ digits }, t) {
    if (!digits) {
      t.step("empty", "No digits: no combinations.");
      return [];
    }
    let res = [""];
    t.step("init", 'Start with one empty prefix.', [arr("res", res.map((r) => `"${r}"`), { indexLabels: false })]);
    [...digits].forEach((d, i) => {
      t.step("digit", `Digit ${d} → "${KEYS[d]}".`, [arr("digits", [...digits], { tones: tones([i, "active"]) }), arr("res", res, { indexLabels: false })]);
      res = res.flatMap((prefix) => [...KEYS[d]].map((c) => prefix + c));
      t.step("expand", `Extend each prefix with ${[...KEYS[d]].join(", ")}: ${res.length} strings.`, [arr("digits", [...digits], { tones: tones([i, "active"]) }), arr("res", res, { indexLabels: false })]);
    });
    t.step("ret", `Return ${res.length} combinations.`, [arr("res", res, { indexLabels: false })]);
    return res;
  },
});

const backtrack = defineSolution<Input>({
  id: "backtracking",
  name: "Backtracking",
  time: "O(4ⁿ · n)",
  space: "O(n)",
  idea: "Pick a letter for the current digit, recurse on the next digit, then undo. When every digit has a letter, record the string.",
  code: code(`
    function letterCombinations(digits: string): string[] {
      if (digits.length === 0) return []; //@empty
      const lettersOf = ["", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"];
      const result: string[] = [];
      const path: string[] = [];
      function build(i: number) {
        if (i === digits.length) { //@found
          result.push(path.join(""));
          return;
        }
        for (const letter of lettersOf[Number(digits[i])]) { //@try
          path.push(letter); //@choose
          build(i + 1);
          path.pop(); //@undo
        }
      }
      build(0);
      return result; //@ret
    }
  `),
  run({ digits }, t) {
    if (!digits) {
      t.step("empty", "No digits: no combinations.");
      return [];
    }
    const res: string[] = [],
      path: string[] = [];
    const view = (i: number, c?: string) => [
      vars({ path: path.join(""), letter: c }),
      arr("digits", [...digits], { tones: tones([i < digits.length ? i : null, "active"]), pointers: { i: i < digits.length ? i : null } }),
      arr("results", res, { indexLabels: false, tones: tones([res.length - 1, "success"]) }),
    ];
    const dfs = (i: number) => {
      if (i === digits.length) {
        res.push(path.join(""));
        t.step("found", `Record "${res.at(-1)}".`, () => view(i));
        return;
      }
      for (const c of KEYS[digits[i]]) {
        path.push(c);
        t.step("choose", `Digit ${digits[i]} → '${c}'.`, () => view(i, c));
        dfs(i + 1);
        path.pop();
        t.step("undo", `Undo '${c}'.`, () => view(i, c));
      }
    };
    dfs(0);
    t.step("ret", `Return ${res.length} combinations.`, view(digits.length));
    return res;
  },
});

export default defineProblem<Input>({
  description: "Given a string of digits 2–9, return all letter combinations the number could represent on a phone keypad, in any order.",
  input: {
    default: 'digits = "23"',
    parse: (a) => {
      const digits = a.str("digits");
      if (!/^[2-9]*$/.test(digits)) throw new Error("digits may only contain 2-9");
      return { digits };
    },
  },
  examples: [
    { input: 'digits = "23"', output: ["ad", "ae", "af", "bd", "be", "bf", "cd", "ce", "cf"] },
    { input: 'digits = ""', output: [] },
    { input: 'digits = "2"', output: ["a", "b", "c"] },
  ],
  normalize: (v) => [...(v as string[])].sort(),
  solutions: [iterative, backtrack],
});

import { arr, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  n: number;
}

const bruteForce = defineSolution<Input>({
  id: "brute-force",
  name: "Generate All, Then Filter",
  time: "O(2²ⁿ · n)",
  space: "O(n)",
  idea: "Build every string of 2n parentheses and keep the ones whose running balance never drops below zero and ends at zero.",
  approach: [
    {
      title: "Branch on both characters",
      detail: "Generate all 2²ⁿ strings of '(' and ')'.",
      at: "branch",
    },
    {
      title: "Validate full strings",
      detail: "Track the balance. It must never go negative and must end at 0.",
      at: "full",
    },
    {
      title: "Keep valid ones",
      detail: "Only 5 of 64 survive for n = 3. Lots of wasted work.",
      at: "keep",
    },
  ],
  code: code(`
    function generateParenthesis(n: number): string[] {
      const result: string[] = [];
      function isValid(s: string): boolean {
        let balance = 0;
        for (const char of s) {
          balance += char === "(" ? 1 : -1;
          if (balance < 0) return false; // a ")" with no matching "("
        }
        return balance === 0;
      }
      function build(current: string) {
        if (current.length === 2 * n) { //@full
          if (isValid(current)) result.push(current); //@keep
          return;
        }
        build(current + "("); //@branch
        build(current + ")");
      }
      build("");
      return result; //@ret
    }
  `),
  run({ n }, t) {
    const res: string[] = [];
    const valid = (s: string) => {
      let bal = 0;
      for (const c of s) if ((bal += c === "(" ? 1 : -1) < 0) return false;
      return bal === 0;
    };
    const view = (s: string) => [vars({ current: `"${s}"` }), arr("result", res, { indexLabels: false, tones: tones([res.length - 1, "success"]) })];
    const build = (s: string) => {
      if (s.length === 2 * n) {
        if (valid(s)) {
          res.push(s);
          t.step("keep", `"${s}" is balanced. Keep it.`, () => view(s));
        } else t.step("full", `"${s}" is not balanced. Discard.`, () => view(s));
        return;
      }
      build(s + "(");
      build(s + ")");
    };
    t.step("branch", `Try all ${2 ** (2 * n)} strings of length ${2 * n}.`, view(""));
    build("");
    t.step("ret", `${res.length} valid strings.`, view(""));
    return res;
  },
});

const backtrack = defineSolution<Input>({
  id: "backtracking",
  name: "Backtracking with Open/Close Counts",
  time: "O(4ⁿ / √n)",
  space: "O(n)",
  idea: "Only build valid prefixes: add '(' while fewer than n are open, and add ')' only when it would close an open one.",
  approach: [
    {
      title: "Add '(' if any remain",
      detail: "At most n opens.",
      at: "open",
    },
    {
      title: "Add ')' only to close an open",
      detail: "close < open guarantees the prefix stays valid.",
      at: "close",
    },
    {
      title: "Record complete strings",
      detail: "Every leaf is valid by construction. The count is the Catalan number.",
      at: "done",
    },
  ],
  code: code(`
    function generateParenthesis(n: number): string[] {
      const result: string[] = [];
      const path: string[] = [];
      function build(open: number, close: number) {
        if (path.length === 2 * n) { //@done
          result.push(path.join(""));
          return;
        }
        if (open < n) { //@open
          path.push("(");
          build(open + 1, close);
          path.pop();
        }
        if (close < open) { //@close
          path.push(")");
          build(open, close + 1);
          path.pop();
        }
      }
      build(0, 0);
      return result; //@ret
    }
  `),
  run({ n }, t) {
    const res: string[] = [],
      path: string[] = [];
    const view = (open: number, close: number) => [
      vars({ open, close }),
      arr("path", path, { indexLabels: false, tones: tones([path.length - 1, "active"]) }),
      arr("result", res, { indexLabels: false, tones: tones([res.length - 1, "success"]) }),
    ];
    const dfs = (open: number, close: number) => {
      if (path.length === 2 * n) {
        res.push(path.join(""));
        t.step("done", `Complete: "${res.at(-1)}".`, () => view(open, close));
        return;
      }
      if (open < n) {
        path.push("(");
        t.step("open", `open ${open} < ${n}: add '('.`, () => view(open + 1, close));
        dfs(open + 1, close);
        path.pop();
      }
      if (close < open) {
        path.push(")");
        t.step("close", `close ${close} < open ${open}: add ')'.`, () => view(open, close + 1));
        dfs(open, close + 1);
        path.pop();
      }
    };
    dfs(0, 0);
    t.step("ret", `${res.length} valid strings.`, view(0, 0));
    return res;
  },
});

export default defineProblem<Input>({
  description: "Given n pairs of parentheses, generate all combinations of well-formed parentheses.",
  input: { default: "n = 3", parse: (a) => ({ n: a.int("n") }) },
  examples: [
    { input: "n = 3", output: ["((()))", "(()())", "(())()", "()(())", "()()()"] },
    { input: "n = 1", output: ["()"] },
  ],
  normalize: (v) => [...(v as string[])].sort(),
  solutions: [bruteForce, backtrack],
});

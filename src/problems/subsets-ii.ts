import { arr, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  nums: number[];
}

const fmtSets = (res: number[][]) => res.map((r) => `[${r}]`);

const dedupeSet = defineSolution<Input>({
  id: "set-dedupe",
  name: "All Subsets + Dedupe with a Set",
  time: "O(n · 2ⁿ)",
  space: "O(n · 2ⁿ)",
  idea: "Sort so equal subsets look identical, generate every subset, and keep each distinct one using a set of string keys.",
  code: code(`
    function subsetsWithDup(nums: number[]): number[][] {
      nums.sort((a, b) => a - b); //@sort
      const seen = new Set<string>(), res: number[][] = [];
      for (let mask = 0; mask < 1 << nums.length; mask++) { //@mask
        const sub = nums.filter((_, i) => mask & (1 << i));
        const key = sub.join(",");
        if (!seen.has(key)) { seen.add(key); res.push(sub); } //@keep
      }
      return res; //@ret
    }
  `),
  run({ nums }, t) {
    nums.sort((a, b) => a - b);
    t.step("sort", `Sorted: [${nums}].`, [arr("nums", nums)]);
    const seen = new Set<string>(),
      res: number[][] = [];
    for (let mask = 0; mask < 1 << nums.length; mask++) {
      const sub = nums.filter((_, i) => mask & (1 << i));
      const key = sub.join(",");
      const picked = tones(...nums.map((_, i) => [mask & (1 << i) ? i : null, "success"] as [number | null, Tone]));
      if (!seen.has(key)) {
        seen.add(key);
        res.push(sub);
        t.step("keep", `[${sub}] is new.`, () => [arr("nums", nums, { tones: picked }), arr("subsets", fmtSets(res), { indexLabels: false, tones: tones([res.length - 1, "success"]) })]);
      } else t.step("mask", `[${sub}] is a duplicate. Skip.`, () => [arr("nums", nums, { tones: picked }), arr("subsets", fmtSets(res), { indexLabels: false, tones: tones([res.findIndex((r) => r.join(",") === key), "danger"]) })]);
    }
    t.step("ret", `${res.length} distinct subsets.`, [arr("subsets", fmtSets(res), { indexLabels: false })]);
    return res;
  },
});

const backtrack = defineSolution<Input>({
  id: "backtracking",
  name: "Backtracking, Skip Equal Siblings",
  time: "O(n · 2ⁿ)",
  space: "O(n)",
  idea: "Sort, then backtrack as in Subsets. At each depth, only the first of several equal values may be chosen; picking a later copy would build the same subsets again.",
  code: code(`
    function subsetsWithDup(nums: number[]): number[][] {
      nums.sort((a, b) => a - b);
      const res: number[][] = [], path: number[] = [];
      function dfs(start: number) {
        res.push([...path]); //@record
        for (let i = start; i < nums.length; i++) {
          if (i > start && nums[i] === nums[i - 1]) continue; //@skip
          path.push(nums[i]); //@choose
          dfs(i + 1);
          path.pop(); //@undo
        }
      }
      dfs(0);
      return res; //@ret
    }
  `),
  run({ nums }, t) {
    nums.sort((a, b) => a - b);
    const res: number[][] = [],
      path: number[] = [];
    const view = (start: number, i?: number, tone: Tone = "active") => [
      vars({ path: `[${path}]` }),
      arr("nums", nums, { tones: tones(...nums.map((_, k) => [k < start ? k : null, "muted"] as [number | null, Tone]), [i, tone]), pointers: { start: start < nums.length ? start : null, i } }),
      arr("subsets", fmtSets(res), { indexLabels: false, tones: tones([res.length - 1, "success"]) }),
    ];
    const dfs = (start: number) => {
      res.push([...path]);
      t.step("record", `Record [${path}].`, () => view(start));
      for (let i = start; i < nums.length; i++) {
        if (i > start && nums[i] === nums[i - 1]) {
          t.step("skip", `${nums[i]} equals the previous sibling: skip to avoid duplicates.`, () => view(start, i, "danger"));
          continue;
        }
        path.push(nums[i]);
        t.step("choose", `Add ${nums[i]}.`, () => view(start, i));
        dfs(i + 1);
        path.pop();
        t.step("undo", `Remove ${nums[i]}.`, () => view(start, i));
      }
    };
    dfs(0);
    t.step("ret", `${res.length} distinct subsets.`, view(nums.length));
    return res;
  },
});

export default defineProblem<Input>({
  description: "Given an integer array nums that may contain duplicates, return all possible subsets (the power set) without duplicate subsets, in any order.",
  input: { default: "nums = [1,2,2]", parse: (a) => ({ nums: a.ints("nums") }) },
  examples: [
    { input: "nums = [1,2,2]", output: [[], [1], [1, 2], [1, 2, 2], [2], [2, 2]] },
    { input: "nums = [0]", output: [[], [0]] },
    { input: "nums = [4,4,4,1,4]", output: [[], [1], [1, 4], [1, 4, 4], [1, 4, 4, 4], [1, 4, 4, 4, 4], [4], [4, 4], [4, 4, 4], [4, 4, 4, 4]] },
  ],
  normalize: (v) => (v as number[][]).map((s) => [...s].sort((a, b) => a - b).join()).sort(),
  solutions: [dedupeSet, backtrack],
});

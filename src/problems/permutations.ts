import { arr, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  nums: number[];
}

const usedArray = defineSolution<Input>({
  id: "used-flags",
  name: "Backtracking with Used Flags",
  time: "O(n · n!)",
  space: "O(n)",
  idea: "Fill the permutation one slot at a time. At each slot, try every number not used yet, recurse, then undo.",
  code: code(`
    function permute(nums: number[]): number[][] {
      const res: number[][] = [], path: number[] = [], used = nums.map(() => false);
      function dfs() {
        if (path.length === nums.length) { res.push([...path]); return; } //@found
        for (let i = 0; i < nums.length; i++) { //@try
          if (used[i]) continue;
          used[i] = true; path.push(nums[i]); //@choose
          dfs();
          used[i] = false; path.pop(); //@undo
        }
      }
      dfs();
      return res; //@ret
    }
  `),
  run({ nums }, t) {
    const res: number[][] = [],
      path: number[] = [],
      used = nums.map(() => false);
    const view = (i?: number) => [
      arr("nums", nums, { tones: tones(...used.map((u, k) => [u ? k : null, "muted"] as [number | null, Tone]), [i, "active"]) }),
      arr("path", path, { indexLabels: false }),
      arr("results", res.map((r) => `[${r}]`), { indexLabels: false, tones: tones([res.length - 1, "success"]) }),
    ];
    const dfs = () => {
      if (path.length === nums.length) {
        res.push([...path]);
        t.step("found", `Full permutation [${path}].`, () => view());
        return;
      }
      for (let i = 0; i < nums.length; i++) {
        if (used[i]) continue;
        used[i] = true;
        path.push(nums[i]);
        t.step("choose", `Slot ${path.length - 1} ← ${nums[i]}.`, () => view(i));
        dfs();
        used[i] = false;
        path.pop();
        t.step("undo", `Give back ${nums[i]}.`, () => view(i));
      }
    };
    dfs();
    t.step("ret", `${res.length} permutations.`, view());
    return res;
  },
});

const swapping = defineSolution<Input>({
  id: "swap",
  name: "In-place Swapping",
  time: "O(n · n!)",
  space: "O(n)",
  idea: "Positions [0, k) are fixed. Swap each candidate from [k, n) into position k, recurse on k + 1, then swap back.",
  code: code(`
    function permute(nums: number[]): number[][] {
      const res: number[][] = [];
      function dfs(k: number) {
        if (k === nums.length) { res.push([...nums]); return; } //@found
        for (let i = k; i < nums.length; i++) { //@try
          [nums[k], nums[i]] = [nums[i], nums[k]]; //@swap
          dfs(k + 1);
          [nums[k], nums[i]] = [nums[i], nums[k]]; //@unswap
        }
      }
      dfs(0);
      return res; //@ret
    }
  `),
  run({ nums }, t) {
    const res: number[][] = [];
    const view = (k: number, i?: number) => [
      vars({ k }),
      arr("nums", nums, { tones: tones(...nums.map((_, j) => [j < k ? j : null, "success"] as [number | null, Tone]), [k < nums.length ? k : null, "active"], [i !== k ? i : null, "compare"]), pointers: { k: k < nums.length ? k : null, i } }),
      arr("results", res.map((r) => `[${r}]`), { indexLabels: false, tones: tones([res.length - 1, "success"]) }),
    ];
    const dfs = (k: number) => {
      if (k === nums.length) {
        res.push([...nums]);
        t.step("found", `All positions fixed: [${nums}].`, () => view(k));
        return;
      }
      for (let i = k; i < nums.length; i++) {
        [nums[k], nums[i]] = [nums[i], nums[k]];
        t.step("swap", i === k ? `Keep ${nums[k]} at position ${k}.` : `Swap ${nums[k]} into position ${k}.`, () => view(k, i));
        dfs(k + 1);
        [nums[k], nums[i]] = [nums[i], nums[k]];
        if (i !== k) t.step("unswap", "Swap back.", () => view(k, i));
      }
    };
    dfs(0);
    t.step("ret", `${res.length} permutations.`, view(nums.length));
    return res;
  },
});

export default defineProblem<Input>({
  description: "Given an array nums of distinct integers, return all possible permutations, in any order.",
  input: { default: "nums = [1,2,3]", parse: (a) => ({ nums: a.ints("nums") }) },
  examples: [
    { input: "nums = [1,2,3]", output: [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]] },
    { input: "nums = [0,1]", output: [[0, 1], [1, 0]] },
    { input: "nums = [1]", output: [[1]] },
  ],
  normalize: (v) => (v as number[][]).map((p) => p.join()).sort(),
  solutions: [usedArray, swapping],
});

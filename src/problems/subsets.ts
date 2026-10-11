import { arr, bits, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  nums: number[];
}

const fmtSets = (res: number[][]) => res.map((r) => `[${r}]`);

const cascade = defineSolution<Input>({
  id: "cascading",
  name: "Cascading",
  time: "O(n · 2ⁿ)",
  space: "O(n · 2ⁿ)",
  idea: "Start with just the empty set. For each number, copy every subset so far and add the number to each copy.",
  approach: [
    {
      title: "Start with []",
      detail: "The empty set is always a subset.",
      at: "init",
    },
    {
      title: "Double the list for each number",
      detail: "Every existing subset gets a copy that includes the new number. The originals are the copies without it.",
      at: "num",
      nth: 2,
    },
    {
      title: "Extend",
      detail: "After n numbers there are 2ⁿ subsets.",
      at: "extend",
    },
  ],
  code: code(`
    function subsets(nums: number[]): number[][] {
      const result: number[][] = [[]]; //@init
      for (const num of nums) { //@num
        // Every existing subset gets a copy that also includes num.
        const existingCount = result.length;
        for (let k = 0; k < existingCount; k++) { //@extend
          result.push([...result[k], num]);
        }
      }
      return result; //@ret
    }
  `),
  run({ nums }, t) {
    const res: number[][] = [[]];
    t.step("init", "Only the empty subset.", [arr("subsets", fmtSets(res), { indexLabels: false })]);
    nums.forEach((x, i) => {
      const size = res.length;
      t.step("num", `Add ${x} to copies of all ${size} subsets.`, [arr("nums", nums, { tones: tones([i, "active"]) }), arr("subsets", fmtSets(res), { indexLabels: false })]);
      for (let k = 0; k < size; k++) {
        res.push([...res[k], x]);
        t.step("extend", `[${res[k]}] + ${x} → [${res.at(-1)}].`, () => [
          arr("nums", nums, { tones: tones([i, "active"]) }),
          arr("subsets", fmtSets(res), { indexLabels: false, tones: tones([k, "compare"], [res.length - 1, "success"]) }),
        ]);
      }
    });
    t.step("ret", `${res.length} subsets.`, [arr("subsets", fmtSets(res), { indexLabels: false })]);
    return res;
  },
});

const bitmask = defineSolution<Input>({
  id: "bitmask",
  name: "Bitmask Enumeration",
  time: "O(n · 2ⁿ)",
  space: "O(n)",
  idea: "Each subset corresponds to an n-bit number: bit i says whether nums[i] is in it. Count from 0 to 2ⁿ − 1.",
  approach: [
    {
      title: "Count from 0 to 2ⁿ − 1",
      detail: "Bit i of mask decides whether nums[i] is in the subset.",
      at: "pick",
    },
    {
      title: "Every mask is a different subset",
      detail: "For example, mask 5 (binary 101) picks nums[0] and nums[2].",
      at: "pick",
      nth: 6,
    },
    {
      title: "Done",
      detail: "2ⁿ masks, n bit checks each.",
      at: "ret",
    },
  ],
  code: code(`
    function subsets(nums: number[]): number[][] {
      const result: number[][] = [];
      // Each number from 0 to 2^n - 1 picks a subset: bit i says whether nums[i] is in it.
      const totalSubsets = 2 ** nums.length;
      for (let mask = 0; mask < totalSubsets; mask++) { //@mask
        const subset: number[] = [];
        for (let i = 0; i < nums.length; i++) {
          const bitIsSet = (mask & (1 << i)) !== 0;
          if (bitIsSet) subset.push(nums[i]);
        }
        result.push(subset); //@pick
      }
      return result; //@ret
    }
  `),
  run({ nums }, t) {
    const res: number[][] = [];
    const n = nums.length;
    for (let mask = 0; mask < 1 << n; mask++) {
      const picked = nums.filter((_, i) => mask & (1 << i));
      res.push(picked);
      const bitTones: Record<number, Tone> = {};
      nums.forEach((_, i) => mask & (1 << i) && (bitTones[i] = "success"));
      t.step("pick", `mask = ${mask}: take [${picked}].`, () => [
        bits("mask (bit i ↔ nums[i])", mask, Math.max(n, 1), bitTones),
        arr("nums", nums, { tones: tones(...nums.map((_, i) => [mask & (1 << i) ? i : null, "success"] as [number | null, Tone])) }),
        arr("subsets", fmtSets(res), { indexLabels: false, tones: tones([res.length - 1, "success"]) }),
      ]);
    }
    t.step("ret", `${res.length} subsets.`, [arr("subsets", fmtSets(res), { indexLabels: false })]);
    return res;
  },
});

const backtrack = defineSolution<Input>({
  id: "backtracking",
  name: "Backtracking",
  time: "O(n · 2ⁿ)",
  space: "O(n)",
  idea: "Every path in the recursion is a subset. Record the current path, then try extending it with each later number.",
  approach: [
    {
      title: "Record at every node",
      detail: "Each recursion state, including the empty path, is a subset.",
      at: "record",
    },
    {
      title: "Extend with later numbers only",
      detail: "Starting the loop at start keeps each subset in index order, so none is generated twice.",
      at: "choose",
    },
    {
      title: "Undo",
      detail: "Pop before trying the next number.",
      at: "undo",
    },
  ],
  code: code(`
    function subsets(nums: number[]): number[][] {
      const result: number[][] = [];
      const path: number[] = [];
      function build(start: number) {
        result.push([...path]); //@record
        for (let i = start; i < nums.length; i++) { //@try
          path.push(nums[i]); //@choose
          build(i + 1);
          path.pop(); //@undo
        }
      }
      build(0);
      return result; //@ret
    }
  `),
  run({ nums }, t) {
    const res: number[][] = [],
      path: number[] = [];
    const view = (start: number, i?: number) => [
      vars({ path: `[${path}]` }),
      arr("nums", nums, { tones: tones(...nums.map((_, k) => [k < start ? k : null, "muted"] as [number | null, Tone]), [i, "active"]), pointers: { start: start < nums.length ? start : null, i } }),
      arr("subsets", fmtSets(res), { indexLabels: false, tones: tones([res.length - 1, "success"]) }),
    ];
    const dfs = (start: number) => {
      res.push([...path]);
      t.step("record", `Record [${path}].`, () => view(start));
      for (let i = start; i < nums.length; i++) {
        path.push(nums[i]);
        t.step("choose", `Add ${nums[i]}.`, () => view(start, i));
        dfs(i + 1);
        path.pop();
        t.step("undo", `Remove ${nums[i]}.`, () => view(start, i));
      }
    };
    dfs(0);
    t.step("ret", `${res.length} subsets.`, view(nums.length));
    return res;
  },
});

export default defineProblem<Input>({
  description: "Given an array of unique integers, return all possible subsets (the power set), in any order, without duplicates.",
  input: { default: "nums = [1,2,3]", parse: (a) => ({ nums: a.ints("nums") }) },
  examples: [
    { input: "nums = [1,2,3]", output: [[], [1], [2], [1, 2], [3], [1, 3], [2, 3], [1, 2, 3]] },
    { input: "nums = [0]", output: [[], [0]] },
  ],
  normalize: (v) => (v as number[][]).map((s) => [...s].sort((a, b) => a - b).join()).sort(),
  solutions: [cascade, bitmask, backtrack],
});

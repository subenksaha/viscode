import { arr, range, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tracer } from "@/core/trace";

interface Input {
  nums: number[];
}

const twoPasses = defineSolution<Input>({
  id: "two-passes",
  name: "Two Linear Passes",
  time: "O(n)",
  space: "O(1)",
  idea: "The first and last houses are neighbors, so at most one is robbed. Solve the line without the last house and the line without the first, then take the better one.",
  code: code(`
    function rob(nums: number[]): number {
      if (nums.length === 1) return nums[0]; //@single
      const line = (lo: number, hi: number) => {
        let prev2 = 0, prev1 = 0;
        for (let i = lo; i <= hi; i++) { //@loop
          [prev2, prev1] = [prev1, Math.max(prev1, prev2 + nums[i])]; //@step
        }
        return prev1; //@done
      };
      const a = line(0, nums.length - 2); //@a
      const b = line(1, nums.length - 1); //@b
      return Math.max(a, b); //@ret
    }
  `),
  run({ nums }, t) {
    if (nums.length === 1) {
      t.step("single", "Only one house.", [arr("houses", nums)]);
      return nums[0];
    }
    const line = (lo: number, hi: number, label: string, results: Record<string, unknown>) => {
      let prev2 = 0,
        prev1 = 0;
      const view = (i?: number) => [
        vars({ ...results, prev2, prev1 }),
        arr("houses (circle)", nums, {
          tones: tones(...(lo === 0 ? [[nums.length - 1, "muted"] as [number, "muted"]] : [[0, "muted"] as [number, "muted"]]), [i, "active"]),
          window: [lo, hi],
          pointers: { i },
        }),
      ];
      for (let i = lo; i <= hi; i++) {
        t.step("loop", `${label}: house ${i} (${nums[i]}).`, view(i));
        [prev2, prev1] = [prev1, Math.max(prev1, prev2 + nums[i])];
        t.step("step", `Best so far = ${prev1}.`, view(i));
      }
      t.step("done", `${label} gives ${prev1}.`, view());
      return prev1;
    };
    const a = line(0, nums.length - 2, "Without the last house", {});
    t.step("a", `a = ${a}.`, [vars({ a }), arr("houses", nums)]);
    const b = line(1, nums.length - 1, "Without the first house", { a });
    t.step("b", `b = ${b}.`, [vars({ a, b }), arr("houses", nums)]);
    const res = Math.max(a, b);
    t.step("ret", `Return max(${a}, ${b}) = ${res}.`, [vars({ a, b, answer: res })]);
    return res;
  },
});

function dpLine(nums: number[], lo: number, hi: number, t: Tracer, label: string) {
  const len = hi - lo + 1;
  const dp: (number | null)[] = new Array(len + 1).fill(null);
  dp[0] = 0;
  dp[1] = nums[lo];
  const view = (k?: number) => [
    arr("houses", nums, { tones: tones(...range(lo, hi, "window"), [k !== undefined ? lo + k - 1 : null, "active"]) }),
    arr(`dp: ${label}`, dp, { tones: tones([k, "success"]) }),
  ];
  t.step("init", `${label}: dp[0] = 0, dp[1] = ${nums[lo]}.`, view(1));
  for (let k = 2; k <= len; k++) {
    dp[k] = Math.max(dp[k - 1]!, dp[k - 2]! + nums[lo + k - 1]);
    t.step("fill", `dp[${k}] = max(${dp[k - 1]}, ${dp[k - 2]} + ${nums[lo + k - 1]}) = ${dp[k]}.`, view(k));
  }
  return dp[len]!;
}

const tables = defineSolution<Input>({
  id: "dp-tables",
  name: "Two DP Tables",
  time: "O(n)",
  space: "O(n)",
  idea: "Same split into two lines, but each line gets an explicit DP table so you can see every subproblem.",
  code: code(`
    function rob(nums: number[]): number {
      if (nums.length === 1) return nums[0]; //@single
      const line = (lo: number, hi: number) => {
        const n = hi - lo + 1, dp = new Array(n + 1).fill(0);
        dp[1] = nums[lo]; //@init
        for (let k = 2; k <= n; k++) dp[k] = Math.max(dp[k - 1], dp[k - 2] + nums[lo + k - 1]); //@fill
        return dp[n];
      };
      return Math.max(line(0, nums.length - 2), line(1, nums.length - 1)); //@ret
    }
  `),
  run({ nums }, t) {
    if (nums.length === 1) {
      t.step("single", "Only one house.", [arr("houses", nums)]);
      return nums[0];
    }
    const a = dpLine(nums, 0, nums.length - 2, t, "skip last");
    const b = dpLine(nums, 1, nums.length - 1, t, "skip first");
    const res = Math.max(a, b);
    t.step("ret", `max(${a}, ${b}) = ${res}.`, [vars({ "skip last": a, "skip first": b, answer: res })]);
    return res;
  },
});

export default defineProblem<Input>({
  description: "Same as House Robber, but the houses form a circle, so the first and last houses are neighbors.",
  input: { default: "nums = [2,3,2,5,1]", parse: (a) => ({ nums: a.ints("nums") }) },
  examples: [
    { input: "nums = [2,3,2]", output: 3 },
    { input: "nums = [1,2,3,1]", output: 4 },
    { input: "nums = [1,2,3]", output: 3 },
    { input: "nums = [5]", output: 5 },
  ],
  solutions: [tables, twoPasses],
});

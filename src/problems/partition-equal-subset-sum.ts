import { arr, map, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  nums: number[];
}

const sumSet = defineSolution<Input>({
  id: "reachable-sums",
  name: "Set of Reachable Sums",
  time: "O(n · S)",
  space: "O(S)",
  idea: "We need a subset summing to half the total. Keep the set of sums reachable so far; each number adds itself to every existing sum.",
  code: code(`
    function canPartition(nums: number[]): boolean {
      const total = nums.reduce((a, b) => a + b, 0);
      if (total % 2) return false; //@odd
      const half = total / 2;
      let sums = new Set([0]); //@init
      for (const x of nums) { //@num
        sums = new Set([...sums, ...[...sums].map((s) => s + x).filter((s) => s <= half)]); //@add
        if (sums.has(half)) return true; //@found
      }
      return false; //@ret
    }
  `),
  run({ nums }, t) {
    const total = nums.reduce((a, b) => a + b, 0);
    if (total % 2) {
      t.step("odd", `Total ${total} is odd: can't split evenly.`, [vars({ total })]);
      return false;
    }
    const half = total / 2;
    let sums = new Set([0]);
    const view = (i?: number, hit = false) => [
      vars({ total, half }),
      arr("nums", nums, { tones: tones([i, "active"]) }),
      map("reachable sums", [...sums].sort((a, b) => a - b).map((s) => [s, ""]), tones([hit ? half : null, "success"])),
    ];
    t.step("init", `Target half = ${half}. Only 0 is reachable at first.`, view());
    for (let i = 0; i < nums.length; i++) {
      const x = nums[i];
      sums = new Set([...sums, ...[...sums].map((s) => s + x).filter((s) => s <= half)]);
      t.step("add", `Add ${x} to every reachable sum.`, view(i));
      if (sums.has(half)) {
        t.step("found", `${half} is reachable. Return true.`, view(i, true));
        return true;
      }
    }
    t.step("ret", `${half} is never reached. Return false.`, view());
    return false;
  },
});

const dp = defineSolution<Input>({
  id: "dp-1d",
  name: "0/1 Knapsack DP (1D)",
  time: "O(n · S)",
  space: "O(S)",
  idea: "dp[s] says whether some subset sums to s. For each number, sweep s from high to low so each number is used at most once: dp[s] |= dp[s − x].",
  code: code(`
    function canPartition(nums: number[]): boolean {
      const total = nums.reduce((a, b) => a + b, 0);
      if (total % 2) return false; //@odd
      const half = total / 2;
      const dp = new Array(half + 1).fill(false);
      dp[0] = true; //@init
      for (const x of nums) //@num
        for (let s = half; s >= x; s--) //@sum
          if (dp[s - x]) dp[s] = true; //@set
      return dp[half]; //@ret
    }
  `),
  run({ nums }, t) {
    const total = nums.reduce((a, b) => a + b, 0);
    if (total % 2) {
      t.step("odd", `Total ${total} is odd: can't split evenly.`, [vars({ total })]);
      return false;
    }
    const half = total / 2;
    const dp: boolean[] = new Array(half + 1).fill(false);
    dp[0] = true;
    const view = (x?: number, s?: number, tone: Tone = "active") => [
      vars({ half, x }),
      arr("dp (T = reachable)", dp.map((b) => (b ? "T" : "·")), {
        tones: tones(...dp.map((b, k) => [b ? k : null, "success"] as [number | null, Tone]), [s !== undefined && x !== undefined ? s - x : null, "compare"], [s, tone]),
        pointers: { s },
      }),
    ];
    t.step("init", "dp[0] = true: the empty subset sums to 0.", view());
    for (const x of nums) {
      t.step("num", `Use ${x}. Sweep sums from ${half} down to ${x}.`, view(x));
      for (let s = half; s >= x; s--) {
        if (!dp[s - x] || dp[s]) continue;
        dp[s] = true;
        t.step("set", `dp[${s - x}] is true, so dp[${s}] becomes true.`, () => view(x, s));
      }
    }
    t.step("ret", `dp[${half}] = ${dp[half]}.`, view(undefined, half, dp[half] ? "success" : "danger"));
    return dp[half];
  },
});

export default defineProblem<Input>({
  description: "Given an array of positive integers, return true if it can be split into two subsets with equal sums.",
  input: { default: "nums = [1,5,11,5]", parse: (a) => ({ nums: a.ints("nums") }) },
  examples: [
    { input: "nums = [1,5,11,5]", output: true },
    { input: "nums = [1,2,3,5]", output: false },
    { input: "nums = [2,2,3,5]", output: false },
  ],
  solutions: [sumSet, dp],
});

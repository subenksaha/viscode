import { arr, map, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  nums: number[];
}

const memo = defineSolution<Input>({
  id: "memo",
  name: "Top-down Memoization",
  time: "O(n)",
  space: "O(n)",
  idea: "rob(i) = max(rob(i+1), nums[i] + rob(i+2)): skip house i, or take it and skip its neighbor.",
  code: code(`
    function rob(nums: number[]): number {
      const memo = new Map<number, number>();
      function best(i: number): number {
        if (i >= nums.length) return 0; //@base
        if (memo.has(i)) return memo.get(i)!; //@hit
        const res = Math.max(best(i + 1), nums[i] + best(i + 2)); //@choose
        memo.set(i, res); //@store
        return res;
      }
      return best(0); //@ret
    }
  `),
  run({ nums }, t) {
    const cache = new Map<number, number>();
    const view = (i: number, key?: number) => [
      arr("houses", nums, { tones: tones([i, "active"]), pointers: { i: i < nums.length ? i : null } }),
      map("memo (from house → best)", cache, tones([key, "success"])),
    ];
    const best = (i: number): number => {
      if (i >= nums.length) {
        t.step("base", "Past the last house: 0.", () => view(i));
        return 0;
      }
      if (cache.has(i)) {
        t.step("hit", `best(${i}) cached = ${cache.get(i)}.`, () => view(i, i));
        return cache.get(i)!;
      }
      t.step("choose", `House ${i}: skip it, or take ${nums[i]} and jump to ${i + 2}.`, () => view(i));
      const res = Math.max(best(i + 1), nums[i] + best(i + 2));
      cache.set(i, res);
      t.step("store", `best(${i}) = ${res}.`, () => view(i, i));
      return res;
    };
    const res = best(0);
    t.step("ret", `Return ${res}.`, () => view(0, 0));
    return res;
  },
});

const table = defineSolution<Input>({
  id: "bottom-up",
  name: "Bottom-up DP Table",
  time: "O(n)",
  space: "O(n)",
  idea: "dp[i] = best loot from the first i houses = max(dp[i−1], dp[i−2] + nums[i−1]).",
  code: code(`
    function rob(nums: number[]): number {
      const dp = new Array(nums.length + 1).fill(0);
      dp[1] = nums[0]; //@init
      for (let i = 2; i <= nums.length; i++) { //@loop
        dp[i] = Math.max(dp[i - 1], dp[i - 2] + nums[i - 1]); //@fill
      }
      return dp[nums.length]; //@ret
    }
  `),
  run({ nums }, t) {
    const dp = new Array(nums.length + 1).fill(0);
    dp[1] = nums[0];
    const view = (i?: number) => [
      arr("houses", nums, { tones: tones([i !== undefined ? i - 1 : null, "active"]) }),
      arr("dp (first i houses)", dp, { tones: tones([i !== undefined ? i - 1 : null, "compare"], [i !== undefined ? i - 2 : null, "compare"], [i, "success"]) }),
    ];
    t.step("init", `dp[0] = 0, dp[1] = ${nums[0]}.`, view());
    for (let i = 2; i <= nums.length; i++) {
      t.step("loop", `House ${i - 1} (${nums[i - 1]}).`, view(i));
      dp[i] = Math.max(dp[i - 1], dp[i - 2] + nums[i - 1]);
      t.step("fill", `max(skip: ${dp[i - 1]}, take: ${dp[i - 2]} + ${nums[i - 1]}) = ${dp[i]}.`, view(i));
    }
    t.step("ret", `Return ${dp[nums.length]}.`, view());
    return dp[nums.length];
  },
});

const twoVars = defineSolution<Input>({
  id: "two-variables",
  name: "Two Variables",
  time: "O(n)",
  space: "O(1)",
  idea: "Keep only the best totals for i−1 houses (prev1) and i−2 houses (prev2).",
  code: code(`
    function rob(nums: number[]): number {
      let prev2 = 0, prev1 = 0; //@init
      for (const x of nums) { //@loop
        const cur = Math.max(prev1, prev2 + x); //@cur
        prev2 = prev1; //@shift
        prev1 = cur;
      }
      return prev1; //@ret
    }
  `),
  run({ nums }, t) {
    let prev2 = 0,
      prev1 = 0;
    const view = (i?: number, cur?: number) => [vars({ prev2, prev1, cur }), arr("houses", nums, { tones: tones([i, "active"]), pointers: { i } })];
    t.step("init", "Nothing robbed yet.", view());
    nums.forEach((x, i) => {
      t.step("loop", `House ${i} holds ${x}.`, view(i));
      const cur = Math.max(prev1, prev2 + x);
      t.step("cur", `max(skip ${prev1}, take ${prev2} + ${x}) = ${cur}.`, view(i, cur));
      prev2 = prev1;
      prev1 = cur;
      t.step("shift", "Slide the window forward.", view(i));
    });
    t.step("ret", `Return ${prev1}.`, view());
    return prev1;
  },
});

export default defineProblem<Input>({
  description: "Houses along a street hold nums[i] money. You cannot rob two adjacent houses. Return the most you can rob.",
  input: { default: "nums = [2,7,9,3,1]", parse: (a) => ({ nums: a.ints("nums") }) },
  examples: [
    { input: "nums = [1,2,3,1]", output: 4 },
    { input: "nums = [2,7,9,3,1]", output: 12 },
  ],
  solutions: [memo, table, twoVars],
});

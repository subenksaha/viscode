import { arr, map, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  nums: number[];
  target: number;
}

const memo = defineSolution<Input>({
  id: "memo",
  name: "Top-down on (index, sum)",
  time: "O(n · S)",
  space: "O(n · S)",
  idea: "ways(i, sum) = ways(i+1, sum + nums[i]) + ways(i+1, sum − nums[i]). Many sign choices reach the same (i, sum), so memoize it.",
  code: code(`
    function findTargetSumWays(nums: number[], target: number): number {
      const memo = new Map<string, number>();
      const ways = (i: number, sum: number): number => {
        if (i === nums.length) return sum === target ? 1 : 0; //@end
        const key = i + "," + sum;
        if (memo.has(key)) return memo.get(key)!; //@hit
        const res = ways(i + 1, sum + nums[i]) + ways(i + 1, sum - nums[i]); //@branch
        memo.set(key, res);
        return res;
      };
      return ways(0, 0); //@ret
    }
  `),
  run({ nums, target }, t) {
    const memo = new Map<string, number>();
    const view = (i: number, sum: number, key?: string) => [
      vars({ sum, target }),
      arr("nums", nums, { tones: tones([i, "active"]), pointers: { i: i < nums.length ? i : null } }),
      map("memo (i,sum → ways)", memo, tones([key, "success"])),
    ];
    const ways = (i: number, sum: number): number => {
      if (i === nums.length) {
        t.step("end", sum === target ? `Sum ${sum} hits the target: 1 way.` : `Sum ${sum} ≠ ${target}: 0 ways.`, () => view(i, sum));
        return sum === target ? 1 : 0;
      }
      const key = `${i},${sum}`;
      if (memo.has(key)) {
        t.step("hit", `ways(${key}) cached = ${memo.get(key)}.`, () => view(i, sum, key));
        return memo.get(key)!;
      }
      const res = ways(i + 1, sum + nums[i]) + ways(i + 1, sum - nums[i]);
      memo.set(key, res);
      t.step("branch", `ways(${key}) = +${nums[i]} branch + −${nums[i]} branch = ${res}.`, () => view(i, sum, key));
      return res;
    };
    const res = ways(0, 0);
    t.step("ret", `Return ${res}.`, view(0, 0, "0,0"));
    return res;
  },
});

const subsetSum = defineSolution<Input>({
  id: "subset-sum",
  name: "Reduce to Subset Sum",
  time: "O(n · S)",
  space: "O(S)",
  idea: "Call P the numbers given '+'. Then P − (total − P) = target, so P = (total + target) / 2. Count subsets with that sum using a 1D knapsack, iterating sums downward.",
  code: code(`
    function findTargetSumWays(nums: number[], target: number): number {
      const total = nums.reduce((a, b) => a + b, 0);
      if ((total + target) % 2 || Math.abs(target) > total) return 0; //@check
      const goal = (total + target) / 2, dp = new Array(goal + 1).fill(0);
      dp[0] = 1; //@init
      for (const x of nums) //@num
        for (let s = goal; s >= x; s--) dp[s] += dp[s - x]; //@add
      return dp[goal]; //@ret
    }
  `),
  run({ nums, target }, t) {
    const total = nums.reduce((a, b) => a + b, 0);
    if ((total + target) % 2 || Math.abs(target) > total) {
      t.step("check", `total + target = ${total + target} must be even and |target| ≤ ${total}. Impossible: 0.`, [vars({ total, target })]);
      return 0;
    }
    const goal = (total + target) / 2;
    const dp = new Array(goal + 1).fill(0);
    dp[0] = 1;
    t.step("check", `Need a '+' subset summing to (${total} + ${target}) / 2 = ${goal}.`, [vars({ total, target, goal })]);
    t.step("init", "dp[0] = 1 (empty subset).", [arr("dp (subsets with sum s)", dp)]);
    nums.forEach((x, k) => {
      t.step("num", `Allow ${x}.`, [arr("nums", nums, { tones: tones([k, "active"]) }), arr("dp (subsets with sum s)", dp)]);
      for (let s = goal; s >= x; s--) {
        if (!dp[s - x]) continue;
        dp[s] += dp[s - x];
        t.step("add", `dp[${s}] += dp[${s - x}] → ${dp[s]}.`, () => [vars({ x, goal }), arr("dp (subsets with sum s)", dp, { tones: tones([s - x, "compare"], [s, "active"]) })]);
      }
    });
    t.step("ret", `Return dp[${goal}] = ${dp[goal]}.`, [arr("dp (subsets with sum s)", dp, { tones: tones([goal, "success"]) })]);
    return dp[goal];
  },
});

export default defineProblem<Input>({
  description: "Put a '+' or '−' in front of every number in nums and evaluate the expression. Return how many different sign assignments evaluate to target.",
  input: { default: "nums = [1,1,1,1,1], target = 3", parse: (a) => ({ nums: a.ints("nums"), target: a.int("target") }) },
  examples: [
    { input: "nums = [1,1,1,1,1], target = 3", output: 5 },
    { input: "nums = [1], target = 1", output: 1 },
    { input: "nums = [0,0,1], target = 1", output: 4 },
  ],
  solutions: [memo, subsetSum],
});

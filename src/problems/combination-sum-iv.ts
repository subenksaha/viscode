import { arr, map, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  nums: number[];
  target: number;
}

const memo = defineSolution<Input>({
  id: "memo",
  name: "Top-down Memoization",
  time: "O(target · n)",
  space: "O(target)",
  idea: "ways(r) = sum over nums x ≤ r of ways(r − x): pick the first number, then count orderings of the rest.",
  approach: [
    {
      title: "Choose the first number",
      detail: "ways(r) counts ordered sequences summing to r. Choosing x first leaves ways(r − x) ways to finish, so sum this over every x ≤ r.",
      at: "try",
    },
    {
      title: "Remainder 0 is one way",
      detail: "The empty sequence completes exactly one ordering.",
      at: "base",
    },
    {
      title: "Cache counts",
      detail: "Each remainder is counted once and stored.",
      at: "store",
    },
    {
      title: "Reuse",
      detail: "Later requests for the same remainder return the cached count, so the work is O(target · n).",
      at: "hit",
    },
  ],
  code: code(`
    function combinationSum4(nums: number[], target: number): number {
      const memo = new Map<number, number>();
      function ways(remaining: number): number {
        if (remaining === 0) return 1; //@base
        if (memo.has(remaining)) return memo.get(remaining)!; //@hit
        let total = 0;
        for (const num of nums) { //@try
          if (num <= remaining) total += ways(remaining - num);
        }
        memo.set(remaining, total); //@store
        return total;
      }
      return ways(target); //@ret
    }
  `),
  run({ nums, target }, t) {
    const cache = new Map<number, number>();
    const stack: string[] = [];
    const view = (key?: number) => [
      arr("call stack", stack, { indexLabels: false, tones: tones([stack.length - 1, "active"]) }),
      map("memo (remaining → ways)", cache, tones([key, "success"])),
    ];
    const ways = (r: number): number => {
      if (r === 0) {
        t.step("base", "Remainder 0: one way (pick nothing more).", view);
        return 1;
      }
      if (cache.has(r)) {
        t.step("hit", `ways(${r}) cached = ${cache.get(r)}.`, () => view(r));
        return cache.get(r)!;
      }
      stack.push(`ways(${r})`);
      let total = 0;
      for (const x of nums)
        if (x <= r) {
          t.step("try", `ways(${r}): start with ${x}.`, view);
          total += ways(r - x);
        }
      cache.set(r, total);
      t.step("store", `ways(${r}) = ${total}.`, () => view(r));
      stack.pop();
      return total;
    };
    const res = ways(target);
    t.step("ret", `Return ${res}.`, () => view(target));
    return res;
  },
});

const bottomUp = defineSolution<Input>({
  id: "bottom-up",
  name: "Bottom-up DP",
  time: "O(target · n)",
  space: "O(target)",
  idea: "dp[s] = number of ordered sequences summing to s. dp[s] += dp[s − x] for every x. The sum is the outer loop, so order matters.",
  approach: [
    {
      title: "One way to make 0",
      detail: "dp[0] = 1, the empty sequence.",
      at: "init",
    },
    {
      title: "Sum is the outer loop",
      detail: "For each sum, try every number as the last element. Iterating sums on the outside is what counts different orders separately.",
      at: "s",
    },
    {
      title: "Add the ways to finish",
      detail: "dp[sum] += dp[sum − num]: any sequence for sum − num followed by num is a new ordered sequence.",
      at: "add",
      nth: -1,
    },
    {
      title: "Answer",
      detail: "dp[target] counts all ordered combinations.",
      at: "ret",
    },
  ],
  code: code(`
    function combinationSum4(nums: number[], target: number): number {
      // dp[sum] = number of ordered ways to reach sum
      const dp = new Array(target + 1).fill(0);
      dp[0] = 1; //@init
      for (let sum = 1; sum <= target; sum++) { //@s
        for (const num of nums) { //@x
          if (num <= sum) dp[sum] += dp[sum - num]; //@add
        }
      }
      return dp[target]; //@ret
    }
  `),
  run({ nums, target }, t) {
    const dp = new Array(target + 1).fill(0);
    dp[0] = 1;
    const view = (s?: number, from?: number) => [vars({ nums: nums.join(",") }), arr("dp", dp, { tones: tones([from, "compare"], [s, "active"]) })];
    t.step("init", "dp[0] = 1 (the empty sequence).", view());
    for (let s = 1; s <= target; s++) {
      t.step("s", `Sum ${s}.`, () => view(s));
      for (const x of nums) {
        if (x <= s) {
          dp[s] += dp[s - x];
          t.step("add", `End with ${x}: add dp[${s - x}] = ${dp[s - x]}. dp[${s}] = ${dp[s]}.`, () => view(s, s - x));
        } else t.step("x", `${x} > ${s}: skip.`, () => view(s));
      }
    }
    t.step("ret", `Return dp[${target}] = ${dp[target]}.`, view(target));
    return dp[target];
  },
});

export default defineProblem<Input>({
  description: "Return the number of ordered combinations of numbers from nums (with repetition) that add up to target. Different orders count separately.",
  input: {
    default: "nums = [1,2,3], target = 4",
    parse: (a) => ({ nums: a.ints("nums"), target: a.int("target") }),
  },
  examples: [
    { input: "nums = [1,2,3], target = 4", output: 7 },
    { input: "nums = [9], target = 3", output: 0 },
  ],
  solutions: [memo, bottomUp],
});

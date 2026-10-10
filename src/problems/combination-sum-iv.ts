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
  code: code(`
    function combinationSum4(nums: number[], target: number): number {
      const memo = new Map<number, number>();
      function ways(r: number): number {
        if (r === 0) return 1; //@base
        if (memo.has(r)) return memo.get(r)!; //@hit
        let total = 0;
        for (const x of nums) if (x <= r) total += ways(r - x); //@try
        memo.set(r, total); //@store
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
  code: code(`
    function combinationSum4(nums: number[], target: number): number {
      const dp = new Array(target + 1).fill(0);
      dp[0] = 1; //@init
      for (let s = 1; s <= target; s++) //@s
        for (const x of nums) //@x
          if (x <= s) dp[s] += dp[s - x]; //@add
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

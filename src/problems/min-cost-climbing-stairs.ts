import { arr, map, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  cost: number[];
}

const memo = defineSolution<Input>({
  id: "memo",
  name: "Top-down Memoization",
  time: "O(n)",
  space: "O(n)",
  idea: "minCost(i) = cost to stand on step i and reach the top: cost[i] + min(minCost(i+1), minCost(i+2)). Start from step 0 or 1, whichever is cheaper.",
  code: code(`
    function minCostClimbingStairs(cost: number[]): number {
      const memo = new Map<number, number>();
      const from = (i: number): number => {
        if (i >= cost.length) return 0; //@top
        if (memo.has(i)) return memo.get(i)!; //@hit
        const res = cost[i] + Math.min(from(i + 1), from(i + 2)); //@calc
        memo.set(i, res);
        return res;
      };
      return Math.min(from(0), from(1)); //@ret
    }
  `),
  run({ cost }, t) {
    const memo = new Map<number, number>();
    const view = (i: number) => [arr("cost", cost, { tones: tones([i, "active"]), pointers: { i: i < cost.length ? i : null } }), map("memo (step → cost to top)", memo, tones([String(i), "success"]))];
    const from = (i: number): number => {
      if (i >= cost.length) {
        t.step("top", `Step ${i} is the top: 0.`, () => view(i));
        return 0;
      }
      if (memo.has(i)) {
        t.step("hit", `from(${i}) cached = ${memo.get(i)}.`, () => view(i));
        return memo.get(i)!;
      }
      const res = cost[i] + Math.min(from(i + 1), from(i + 2));
      memo.set(i, res);
      t.step("calc", `from(${i}) = ${cost[i]} + min(next, skip) = ${res}.`, () => view(i));
      return res;
    };
    const res = Math.min(from(0), from(1));
    t.step("ret", `min(from(0), from(1)) = ${res}.`, view(-1));
    return res;
  },
});

const rolling = defineSolution<Input>({
  id: "two-variables",
  name: "Bottom-up with Two Variables",
  time: "O(n)",
  space: "O(1)",
  idea: "dp[i] = cheapest way to arrive at step i = min(dp[i−1] + cost[i−1], dp[i−2] + cost[i−2]). Only the last two values are needed.",
  code: code(`
    function minCostClimbingStairs(cost: number[]): number {
      let a = 0, b = 0; // cost to reach step i-2 and i-1
      for (let i = 2; i <= cost.length; i++) { //@loop
        const c = Math.min(b + cost[i - 1], a + cost[i - 2]); //@calc
        a = b; b = c; //@shift
      }
      return b; //@ret
    }
  `),
  run({ cost }, t) {
    let a = 0,
      b = 0;
    const reach: (number | null)[] = [0, 0, ...new Array(Math.max(0, cost.length - 1)).fill(null)];
    const view = (i: number) => [
      vars({ a, b }),
      arr("cost (index = step)", [...cost, "top"], { tones: tones([i - 1, "compare"], [i - 2, "compare"], [i, "active"]) }),
      arr("cheapest to reach", reach, { tones: tones([i, "success"]) }),
    ];
    for (let i = 2; i <= cost.length; i++) {
      t.step("loop", `Reach step ${i} from ${i - 1} (pay ${cost[i - 1]}) or ${i - 2} (pay ${cost[i - 2]}).`, view(i));
      const c = Math.min(b + cost[i - 1], a + cost[i - 2]);
      reach[i] = c;
      t.step("calc", `min(${b} + ${cost[i - 1]}, ${a} + ${cost[i - 2]}) = ${c}.`, view(i));
      a = b;
      b = c;
      t.step("shift", "Slide the window.", view(i));
    }
    t.step("ret", `Return ${b}.`, view(cost.length));
    return b;
  },
});

export default defineProblem<Input>({
  description: "cost[i] is the price of stepping on stair i. After paying you may climb one or two stairs, and you may start on stair 0 or 1. Return the minimum cost to reach the top (just past the last stair).",
  input: { default: "cost = [1,100,1,1,1,100,1,1,100,1]", parse: (a) => ({ cost: a.ints("cost") }) },
  examples: [
    { input: "cost = [10,15,20]", output: 15 },
    { input: "cost = [1,100,1,1,1,100,1,1,100,1]", output: 6 },
  ],
  solutions: [memo, rolling],
});

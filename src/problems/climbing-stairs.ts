import { arr, map, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  n: number;
}

const recursion = defineSolution<Input>({
  id: "recursion",
  name: "Plain Recursion",
  time: "O(2ⁿ)",
  space: "O(n)",
  idea: "The last move was 1 or 2 steps, so ways(n) = ways(n−1) + ways(n−2). Without caching, the same subproblems are solved again and again.",
  code: code(`
    function climbStairs(n: number): number {
      if (n <= 2) return n; //@base
      return climbStairs(n - 1) + climbStairs(n - 2); //@recurse
    }
  `),
  run({ n }, t) {
    const stack: string[] = [];
    let calls = 0;
    const view = () => [vars({ calls }), arr("call stack", stack, { indexLabels: false, tones: tones([stack.length - 1, "active"]) })];
    const go = (k: number): number => {
      calls++;
      stack.push(`f(${k})`);
      let res: number;
      if (k <= 2) {
        res = k;
        t.step("base", `f(${k}) = ${k} (base case).`, view);
      } else {
        t.step("recurse", `f(${k}) = f(${k - 1}) + f(${k - 2}).`, view);
        res = go(k - 1) + go(k - 2);
        t.step("recurse", `f(${k}) returns ${res}.`, view);
      }
      stack.pop();
      return res;
    };
    const res = go(n);
    t.step("base", `Done after ${calls} calls. Answer ${res}.`, view);
    return res;
  },
});

const memo = defineSolution<Input>({
  id: "memo",
  name: "Top-down Memoization",
  time: "O(n)",
  space: "O(n)",
  idea: "Same recursion, but cache each answer so every n is computed once.",
  code: code(`
    function climbStairs(n: number, memo = new Map<number, number>()): number {
      if (n <= 2) return n; //@base
      if (memo.has(n)) return memo.get(n)!; //@hit
      const ways = climbStairs(n - 1, memo) + climbStairs(n - 2, memo); //@recurse
      memo.set(n, ways); //@store
      return ways;
    }
  `),
  run({ n }, t) {
    const cache = new Map<number, number>();
    const stack: string[] = [];
    const view = (key?: number) => [
      arr("call stack", stack, { indexLabels: false, tones: tones([stack.length - 1, "active"]) }),
      map("memo", cache, tones([key, "success"])),
    ];
    const go = (k: number): number => {
      stack.push(`f(${k})`);
      let res: number;
      if (k <= 2) {
        res = k;
        t.step("base", `f(${k}) = ${k}.`, view());
      } else if (cache.has(k)) {
        res = cache.get(k)!;
        t.step("hit", `f(${k}) is cached: ${res}.`, view(k));
      } else {
        t.step("recurse", `f(${k}) = f(${k - 1}) + f(${k - 2}).`, view());
        res = go(k - 1) + go(k - 2);
        cache.set(k, res);
        t.step("store", `Cache f(${k}) = ${res}.`, view(k));
      }
      stack.pop();
      return res;
    };
    return go(n);
  },
});

const bottomUp = defineSolution<Input>({
  id: "bottom-up",
  name: "Bottom-up DP Table",
  time: "O(n)",
  space: "O(n)",
  idea: "Fill dp[i] = dp[i−1] + dp[i−2] from the bottom up.",
  code: code(`
    function climbStairs(n: number): number {
      // dp[i] = number of ways to reach step i
      const dp = new Array(n + 1).fill(0);
      dp[0] = 1; //@init
      dp[1] = 1;
      for (let i = 2; i <= n; i++) { //@loop
        dp[i] = dp[i - 1] + dp[i - 2]; //@fill
      }
      return dp[n]; //@ret
    }
  `),
  run({ n }, t) {
    const dp: (number | null)[] = new Array(n + 1).fill(null);
    dp[0] = 1;
    dp[1] = 1;
    t.step("init", "One way to stand at step 0 or reach step 1.", [arr("dp", dp)]);
    for (let i = 2; i <= n; i++) {
      t.step("loop", `i = ${i}.`, [arr("dp", dp, { tones: tones([i - 1, "compare"], [i - 2, "compare"], [i, "active"]) })]);
      dp[i] = dp[i - 1]! + dp[i - 2]!;
      t.step("fill", `dp[${i}] = ${dp[i - 1]} + ${dp[i - 2]} = ${dp[i]}.`, [
        arr("dp", dp, { tones: tones([i - 1, "compare"], [i - 2, "compare"], [i, "success"]) }),
      ]);
    }
    t.step("ret", `Return dp[${n}] = ${dp[n]}.`, [arr("dp", dp, { tones: tones([n, "success"]) })]);
    return dp[n];
  },
});

const twoVars = defineSolution<Input>({
  id: "two-variables",
  name: "Two Variables (Fibonacci)",
  time: "O(n)",
  space: "O(1)",
  idea: "Only the previous two values matter, so keep just those.",
  code: code(`
    function climbStairs(n: number): number {
      let twoStepsBack = 1; // ways to reach step i - 2 //@init
      let oneStepBack = 1;  // ways to reach step i - 1
      for (let i = 2; i <= n; i++) { //@loop
        const current = oneStepBack + twoStepsBack; //@shift
        twoStepsBack = oneStepBack;
        oneStepBack = current;
      }
      return oneStepBack; //@ret
    }
  `),
  run({ n }, t) {
    let a = 1,
      b = 1;
    t.step("init", "twoStepsBack = 1, oneStepBack = 1.", [vars({ twoStepsBack: a, oneStepBack: b })]);
    for (let i = 2; i <= n; i++) {
      t.step("loop", `i = ${i}.`, [vars({ i, twoStepsBack: a, oneStepBack: b })]);
      [a, b] = [b, a + b];
      t.step("shift", `ways(${i}) = ${b}.`, [vars({ i, twoStepsBack: a, oneStepBack: b })]);
    }
    t.step("ret", `Return ${b}.`, [vars({ answer: b })]);
    return b;
  },
});

export default defineProblem<Input>({
  description: "You climb a staircase of n steps, taking 1 or 2 steps at a time. In how many distinct ways can you reach the top?",
  input: { default: "n = 5", parse: (a) => ({ n: a.int("n") }) },
  examples: [
    { input: "n = 2", output: 2 },
    { input: "n = 3", output: 3 },
    { input: "n = 10", output: 89 },
  ],
  solutions: [recursion, memo, bottomUp, twoVars],
});

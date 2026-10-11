import { arr, map, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  coins: number[];
  amount: number;
}

const inf = (v: number) => (v === Infinity ? "∞" : v);

const memo = defineSolution<Input>({
  id: "memo",
  name: "Top-down Memoization",
  time: "O(amount · coins)",
  space: "O(amount)",
  idea: "best(r) = 1 + min over coins c of best(r − c). Cache results so each remainder is solved once.",
  approach: [
    {
      title: "Define the subproblem",
      detail: "fewestCoins(r) is the fewest coins that make exactly r. Try every coin as the first one, then solve the rest: 1 + fewestCoins(r − coin).",
      at: "try",
    },
    {
      title: "Base cases",
      detail: "Remainder 0 needs 0 coins. A negative remainder overshot, so it is impossible (∞).",
      at: "zero",
    },
    {
      title: "Memoize each remainder",
      detail: "The minimum over all coins is stored for r. There are only amount + 1 distinct remainders.",
      at: "store",
    },
    {
      title: "Cache hits prune the tree",
      detail: "Different coin orders reach the same remainder, and the cache answers them at once. Total work is O(amount · coins).",
      at: "hit",
    },
  ],
  code: code(`
    function coinChange(coins: number[], amount: number): number {
      const memo = new Map<number, number>();
      // Fewest coins needed to make exactly remaining.
      function fewestCoins(remaining: number): number {
        if (remaining === 0) return 0; //@zero
        if (remaining < 0) return Infinity; //@neg
        if (memo.has(remaining)) return memo.get(remaining)!; //@hit
        let result = Infinity;
        for (const coin of coins) { //@try
          result = Math.min(result, fewestCoins(remaining - coin) + 1);
        }
        memo.set(remaining, result); //@store
        return result;
      }
      const answer = fewestCoins(amount);
      return answer === Infinity ? -1 : answer; //@ret
    }
  `),
  run({ coins, amount }, t) {
    const cache = new Map<number, number>();
    const stack: string[] = [];
    const view = (key?: number) => [
      arr("call stack", stack, { indexLabels: false, tones: tones([stack.length - 1, "active"]) }),
      map("memo (remaining → coins)", [...cache].map(([k, v]) => [k, inf(v)]), tones([key, "success"])),
    ];
    const best = (r: number): number => {
      if (r === 0) {
        t.step("zero", "Remainder 0 needs 0 coins.", view);
        return 0;
      }
      if (r < 0) {
        t.step("neg", `Overshot (${r}). Impossible.`, view);
        return Infinity;
      }
      if (cache.has(r)) {
        t.step("hit", `best(${r}) cached: ${inf(cache.get(r)!)}.`, () => view(r));
        return cache.get(r)!;
      }
      stack.push(`best(${r})`);
      let res = Infinity;
      for (const c of coins) {
        t.step("try", `best(${r}): try coin ${c}.`, view);
        res = Math.min(res, best(r - c) + 1);
      }
      cache.set(r, res);
      t.step("store", `best(${r}) = ${inf(res)}.`, () => view(r));
      stack.pop();
      return res;
    };
    const ans = best(amount);
    const out = ans === Infinity ? -1 : ans;
    t.step("ret", `Return ${out}.`, view);
    return out;
  },
});

const bottomUp = defineSolution<Input>({
  id: "bottom-up",
  name: "Bottom-up DP",
  time: "O(amount · coins)",
  space: "O(amount)",
  idea: "dp[a] = fewest coins that make a. For each a, try every coin: dp[a] = min(dp[a], dp[a − c] + 1).",
  approach: [
    {
      title: "Base case and ∞",
      detail: "dp[0] = 0. Every other total starts at ∞, meaning not yet achievable.",
      at: "init",
    },
    {
      title: "Build totals in increasing order",
      detail: "For each total, dp of every smaller total is already final.",
      at: "a",
      nth: 6,
    },
    {
      title: "Relax with each coin",
      detail: "If coin ≤ total, then dp[total − coin] + 1 is a candidate: use that coin last. Keep the minimum.",
      at: "relax",
      nth: -1,
    },
    {
      title: "Read the answer",
      detail: "dp[amount] is the fewest coins, or −1 if it stayed ∞.",
      at: "ret",
    },
  ],
  code: code(`
    function coinChange(coins: number[], amount: number): number {
      // dp[total] = fewest coins that add up to total
      const dp = new Array(amount + 1).fill(Infinity);
      dp[0] = 0; //@init
      for (let total = 1; total <= amount; total++) { //@a
        for (const coin of coins) { //@c
          if (coin <= total) {
            dp[total] = Math.min(dp[total], dp[total - coin] + 1); //@relax
          }
        }
      }
      return dp[amount] === Infinity ? -1 : dp[amount]; //@ret
    }
  `),
  run({ coins, amount }, t) {
    const dp = new Array(amount + 1).fill(Infinity);
    dp[0] = 0;
    const view = (a?: number, from?: number) => [
      vars({ coins: coins.join(","), amount }),
      arr("dp", dp.map(inf), { tones: tones([from, "compare"], [a, "active"]) }),
    ];
    t.step("init", "dp[0] = 0. Everything else starts at ∞.", view());
    for (let a = 1; a <= amount; a++) {
      t.step("a", `Amount ${a}.`, () => view(a));
      for (const c of coins) {
        if (c <= a) {
          const before = dp[a];
          dp[a] = Math.min(dp[a], dp[a - c] + 1);
          t.step("relax", `Coin ${c}: dp[${a - c}] + 1 = ${inf(dp[a - c] + 1)}${dp[a] < before ? " (better)" : ""}. dp[${a}] = ${inf(dp[a])}.`, () => view(a, a - c));
        } else t.step("c", `Coin ${c} is bigger than ${a}.`, () => view(a));
      }
    }
    const out = dp[amount] === Infinity ? -1 : dp[amount];
    t.step("ret", `Return ${out}.`, view(amount));
    return out;
  },
});

const bfs = defineSolution<Input>({
  id: "bfs",
  name: "BFS over Remainders",
  time: "O(amount · coins)",
  space: "O(amount)",
  idea: "Each coin is an edge from remainder r to r − c. The first time BFS reaches 0, the depth is the fewest coins.",
  approach: [
    {
      title: "Remainders are nodes",
      detail: "Start at amount. Each coin is an edge from r to r − coin. The fewest coins is the shortest path to 0.",
      at: "init",
    },
    {
      title: "Expand level by level",
      detail: "Level k holds every remainder reachable with exactly k coins.",
      at: "level",
      nth: 2,
    },
    {
      title: "Only enqueue new remainders",
      detail: "The seen set makes each remainder enter the queue once, so the search is O(amount · coins).",
      at: "push",
    },
    {
      title: "First time we hit 0",
      detail: "BFS explores in order of coin count, so the first time a remainder reaches 0 gives the minimum.",
      at: "found",
    },
  ],
  code: code(`
    function coinChange(coins: number[], amount: number): number {
      if (amount === 0) return 0;
      const seen = new Set([amount]);
      let queue = [amount]; //@init
      let coinsUsed = 0;
      while (queue.length > 0) { //@level
        coinsUsed++;
        const nextQueue: number[] = [];
        for (const remaining of queue) { //@node
          for (const coin of coins) {
            const left = remaining - coin;
            if (left === 0) return coinsUsed; //@found
            if (left > 0 && !seen.has(left)) { //@push
              seen.add(left);
              nextQueue.push(left);
            }
          }
        }
        queue = nextQueue;
      }
      return -1; //@none
    }
  `),
  run({ coins, amount }, t) {
    if (amount === 0) {
      t.step("init", "Amount is 0: no coins needed.");
      return 0;
    }
    const seen = new Set([amount]);
    let queue = [amount],
      depth = 0;
    const view = (current?: number, next: number[] = []) => [
      vars({ coinsUsed: depth }),
      arr("queue (this level)", queue, { tones: tones([current, "active"]), indexLabels: false }),
      arr("next level", next, { indexLabels: false }),
      map("seen", seen),
    ];
    t.step("init", `Start BFS from ${amount}.`, view());
    while (queue.length) {
      depth++;
      const next: number[] = [];
      t.step("level", `Level ${depth}: remainders reachable with ${depth} coin(s).`, () => view(undefined, next));
      for (let qi = 0; qi < queue.length; qi++) {
        const r = queue[qi];
        t.step("node", `Expand remainder ${r}.`, () => view(qi, next));
        for (const c of coins) {
          const rest = r - c;
          if (rest === 0) {
            t.step("found", `${r} − ${c} = 0. Reached 0 with ${depth} coin(s).`, () => view(qi, next));
            return depth;
          }
          if (rest > 0 && !seen.has(rest)) {
            seen.add(rest);
            next.push(rest);
            t.step("push", `${r} − ${c} = ${rest}: new remainder.`, () => view(qi, next));
          }
        }
      }
      queue = next;
    }
    t.step("none", "Queue is empty and 0 was never reached. Return -1.", view());
    return -1;
  },
});

export default defineProblem<Input>({
  description: "Return the fewest coins needed to make up amount, or -1 if it cannot be done. You have unlimited coins of each denomination.",
  input: {
    default: "coins = [1,2,5], amount = 11",
    parse: (a) => ({ coins: a.ints("coins"), amount: a.int("amount") }),
  },
  examples: [
    { input: "coins = [1,2,5], amount = 11", output: 3 },
    { input: "coins = [2], amount = 3", output: -1 },
    { input: "coins = [1], amount = 0", output: 0 },
  ],
  solutions: [memo, bottomUp, bfs],
});

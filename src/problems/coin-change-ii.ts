import { arr, grid, rc, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  amount: number;
  coins: number[];
}

const table = defineSolution<Input>({
  id: "2d-table",
  name: "2D Table: Coins × Amount",
  time: "O(n · amount)",
  space: "O(n · amount)",
  idea: "dp[i][a] = ways to make a using only the first i coin types. Either skip coin i (dp[i−1][a]) or use it at least once more (dp[i][a − coin]).",
  approach: [
    {
      title: "Base column",
      detail: "One way to make 0 with any set of coins: use nothing.",
      at: "init",
    },
    {
      title: "Skip or use coin i",
      detail: "dp[i][a] = dp[i−1][a] (never use this coin) + dp[i][a − coin] (use it at least once more).",
      at: "cell",
      nth: 8,
    },
    {
      title: "Answer",
      detail: "dp[n][amount]. Coins are added in a fixed order, so combinations are counted, not permutations.",
      at: "ret",
    },
  ],
  code: code(`
    function change(amount: number, coins: number[]): number {
      // dp[i][total] = ways to make total using only the first i coins
      const dp = Array.from({ length: coins.length + 1 }, () => new Array(amount + 1).fill(0));
      for (let i = 0; i <= coins.length; i++) { //@init
        dp[i][0] = 1;
      }
      for (let i = 1; i <= coins.length; i++) {
        const coin = coins[i - 1];
        for (let total = 1; total <= amount; total++) { //@cell
          const withoutCoin = dp[i - 1][total];
          const withCoin = total >= coin ? dp[i][total - coin] : 0;
          dp[i][total] = withoutCoin + withCoin;
        }
      }
      return dp[coins.length][amount]; //@ret
    }
  `),
  run({ amount, coins }, t) {
    const dp: (number | null)[][] = Array.from({ length: coins.length + 1 }, (_, i) => Array.from({ length: amount + 1 }, (_, a) => (a === 0 ? 1 : i === 0 ? 0 : null)));
    const labels = { rowLabels: ["none", ...coins.map(String)], colLabels: Array.from({ length: amount + 1 }, (_, a) => String(a)) };
    t.step("init", "One way to make 0 (use nothing); no way to make more with no coins.", [grid("dp", dp, labels)]);
    for (let i = 1; i <= coins.length; i++)
      for (let a = 1; a <= amount; a++) {
        const c = coins[i - 1];
        const use = a >= c ? dp[i][a - c]! : 0;
        dp[i][a] = dp[i - 1][a]! + use;
        t.step("cell", `Make ${a} with coins up to ${c}: skip (${dp[i - 1][a]}) + use (${use}) = ${dp[i][a]}.`, () => [
          grid("dp", dp, { ...labels, tones: tones([rc(i - 1, a), "compare"], [a >= c ? rc(i, a - c) : null, "compare"], [rc(i, a), "active"]) }),
        ]);
      }
    const res = dp[coins.length][amount]!;
    t.step("ret", `Return ${res}.`, [grid("dp", dp, { ...labels, tones: tones([rc(coins.length, amount), "success"]) })]);
    return res;
  },
});

const oneD = defineSolution<Input>({
  id: "1d",
  name: "1D Array, Coins in the Outer Loop",
  time: "O(n · amount)",
  space: "O(amount)",
  idea: "Process one coin type at a time and add its ways into dp[a] += dp[a − coin]. Putting coins in the outer loop counts each combination once, regardless of order.",
  approach: [
    {
      title: "dp[0] = 1",
      detail: "Only one row is needed.",
      at: "init",
    },
    {
      title: "Coins in the outer loop",
      detail: "Every combination is then built with coins in the same order, so it is counted once.",
      at: "coin",
    },
    {
      title: "Add ways",
      detail: "dp[a] += dp[a − coin]. Looping upward allows unlimited copies.",
      at: "add",
      nth: -1,
    },
    {
      title: "Answer",
      detail: "dp[amount].",
      at: "ret",
    },
  ],
  code: code(`
    function change(amount: number, coins: number[]): number {
      // dp[total] = ways to make total with the coins seen so far
      const dp = new Array(amount + 1).fill(0);
      dp[0] = 1; //@init
      for (const coin of coins) { //@coin
        for (let total = coin; total <= amount; total++) {
          dp[total] += dp[total - coin]; //@add
        }
      }
      return dp[amount]; //@ret
    }
  `),
  run({ amount, coins }, t) {
    const dp = new Array(amount + 1).fill(0);
    dp[0] = 1;
    t.step("init", "dp[0] = 1.", [arr("dp (ways to make a)", dp)]);
    coins.forEach((c, k) => {
      t.step("coin", `Allow coin ${c}.`, [arr("coins", coins, { tones: tones([k, "active"]) }), arr("dp (ways to make a)", dp)]);
      for (let a = c; a <= amount; a++) {
        dp[a] += dp[a - c];
        t.step("add", `dp[${a}] += dp[${a - c}] → ${dp[a]}.`, () => [vars({ coin: c }), arr("dp (ways to make a)", dp, { tones: tones([a - c, "compare"], [a, "active"]) })]);
      }
    });
    t.step("ret", `Return dp[${amount}] = ${dp[amount]}.`, [arr("dp (ways to make a)", dp, { tones: tones([amount, "success"]) })]);
    return dp[amount];
  },
});

export default defineProblem<Input>({
  description: "Given coin denominations (unlimited supply of each) and an amount, return the number of combinations that make up that amount. Order does not matter; return 0 if none.",
  input: { default: "amount = 5, coins = [1,2,5]", parse: (a) => ({ amount: a.int("amount"), coins: a.ints("coins") }) },
  examples: [
    { input: "amount = 5, coins = [1,2,5]", output: 4 },
    { input: "amount = 3, coins = [2]", output: 0 },
    { input: "amount = 10, coins = [10]", output: 1 },
  ],
  solutions: [table, oneD],
});

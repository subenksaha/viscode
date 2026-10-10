import { arr, grid, map, rc, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  prices: number[];
}

const memo = defineSolution<Input>({
  id: "memo",
  name: "Top-down: (day, holding)",
  time: "O(n)",
  space: "O(n)",
  idea: "best(i, holding): if not holding, buy today or wait; if holding, sell today (then skip a day of cooldown) or wait. Memoize on (day, holding).",
  code: code(`
    function maxProfit(prices: number[]): number {
      const memo = new Map<string, number>();
      const best = (i: number, holding: boolean): number => {
        if (i >= prices.length) return 0; //@end
        const key = i + "," + holding;
        if (memo.has(key)) return memo.get(key)!; //@hit
        const wait = best(i + 1, holding);
        const act = holding ? prices[i] + best(i + 2, false) : -prices[i] + best(i + 1, true); //@choose
        memo.set(key, Math.max(wait, act)); //@store
        return memo.get(key)!;
      };
      return best(0, false); //@ret
    }
  `),
  run({ prices }, t) {
    const memo = new Map<string, number>();
    const view = (i: number, key?: string) => [arr("prices", prices, { tones: tones([i, "active"]), pointers: { day: i < prices.length ? i : null } }), map("memo (day,holding → profit)", memo, tones([key, "success"]))];
    const best = (i: number, holding: boolean): number => {
      if (i >= prices.length) return 0;
      const key = `${i},${holding}`;
      if (memo.has(key)) {
        t.step("hit", `best(${key}) cached = ${memo.get(key)}.`, () => view(i, key));
        return memo.get(key)!;
      }
      const wait = best(i + 1, holding);
      const act = holding ? prices[i] + best(i + 2, false) : -prices[i] + best(i + 1, true);
      t.step("choose", holding ? `Day ${i}, holding: sell (${act}) or wait (${wait}).` : `Day ${i}, empty-handed: buy (${act}) or wait (${wait}).`, () => view(i));
      memo.set(key, Math.max(wait, act));
      t.step("store", `best(${key}) = ${memo.get(key)}.`, () => view(i, key));
      return memo.get(key)!;
    };
    const res = best(0, false);
    t.step("ret", `Return ${res}.`, view(-1, "0,false"));
    return res;
  },
});

const stateMachine = defineSolution<Input>({
  id: "state-machine",
  name: "Three-state Machine",
  time: "O(n)",
  space: "O(1)",
  idea: "Track the best profit ending each day in three states: hold (own a share), sold (just sold, cooling down tomorrow) and rest (free to buy). Each day's states come from yesterday's.",
  code: code(`
    function maxProfit(prices: number[]): number {
      let hold = -Infinity, sold = 0, rest = 0; //@init
      for (const p of prices) { //@day
        const prevSold = sold;
        sold = hold + p;                 // sell today
        hold = Math.max(hold, rest - p); // keep holding, or buy from rest
        // rest: cooldown ends (or keep resting)
        rest = Math.max(rest, prevSold); //@update
      }
      return Math.max(sold, rest); //@ret
    }
  `),
  run({ prices }, t) {
    let hold = -Infinity,
      sold = 0,
      rest = 0;
    const rows: (number | string)[][] = [[], [], []];
    const f = (x: number) => (x === -Infinity ? "−∞" : x);
    const view = (i: number) => [
      vars({ hold: f(hold), sold, rest }),
      arr("prices", prices, { tones: tones([i, "active"]) }),
      grid("state per day", rows, { rowLabels: ["hold", "sold", "rest"], colLabels: prices.slice(0, rows[0].length).map((_, k) => String(k)), tones: tones([rc(0, i), "compare"], [rc(1, i), "compare"], [rc(2, i), "compare"]) }),
    ];
    t.step("init", "Before day 0: can't hold, nothing sold.", view(-1));
    prices.forEach((p, i) => {
      t.step("day", `Day ${i}, price ${p}.`, view(i - 1));
      const prevSold = sold;
      sold = hold + p;
      hold = Math.max(hold, rest - p);
      rest = Math.max(rest, prevSold);
      rows[0].push(f(hold));
      rows[1].push(f(sold));
      rows[2].push(rest);
      t.step("update", `sold = hold + ${p}; hold = max(hold, rest − ${p}); rest = max(rest, old sold).`, view(i));
    });
    const res = Math.max(sold, rest);
    t.step("ret", `Best is max(sold, rest) = ${res}.`, view(prices.length - 1));
    return res;
  },
});

export default defineProblem<Input>({
  description: "Given daily stock prices, return the maximum profit from as many buy/sell transactions as you like, holding at most one share, where after selling you must wait one day (cooldown) before buying again.",
  input: { default: "prices = [1,2,3,0,2]", parse: (a) => ({ prices: a.ints("prices") }) },
  examples: [
    { input: "prices = [1,2,3,0,2]", output: 3 },
    { input: "prices = [1]", output: 0 },
    { input: "prices = [2,1,4,5,2,9,7]", output: 10 },
  ],
  solutions: [memo, stateMachine],
});

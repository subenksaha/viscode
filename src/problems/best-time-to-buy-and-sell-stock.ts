import { arr, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  prices: number[];
}

const bruteForce = defineSolution<Input>({
  id: "brute-force",
  name: "Brute Force",
  time: "O(n²)",
  space: "O(1)",
  idea: "For every buy day, try every later sell day and keep the best profit.",
  approach: [
    {
      title: "Start with no trade",
      detail: "best = 0 because doing nothing is always allowed, so the answer is never negative.",
      at: "init",
    },
    {
      title: "Choose a buy day",
      detail: "Each day i is a candidate buy day. The sell day must come strictly later.",
      at: "i",
    },
    {
      title: "Try every later sell day",
      detail: "For each j > i, compute prices[j] − prices[i]. This checks all n²/2 buy/sell pairs.",
      at: "j",
    },
    {
      title: "Keep the best profit",
      detail: "Update best with every profit seen. After every pair is checked, best is the maximum profit.",
      at: "update",
      nth: -1,
    },
  ],
  code: code(`
    function maxProfit(prices: number[]): number {
      let best = 0; //@init
      for (let i = 0; i < prices.length; i++) { //@i
        for (let j = i + 1; j < prices.length; j++) { //@j
          const profit = prices[j] - prices[i];
          best = Math.max(best, profit); //@update
        }
      }
      return best; //@ret
    }
  `),
  run({ prices }, t) {
    let best = 0;
    const view = (i?: number, j?: number) => [
      vars({ best, profit: i !== undefined && j !== undefined ? prices[j] - prices[i] : undefined }),
      arr("prices", prices, { tones: tones([i, "active"], [j, "compare"]), pointers: { buy: i, sell: j } }),
    ];
    t.step("init", "best = 0 (no trade).", view());
    for (let i = 0; i < prices.length; i++) {
      t.step("i", `Buy on day ${i} at ${prices[i]}.`, view(i));
      for (let j = i + 1; j < prices.length; j++) {
        t.step("j", `Sell on day ${j} at ${prices[j]}.`, view(i, j));
        best = Math.max(best, prices[j] - prices[i]);
        t.step("update", `Profit ${prices[j] - prices[i]}; best = ${best}.`, view(i, j));
      }
    }
    t.step("ret", `Return ${best}.`, view());
    return best;
  },
});

const onePass = defineSolution<Input>({
  id: "one-pass",
  name: "Track Minimum (One Pass)",
  time: "O(n)",
  space: "O(1)",
  idea: "The best sell today pairs with the cheapest price seen so far. Track that minimum as you scan.",
  approach: [
    {
      title: "Track the cheapest price so far",
      detail: "Selling on day d is best when paired with the minimum price before d. So we only need the running minimum, not every earlier day.",
      at: "init",
    },
    {
      title: "New low: it becomes the buy candidate",
      detail: "When today's price beats the minimum, any future sale would rather buy here. Selling today can't beat a profit of 0, so just update minPrice.",
      at: "min",
      nth: 2,
    },
    {
      title: "Otherwise, try selling today",
      detail: "price − minPrice is the best profit for a sale today. Compare it with best.",
      at: "profit",
    },
    {
      title: "One scan answers it",
      detail: "Each day is processed once with O(1) state. best holds the maximum profit across all sell days.",
      at: "ret",
    },
  ],
  code: code(`
    function maxProfit(prices: number[]): number {
      let minPrice = Infinity; //@init
      let best = 0;
      for (const price of prices) { //@loop
        if (price < minPrice) {
          minPrice = price; //@min
        } else {
          const profit = price - minPrice;
          best = Math.max(best, profit); //@profit
        }
      }
      return best; //@ret
    }
  `),
  run({ prices }, t) {
    let minPrice = Infinity,
      best = 0,
      minIdx = -1;
    const view = (i?: number) => [
      vars({ minPrice: minPrice === Infinity ? "∞" : minPrice, best }),
      arr("prices", prices, {
        tones: tones([minIdx, "success"], [i, "active"]),
        pointers: { min: minIdx >= 0 ? minIdx : null, i },
      }),
    ];
    t.step("init", "minPrice = ∞, best = 0.", view());
    for (let i = 0; i < prices.length; i++) {
      const price = prices[i];
      t.step("loop", `Day ${i}: price ${price}.`, view(i));
      if (price < minPrice) {
        minPrice = price;
        minIdx = i;
        t.step("min", `New cheapest buy price: ${price}.`, view(i));
      } else {
        best = Math.max(best, price - minPrice);
        t.step("profit", `Sell now: ${price} − ${minPrice} = ${price - minPrice}; best = ${best}.`, view(i));
      }
    }
    t.step("ret", `Return ${best}.`, view());
    return best;
  },
});

export default defineProblem<Input>({
  description:
    "prices[i] is a stock's price on day i. Choose one day to buy and a later day to sell to maximize profit. Return the max profit, or 0 if no profit is possible.",
  input: { default: "prices = [7,1,5,3,6,4]", parse: (a) => ({ prices: a.ints("prices") }) },
  examples: [
    { input: "prices = [7,1,5,3,6,4]", output: 5 },
    { input: "prices = [7,6,4,3,1]", output: 0 },
  ],
  solutions: [bruteForce, onePass],
});

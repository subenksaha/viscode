import { arr, bitWidth, bits, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  n: number;
}

const perNumber = defineSolution<Input>({
  id: "per-number",
  name: "Count Each Number",
  time: "O(n log n)",
  space: "O(1)",
  idea: "Count the set bits of every i from 0 to n independently: check the last bit, then halve the number, until it reaches 0.",
  approach: [
    {
      title: "Handle each i separately",
      detail: "For every i in 0..n, count its 1s from scratch.",
      at: "loop",
    },
    {
      title: "Count by halving",
      detail: "value % 2 gives the last bit, and halving drops it. Repeat until 0. This takes about log i steps.",
      at: "count",
      nth: -1,
    },
    {
      title: "Store the count",
      detail: "Push the count into result. Total cost is O(n log n), since nothing is reused between numbers.",
      at: "push",
      nth: -1,
    },
  ],
  code: code(`
    function countBits(n: number): number[] {
      const result: number[] = []; //@init
      for (let i = 0; i <= n; i++) { //@loop
        let value = i;
        let ones = 0;
        while (value > 0) { //@count
          if (value % 2 === 1) ones++;
          value = Math.floor(value / 2);
        }
        result.push(ones); //@push
      }
      return result; //@ret
    }
  `),
  run({ n }, t) {
    const ans: number[] = [];
    const w = bitWidth(n);
    t.step("init", "Empty result.", [arr("result", ans)]);
    for (let i = 0; i <= n; i++) {
      t.step("loop", `i = ${i}.`, [bits(`${i} in binary`, i, w), arr("result", ans)]);
      let x = i,
        c = 0;
      while (x) {
        x &= x - 1;
        c++;
      }
      t.step("count", `${i} has ${c} set bit(s).`, [bits(`${i} in binary`, i, w), arr("result", ans)]);
      ans.push(c);
      t.step("push", `result[${i}] = ${c}.`, [arr("result", ans, { tones: tones([i, "success"]) })]);
    }
    t.step("ret", "Return result.", [arr("result", ans)]);
    return ans;
  },
});

const shiftDp = defineSolution<Input>({
  id: "dp-shift",
  name: "DP: Drop the Last Bit",
  time: "O(n)",
  space: "O(1)",
  idea: "Halving i (rounding down) drops its last bit, and the result is smaller, so its answer is already known: dp[i] = dp[⌊i / 2⌋] + (i % 2).",
  approach: [
    {
      title: "Base case",
      detail: "dp[0] = 0: zero has no set bits.",
      at: "init",
    },
    {
      title: "Halving drops the last bit",
      detail: "i >> 1 is i without its last bit, and it is smaller than i, so dp[i >> 1] is already computed.",
      at: "loop",
      nth: 5,
    },
    {
      title: "Recurrence",
      detail: "dp[i] = dp[i / 2] + (i % 2): the bits of i are the bits of i/2 plus the bit that was dropped. O(1) per number.",
      at: "dp",
      nth: -1,
    },
  ],
  code: code(`
    function countBits(n: number): number[] {
      // dp[i] = number of 1 bits in i
      const dp = new Array(n + 1).fill(0); //@init
      for (let i = 1; i <= n; i++) { //@loop
        // i has the same bits as i / 2, plus one more if i is odd.
        const half = Math.floor(i / 2);
        const lastBit = i % 2;
        dp[i] = dp[half] + lastBit; //@dp
      }
      return dp; //@ret
    }
  `),
  run({ n }, t) {
    const dp = new Array(n + 1).fill(0);
    const w = bitWidth(n);
    t.step("init", "dp[0] = 0.", [arr("dp", dp)]);
    for (let i = 1; i <= n; i++) {
      t.step("loop", `i = ${i}: i >> 1 = ${i >> 1}, last bit = ${i & 1}.`, [
        bits(`${i}`, i, w, { 0: "compare" }),
        arr("dp", dp, { tones: tones([i >> 1, "compare"], [i, "active"]) }),
      ]);
      dp[i] = dp[i >> 1] + (i & 1);
      t.step("dp", `dp[${i}] = dp[${i >> 1}] + ${i & 1} = ${dp[i]}.`, [
        arr("dp", dp, { tones: tones([i >> 1, "compare"], [i, "success"]) }),
      ]);
    }
    t.step("ret", "Return dp.", [arr("dp", dp)]);
    return dp;
  },
});

const lowBitDp = defineSolution<Input>({
  id: "dp-lowest-bit",
  name: "DP: Clear the Lowest Set Bit",
  time: "O(n)",
  space: "O(1)",
  idea: "i & (i − 1) is i with its lowest 1 removed, so dp[i] = dp[i & (i − 1)] + 1.",
  approach: [
    {
      title: "Base case",
      detail: "dp[0] = 0.",
      at: "init",
    },
    {
      title: "Strip the lowest set bit",
      detail: "i & (i − 1) removes exactly one 1 from i and gives a smaller number with a known answer.",
      at: "loop",
      nth: 6,
    },
    {
      title: "One more than the stripped number",
      detail: "dp[i] = dp[i & (i − 1)] + 1. Each entry costs O(1), so the whole table is O(n).",
      at: "dp",
      nth: -1,
    },
  ],
  code: code(`
    function countBits(n: number): number[] {
      // dp[i] = number of 1 bits in i
      const dp = new Array(n + 1).fill(0); //@init
      for (let i = 1; i <= n; i++) { //@loop
        // i & (i - 1) is i with its lowest 1 bit turned off.
        const withoutLowestBit = i & (i - 1);
        dp[i] = dp[withoutLowestBit] + 1; //@dp
      }
      return dp; //@ret
    }
  `),
  run({ n }, t) {
    const dp = new Array(n + 1).fill(0);
    t.step("init", "dp[0] = 0.", [arr("dp", dp)]);
    for (let i = 1; i <= n; i++) {
      const j = i & (i - 1);
      t.step("loop", `i = ${i}: i & (i − 1) = ${j}.`, [vars({ i, withoutLowestBit: j }), arr("dp", dp, { tones: tones([j, "compare"], [i, "active"]) })]);
      dp[i] = dp[j] + 1;
      t.step("dp", `dp[${i}] = dp[${j}] + 1 = ${dp[i]}.`, [arr("dp", dp, { tones: tones([j, "compare"], [i, "success"]) })]);
    }
    t.step("ret", "Return dp.", [arr("dp", dp)]);
    return dp;
  },
});

export default defineProblem<Input>({
  description: "Return an array ans of length n + 1 where ans[i] is the number of 1 bits in the binary form of i.",
  input: { default: "n = 8", parse: (a) => ({ n: a.int("n") }) },
  examples: [
    { input: "n = 2", output: [0, 1, 1] },
    { input: "n = 5", output: [0, 1, 1, 2, 1, 2] },
  ],
  solutions: [perNumber, shiftDp, lowBitDp],
});

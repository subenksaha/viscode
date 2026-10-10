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
  idea: "Count the set bits of every i from 0 to n independently, clearing the lowest set bit each time.",
  code: code(`
    function countBits(n: number): number[] {
      const ans: number[] = []; //@init
      for (let i = 0; i <= n; i++) { //@loop
        let x = i, c = 0;
        while (x) { x &= x - 1; c++; } //@count
        ans.push(c); //@push
      }
      return ans; //@ret
    }
  `),
  run({ n }, t) {
    const ans: number[] = [];
    const w = bitWidth(n);
    t.step("init", "Empty answer.", [arr("ans", ans)]);
    for (let i = 0; i <= n; i++) {
      t.step("loop", `i = ${i}.`, [bits(`${i} in binary`, i, w), arr("ans", ans)]);
      let x = i,
        c = 0;
      while (x) {
        x &= x - 1;
        c++;
      }
      t.step("count", `${i} has ${c} set bit(s).`, [bits(`${i} in binary`, i, w), arr("ans", ans)]);
      ans.push(c);
      t.step("push", `ans[${i}] = ${c}.`, [arr("ans", ans, { tones: tones([i, "success"]) })]);
    }
    t.step("ret", "Return ans.", [arr("ans", ans)]);
    return ans;
  },
});

const shiftDp = defineSolution<Input>({
  id: "dp-shift",
  name: "DP: Drop the Last Bit",
  time: "O(n)",
  space: "O(1)",
  idea: "i >> 1 is i without its last bit, and it is smaller, so its answer is already known: dp[i] = dp[i >> 1] + (i & 1).",
  code: code(`
    function countBits(n: number): number[] {
      const dp = new Array(n + 1).fill(0); //@init
      for (let i = 1; i <= n; i++) { //@loop
        dp[i] = dp[i >> 1] + (i & 1); //@dp
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
  code: code(`
    function countBits(n: number): number[] {
      const dp = new Array(n + 1).fill(0); //@init
      for (let i = 1; i <= n; i++) { //@loop
        dp[i] = dp[i & (i - 1)] + 1; //@dp
      }
      return dp; //@ret
    }
  `),
  run({ n }, t) {
    const dp = new Array(n + 1).fill(0);
    t.step("init", "dp[0] = 0.", [arr("dp", dp)]);
    for (let i = 1; i <= n; i++) {
      const j = i & (i - 1);
      t.step("loop", `i = ${i}: i & (i − 1) = ${j}.`, [vars({ i, prev: j }), arr("dp", dp, { tones: tones([j, "compare"], [i, "active"]) })]);
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

import { arr, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  nums: number[];
}

const bruteForce = defineSolution<Input>({
  id: "brute-force",
  name: "Brute Force",
  time: "O(n²)",
  space: "O(1)",
  idea: "Fix each start and extend the end while keeping a running product.",
  code: code(`
    function maxProduct(nums: number[]): number {
      let best = -Infinity; //@init
      for (let i = 0; i < nums.length; i++) { //@i
        let product = 1;
        for (let j = i; j < nums.length; j++) { //@j
          product *= nums[j]; //@prod
          best = Math.max(best, product); //@best
        }
      }
      return best; //@ret
    }
  `),
  run({ nums }, t) {
    let best = -Infinity;
    const view = (i?: number, j?: number, prod?: number) => [
      vars({ product: prod, best: best === -Infinity ? "-∞" : best }),
      arr("nums", nums, { window: i !== undefined && j !== undefined ? [i, j] : null, tones: tones([j, "active"]), pointers: { i, j } }),
    ];
    t.step("init", "best = -∞.", view());
    for (let i = 0; i < nums.length; i++) {
      let prod = 1;
      t.step("i", `Start at i = ${i}.`, view(i));
      for (let j = i; j < nums.length; j++) {
        prod *= nums[j];
        t.step("prod", `Product of [${i}..${j}] = ${prod}.`, view(i, j, prod));
        best = Math.max(best, prod);
        t.step("best", `best = ${best}.`, view(i, j, prod));
      }
    }
    t.step("ret", `Return ${best}.`, view());
    return best;
  },
});

const minMax = defineSolution<Input>({
  id: "min-max",
  name: "Track Max & Min Product",
  time: "O(n)",
  space: "O(1)",
  idea: "A negative number turns the smallest product into the largest. Keep both the max and min product ending at each index.",
  code: code(`
    function maxProduct(nums: number[]): number {
      // Track both the biggest and smallest product ending here:
      // a negative number turns the smallest into the biggest.
      let maxEndingHere = nums[0]; //@init
      let minEndingHere = nums[0];
      let best = nums[0];
      for (let i = 1; i < nums.length; i++) { //@loop
        const num = nums[i];
        const candidates = [num, maxEndingHere * num, minEndingHere * num]; //@cand
        maxEndingHere = Math.max(...candidates); //@hi
        minEndingHere = Math.min(...candidates); //@lo
        best = Math.max(best, maxEndingHere); //@best
      }
      return best; //@ret
    }
  `),
  run({ nums }, t) {
    let hi = nums[0],
      lo = nums[0],
      best = nums[0];
    const view = (i: number, extra: Record<string, unknown> = {}) => [
      vars({ maxEndingHere: hi, minEndingHere: lo, best, ...extra }),
      arr("nums", nums, { tones: tones([i, "active"]), pointers: { i } }),
    ];
    t.step("init", `maxEndingHere = minEndingHere = best = ${nums[0]}.`, view(0));
    for (let i = 1; i < nums.length; i++) {
      const x = nums[i];
      t.step("loop", `num = ${x}.`, view(i));
      const c = [x, hi * x, lo * x];
      t.step("cand", `Candidates: num = ${c[0]}, max·num = ${c[1]}, min·num = ${c[2]}.`, view(i, { candidates: c }));
      hi = Math.max(...c);
      t.step("hi", `maxEndingHere = ${hi}.`, view(i));
      lo = Math.min(...c);
      t.step("lo", `minEndingHere = ${lo}.`, view(i));
      best = Math.max(best, hi);
      t.step("best", `best = ${best}.`, view(i));
    }
    t.step("ret", `Return ${best}.`, view(nums.length - 1));
    return best;
  },
});

const prefixSuffix = defineSolution<Input>({
  id: "prefix-suffix",
  name: "Prefix & Suffix Products",
  time: "O(n)",
  space: "O(1)",
  idea: "The answer is always a prefix or suffix product of some zero-free segment. Scan both directions and restart the product after a zero.",
  code: code(`
    function maxProduct(nums: number[]): number {
      const n = nums.length;
      let prefix = 1; // product from the left, restarting after a 0 //@init
      let suffix = 1; // product from the right, restarting after a 0
      let best = -Infinity;
      for (let i = 0; i < n; i++) { //@loop
        if (prefix === 0) prefix = 1;
        prefix *= nums[i]; //@pre
        if (suffix === 0) suffix = 1;
        suffix *= nums[n - 1 - i]; //@suf
        best = Math.max(best, prefix, suffix); //@best
      }
      return best; //@ret
    }
  `),
  run({ nums }, t) {
    const n = nums.length;
    let pre = 1,
      suf = 1,
      best = -Infinity;
    const view = (i?: number) => [
      vars({ prefix: pre, suffix: suf, best: best === -Infinity ? "-∞" : best }),
      arr("nums", nums, {
        tones: tones([i, "active"], [i !== undefined ? n - 1 - i : null, "compare"]),
        pointers: { i, j: i !== undefined ? n - 1 - i : null },
      }),
    ];
    t.step("init", "pre = suf = 1.", view());
    for (let i = 0; i < n; i++) {
      t.step("loop", `Left index ${i}, right index ${n - 1 - i}.`, view(i));
      pre = (pre === 0 ? 1 : pre) * nums[i];
      t.step("pre", `Prefix product = ${pre}.`, view(i));
      suf = (suf === 0 ? 1 : suf) * nums[n - 1 - i];
      t.step("suf", `Suffix product = ${suf}.`, view(i));
      best = Math.max(best, pre, suf);
      t.step("best", `best = ${best}.`, view(i));
    }
    t.step("ret", `Return ${best}.`, view());
    return best;
  },
});

export default defineProblem<Input>({
  description: "Find the contiguous subarray with the largest product and return that product.",
  input: { default: "nums = [2,3,-2,4,-1]", parse: (a) => ({ nums: a.ints("nums") }) },
  examples: [
    { input: "nums = [2,3,-2,4]", output: 6 },
    { input: "nums = [-2,0,-1]", output: 0 },
    { input: "nums = [2,3,-2,4,-1]", output: 48 },
  ],
  normalize: (v) => (Object.is(v, -0) ? 0 : v),
  solutions: [bruteForce, prefixSuffix, minMax],
});

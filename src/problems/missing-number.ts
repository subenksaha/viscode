import { arr, map, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  nums: number[];
}

const sorting = defineSolution<Input>({
  id: "sort",
  name: "Sort",
  time: "O(n log n)",
  space: "O(1)*",
  idea: "After sorting, nums[i] should equal i. The first index where it does not is the missing number.",
  code: code(`
    function missingNumber(nums: number[]): number {
      nums.sort((a, b) => a - b); //@sort
      for (let i = 0; i < nums.length; i++) { //@loop
        if (nums[i] !== i) return i; //@found
      }
      return nums.length; //@ret
    }
  `),
  run({ nums }, t) {
    nums.sort((a, b) => a - b);
    t.step("sort", "Sort nums.", [arr("nums", nums)]);
    for (let i = 0; i < nums.length; i++) {
      const miss = nums[i] !== i;
      t.step(miss ? "found" : "loop", miss ? `nums[${i}] = ${nums[i]} ≠ ${i}. ${i} is missing.` : `nums[${i}] = ${i} ✓.`, [
        arr("nums", nums, { tones: tones([i, miss ? "danger" : "success"]), pointers: { i } }),
      ]);
      if (miss) return i;
    }
    t.step("ret", `Every index matched, so ${nums.length} is missing.`, [arr("nums", nums)]);
    return nums.length;
  },
});

const hashSet = defineSolution<Input>({
  id: "hash-set",
  name: "Hash Set",
  time: "O(n)",
  space: "O(n)",
  idea: "Put all numbers in a set, then check 0..n for the one that is absent.",
  code: code(`
    function missingNumber(nums: number[]): number {
      const seen = new Set(nums); //@build
      for (let value = 0; value <= nums.length; value++) { //@loop
        if (!seen.has(value)) return value; //@found
      }
      return -1;
    }
  `),
  run({ nums }, t) {
    const set = new Set(nums);
    t.step("build", "Put every number into a set.", [map("set", set)]);
    for (let x = 0; x <= nums.length; x++) {
      const miss = !set.has(x);
      t.step(miss ? "found" : "loop", miss ? `${x} is not in the set.` : `${x} is present.`, [
        vars({ value: x }),
        map("set", set, tones([x, "success"])),
      ]);
      if (miss) return x;
    }
    return -1;
  },
});

const gauss = defineSolution<Input>({
  id: "sum-formula",
  name: "Sum Formula",
  time: "O(n)",
  space: "O(1)",
  idea: "0 + 1 + … + n = n(n+1)/2. Subtract the actual sum, and what is left is the missing number.",
  code: code(`
    function missingNumber(nums: number[]): number {
      const n = nums.length;
      let remaining = (n * (n + 1)) / 2; // sum of 0 + 1 + ... + n //@expected
      for (const num of nums) remaining -= num; //@loop
      return remaining; // whatever is left is the missing number //@ret
    }
  `),
  run({ nums }, t) {
    const n = nums.length;
    let expected = (n * (n + 1)) / 2;
    t.step("expected", `Expected sum of 0..${n} = ${expected}.`, [vars({ expected }), arr("nums", nums)]);
    nums.forEach((x, i) => {
      expected -= x;
      t.step("loop", `Subtract ${x}: ${expected}.`, [vars({ remaining: expected }), arr("nums", nums, { tones: tones([i, "active"]) })]);
    });
    t.step("ret", `Return ${expected}.`, [vars({ missing: expected })]);
    return expected;
  },
});

const xor = defineSolution<Input>({
  id: "xor",
  name: "XOR",
  time: "O(n)",
  space: "O(1)",
  idea: "XOR all indices 0..n and all values. Every present number cancels with its index (x ^ x = 0), leaving only the missing one.",
  code: code(`
    function missingNumber(nums: number[]): number {
      // XOR-ing a number twice cancels it out (a ^ a = 0).
      // XOR every index 0..n and every value: only the missing number is left.
      let result = nums.length; //@init
      for (let i = 0; i < nums.length; i++) { //@loop
        result = result ^ i ^ nums[i]; //@xor
      }
      return result; //@ret
    }
  `),
  run({ nums }, t) {
    let x = nums.length;
    t.step("init", `Start with n = ${x} (the index that has no slot).`, [vars({ result: x }), arr("nums", nums)]);
    for (let i = 0; i < nums.length; i++) {
      t.step("loop", `i = ${i}, nums[i] = ${nums[i]}.`, [vars({ result: x }), arr("nums", nums, { tones: tones([i, "active"]) })]);
      x ^= i ^ nums[i];
      t.step("xor", `result ^= ${i} ^ ${nums[i]} → ${x}.`, [vars({ result: x }), arr("nums", nums, { tones: tones([i, "active"]) })]);
    }
    t.step("ret", `Everything else cancelled. Return ${x}.`, [vars({ result: x })]);
    return x;
  },
});

export default defineProblem<Input>({
  description: "nums holds n distinct numbers from the range [0, n]. Return the only number in that range that is missing.",
  input: { default: "nums = [3,0,1]", parse: (a) => ({ nums: a.ints("nums") }) },
  examples: [
    { input: "nums = [3,0,1]", output: 2 },
    { input: "nums = [0,1]", output: 2 },
    { input: "nums = [9,6,4,2,3,5,7,0,1]", output: 8 },
  ],
  solutions: [sorting, hashSet, gauss, xor],
});

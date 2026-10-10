import { arr, bits, bitWidth, map, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  nums: number[];
}

const hashSet = defineSolution<Input>({
  id: "hash-set",
  name: "Hash Set Toggle",
  time: "O(n)",
  space: "O(n)",
  idea: "Add a number the first time it appears and remove it the second time. Only the single number is left in the set.",
  code: code(`
    function singleNumber(nums: number[]): number {
      const seen = new Set<number>();
      for (const x of nums) { //@loop
        if (seen.has(x)) seen.delete(x); //@remove
        else seen.add(x); //@add
      }
      return [...seen][0]; //@ret
    }
  `),
  run({ nums }, t) {
    const seen = new Set<number>();
    nums.forEach((x, i) => {
      const had = seen.has(x);
      if (had) seen.delete(x);
      else seen.add(x);
      t.step(had ? "remove" : "add", had ? `${x} seen before: remove it.` : `First ${x}: add it.`, [arr("nums", nums, { tones: tones([i, "active"]) }), map("seen", seen, had ? {} : tones([String(x), "success"]))]);
    });
    const res = [...seen][0];
    t.step("ret", `Only ${res} remains.`, [map("seen", seen, tones([String(res), "success"]))]);
    return res;
  },
});

const xor = defineSolution<Input>({
  id: "xor",
  name: "XOR Everything",
  time: "O(n)",
  space: "O(1)",
  idea: "x ^ x = 0 and x ^ 0 = x, and XOR is order-independent. XOR all numbers: every pair cancels, leaving the single number.",
  code: code(`
    function singleNumber(nums: number[]): number {
      let acc = 0; //@init
      for (const x of nums) acc ^= x; //@xor
      return acc; //@ret
    }
  `),
  run({ nums }, t) {
    let acc = 0;
    const w = bitWidth(...nums);
    t.step("init", "acc = 0.", [vars({ acc }), bits("acc", acc, w)]);
    nums.forEach((x, i) => {
      acc ^= x;
      t.step("xor", `acc ^= ${x} → ${acc}.`, [vars({ acc }), arr("nums", nums, { tones: tones([i, "active"]) }), bits(`${x}`, x, w), bits("acc", acc, w)]);
    });
    t.step("ret", `Return ${acc}.`, [vars({ acc }), bits("acc", acc, w)]);
    return acc;
  },
});

export default defineProblem<Input>({
  description: "Every element of a non-empty array appears twice except for one. Find that single one in linear time and constant extra space.",
  input: { default: "nums = [4,1,2,1,2]", parse: (a) => ({ nums: a.ints("nums") }) },
  examples: [
    { input: "nums = [2,2,1]", output: 1 },
    { input: "nums = [4,1,2,1,2]", output: 4 },
    { input: "nums = [1]", output: 1 },
  ],
  solutions: [hashSet, xor],
});

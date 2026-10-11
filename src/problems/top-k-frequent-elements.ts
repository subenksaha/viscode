import { arr, map, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  nums: number[];
  k: number;
}

const sortByCount = defineSolution<Input>({
  id: "count-sort",
  name: "Count + Sort",
  time: "O(n log n)",
  space: "O(n)",
  idea: "Count each value with a hash map, sort the distinct values by count (descending) and take the first k.",
  code: code(`
    function topKFrequent(nums: number[], k: number): number[] {
      const count = new Map<number, number>();
      for (const num of nums) count.set(num, (count.get(num) ?? 0) + 1); //@count
      const distinct = [...count.keys()];
      distinct.sort((a, b) => count.get(b)! - count.get(a)!); // most frequent first //@sort
      return distinct.slice(0, k); //@ret
    }
  `),
  run({ nums, k }, t) {
    const count = new Map<number, number>();
    nums.forEach((x, i) => {
      count.set(x, (count.get(x) ?? 0) + 1);
      t.step("count", `count[${x}] = ${count.get(x)}.`, [arr("nums", nums, { tones: tones([i, "active"]) }), map("count", count, tones([String(x), "success"]))]);
    });
    const keys = [...count.keys()].sort((a, b) => count.get(b)! - count.get(a)!);
    t.step("sort", "Sort distinct values by frequency, highest first.", [arr("by frequency", keys.map((x) => `${x} ×${count.get(x)}`), { indexLabels: false })]);
    const res = keys.slice(0, k);
    t.step("ret", `Take the first ${k}: [${res}].`, [
      arr("by frequency", keys.map((x) => `${x} ×${count.get(x)}`), { indexLabels: false, tones: tones(...keys.map((_, i) => [i < k ? i : null, "success"] as [number | null, Tone])) }),
    ]);
    return res;
  },
});

const bucket = defineSolution<Input>({
  id: "bucket-sort",
  name: "Bucket Sort by Frequency",
  time: "O(n)",
  space: "O(n)",
  idea: "A frequency is at most n, so drop each value into bucket[frequency]. Walk the buckets from the highest frequency down until k values are collected.",
  code: code(`
    function topKFrequent(nums: number[], k: number): number[] {
      const count = new Map<number, number>();
      for (const num of nums) count.set(num, (count.get(num) ?? 0) + 1); //@count
      // buckets[f] = numbers that appear exactly f times
      const buckets: number[][] = Array.from({ length: nums.length + 1 }, () => []);
      for (const [num, frequency] of count) buckets[frequency].push(num); //@bucket
      const result: number[] = [];
      // Walk from the highest frequency down until we have k numbers.
      for (let frequency = nums.length; frequency > 0 && result.length < k; frequency--) { //@scan
        for (const num of buckets[frequency]) {
          if (result.length < k) result.push(num); //@take
        }
      }
      return result; //@ret
    }
  `),
  run({ nums, k }, t) {
    const count = new Map<number, number>();
    for (const x of nums) count.set(x, (count.get(x) ?? 0) + 1);
    t.step("count", "Count every value.", [arr("nums", nums), map("count", count)]);
    const buckets: number[][] = Array.from({ length: nums.length + 1 }, () => []);
    const res: number[] = [];
    const view = (f?: number) => [
      vars({ k }),
      arr("buckets (index = frequency)", buckets.map((b) => (b.length ? `[${b}]` : "")), { tones: tones([f, "active"]), pointers: { frequency: f } }),
      arr("result", res, { indexLabels: false }),
    ];
    for (const [x, c] of count) {
      buckets[c].push(x);
      t.step("bucket", `${x} appears ${c} time${c > 1 ? "s" : ""}: bucket[${c}].`, view(c));
    }
    for (let f = nums.length; f > 0 && res.length < k; f--) {
      if (!buckets[f].length) {
        t.step("scan", `bucket[${f}] is empty.`, view(f));
        continue;
      }
      for (const x of buckets[f])
        if (res.length < k) {
          res.push(x);
          t.step("take", `Take ${x} (frequency ${f}).`, view(f));
        }
    }
    t.step("ret", `Return [${res}].`, view());
    return res;
  },
});

export default defineProblem<Input>({
  description: "Given an integer array nums and an integer k, return the k most frequent elements, in any order. The answer is guaranteed to be unique.",
  input: { default: "nums = [1,1,1,2,2,3,4,4,4,4], k = 2", parse: (a) => ({ nums: a.ints("nums"), k: a.int("k") }) },
  examples: [
    { input: "nums = [1,1,1,2,2,3], k = 2", output: [1, 2] },
    { input: "nums = [1], k = 1", output: [1] },
    { input: "nums = [4,1,-1,2,-1,2,3], k = 2", output: [-1, 2] },
  ],
  normalize: (v) => [...(v as number[])].sort((a, b) => a - b),
  solutions: [sortByCount, bucket],
});

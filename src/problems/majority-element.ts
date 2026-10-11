import { arr, map, range, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  nums: number[];
}

const hashCount = defineSolution<Input>({
  id: "hash-count",
  name: "Hash Map Count",
  time: "O(n)",
  space: "O(n)",
  idea: "Count each value. The first one whose count exceeds n/2 is the answer.",
  code: code(`
    function majorityElement(nums: number[]): number {
      const count = new Map<number, number>(); //@init
      for (const num of nums) { //@loop
        count.set(num, (count.get(num) ?? 0) + 1); //@count
        if (count.get(num)! > nums.length / 2) return num; //@found
      }
      return -1;
    }
  `),
  run({ nums }, t) {
    const count = new Map<number, number>();
    const half = nums.length / 2;
    const view = (i?: number, done = false) => [
      vars({ "n / 2": half }),
      arr("nums", nums, { tones: tones([i, done ? "success" : "active"]), pointers: { i } }),
      map("count", count, tones([i !== undefined ? nums[i] : null, done ? "success" : "active"])),
    ];
    t.step("init", "Empty count map.", view());
    for (let i = 0; i < nums.length; i++) {
      const x = nums[i];
      count.set(x, (count.get(x) ?? 0) + 1);
      t.step("count", `count[${x}] = ${count.get(x)}.`, view(i));
      if (count.get(x)! > half) {
        t.step("found", `${count.get(x)} > ${half}. Return ${x}.`, view(i, true));
        return x;
      }
    }
    return -1;
  },
});

const sorting = defineSolution<Input>({
  id: "sort",
  name: "Sort and Take the Middle",
  time: "O(n log n)",
  space: "O(1)",
  idea: "After sorting, a value that fills more than half the array must cover the middle index.",
  code: code(`
    function majorityElement(nums: number[]): number {
      nums.sort((a, b) => a - b); //@sort
      // The majority fills more than half the array, so it must cover the middle.
      const middle = Math.floor(nums.length / 2);
      return nums[middle]; //@ret
    }
  `),
  run({ nums }, t) {
    t.step("sort", "Sort the array.", [arr("nums", nums)]);
    nums.sort((a, b) => a - b);
    const mid = nums.length >> 1;
    const x = nums[mid];
    const first = nums.indexOf(x),
      last = nums.lastIndexOf(x);
    t.step("ret", `The run of ${x} spans [${first}, ${last}], which covers the middle index ${mid}.`, [
      arr("sorted nums", nums, { tones: tones(...range(first, last, "compare"), [mid, "success"]), pointers: { mid } }),
    ]);
    return x;
  },
});

const boyerMoore = defineSolution<Input>({
  id: "boyer-moore",
  name: "Boyer–Moore Voting",
  time: "O(n)",
  space: "O(1)",
  idea: "Keep a candidate and a counter. Matching values vote for it, others vote against. When the counter hits zero, pick the current value. The majority survives all cancellations.",
  code: code(`
    function majorityElement(nums: number[]): number {
      let candidate = 0; //@init
      let count = 0;
      for (const num of nums) { //@loop
        if (count === 0) candidate = num; //@pick
        // Votes for the candidate add one; votes against cancel one out.
        if (num === candidate) count++; //@vote
        else count--;
      }
      return candidate; //@ret
    }
  `),
  run({ nums }, t) {
    let candidate: number | undefined,
      count = 0;
    const view = (i?: number) => [
      vars({ candidate, count }),
      arr("nums", nums, {
        tones: tones(...nums.map((v, k) => [i !== undefined && k <= i && v === candidate ? k : null, "success"] as [number | null, "success"]), [i, "active"]),
        pointers: { i },
      }),
    ];
    t.step("init", "No candidate yet; count = 0.", view());
    for (let i = 0; i < nums.length; i++) {
      const x = nums[i];
      if (count === 0) {
        candidate = x;
        t.step("pick", `count is 0: pick ${x} as the new candidate.`, view(i));
      }
      count += x === candidate ? 1 : -1;
      t.step("vote", x === candidate ? `${x} votes for the candidate: count = ${count}.` : `${x} votes against: count = ${count}.`, view(i));
    }
    t.step("ret", `Return ${candidate}.`, view());
    return candidate;
  },
});

export default defineProblem<Input>({
  description: "Given an array nums of size n, return the majority element: the value that appears more than ⌊n / 2⌋ times. It always exists.",
  input: { default: "nums = [2,2,1,1,1,2,2]", parse: (a) => ({ nums: a.ints("nums") }) },
  examples: [
    { input: "nums = [3,2,3]", output: 3 },
    { input: "nums = [2,2,1,1,1,2,2]", output: 2 },
  ],
  solutions: [hashCount, sorting, boyerMoore],
});

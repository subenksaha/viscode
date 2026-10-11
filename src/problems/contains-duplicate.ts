import { arr, map, tones } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  nums: number[];
}

const bruteForce = defineSolution<Input>({
  id: "brute-force",
  name: "Brute Force",
  time: "O(n²)",
  space: "O(1)",
  idea: "Compare every pair of elements.",
  approach: [
    {
      title: "Pick each element",
      detail: "Fix index i and compare it with everything after it.",
      at: "i",
    },
    {
      title: "Compare against later elements",
      detail: "For every j > i, check nums[i] === nums[j]. Without sorting or memory, this is the only way, so it costs O(n²).",
      at: "j",
    },
    {
      title: "Stop at the first equal pair",
      detail: "One duplicate is enough to answer true. If no pair matches, the answer is false.",
      at: "found",
    },
  ],
  code: code(`
    function containsDuplicate(nums: number[]): boolean {
      for (let i = 0; i < nums.length; i++) { //@i
        for (let j = i + 1; j < nums.length; j++) { //@j
          if (nums[i] === nums[j]) return true; //@found
        }
      }
      return false; //@ret
    }
  `),
  run({ nums }, t) {
    const view = (i: number, j?: number, hit = false) => [
      arr("nums", nums, {
        tones: tones([i, hit ? "danger" : "active"], [j, hit ? "danger" : "compare"]),
        pointers: { i, j },
      }),
    ];
    for (let i = 0; i < nums.length; i++) {
      t.step("i", `i = ${i}.`, view(i));
      for (let j = i + 1; j < nums.length; j++) {
        t.step("j", `Compare nums[${i}] = ${nums[i]} with nums[${j}] = ${nums[j]}.`, view(i, j));
        if (nums[i] === nums[j]) {
          t.step("found", `Equal. Duplicate found.`, view(i, j, true));
          return true;
        }
      }
    }
    t.step("ret", "No equal pair. Return false.");
    return false;
  },
});

const sorting = defineSolution<Input>({
  id: "sort",
  name: "Sort",
  time: "O(n log n)",
  space: "O(1)*",
  idea: "After sorting, duplicates sit next to each other, so compare neighbors.",
  approach: [
    {
      title: "Sort so equal values touch",
      detail: "After sorting, equal values must be next to each other. Sorting is O(n log n) and is done in place.",
      at: "sort",
    },
    {
      title: "Compare neighbors",
      detail: "Walk once and compare each element with the one before it. This replaces the all-pairs check with n − 1 comparisons.",
      at: "loop",
    },
    {
      title: "Equal neighbors mean a duplicate",
      detail: "The first pair of equal neighbors proves a duplicate exists.",
      at: "found",
    },
  ],
  code: code(`
    function containsDuplicate(nums: number[]): boolean {
      nums.sort((a, b) => a - b); //@sort
      for (let i = 1; i < nums.length; i++) { //@loop
        if (nums[i] === nums[i - 1]) return true; //@found
      }
      return false; //@ret
    }
  `),
  run({ nums }, t) {
    nums.sort((a, b) => a - b);
    const view = (i?: number, hit = false) => [
      arr("sorted nums", nums, {
        tones: i === undefined ? {} : tones([i - 1, hit ? "danger" : "compare"], [i, hit ? "danger" : "active"]),
        pointers: { i },
      }),
    ];
    t.step("sort", "Sort the array.", view());
    for (let i = 1; i < nums.length; i++) {
      t.step("loop", `Compare nums[${i - 1}] = ${nums[i - 1]} and nums[${i}] = ${nums[i]}.`, view(i));
      if (nums[i] === nums[i - 1]) {
        t.step("found", "Neighbors are equal. Duplicate found.", view(i, true));
        return true;
      }
    }
    t.step("ret", "No equal neighbors. Return false.", view());
    return false;
  },
});

const hashSet = defineSolution<Input>({
  id: "hash-set",
  name: "Hash Set",
  time: "O(n)",
  space: "O(n)",
  idea: "Remember every value seen. Seeing one again means a duplicate.",
  approach: [
    {
      title: "Start with an empty set",
      detail: "The set records every value seen so far, with O(1) lookup.",
      at: "init",
    },
    {
      title: "Add unseen values",
      detail: "If the current value is new, add it and continue.",
      at: "add",
    },
    {
      title: "A repeat lookup ends it",
      detail: "If the value is already in the set, it appeared before, so return true. One pass, O(n) time and O(n) space.",
      at: "found",
    },
  ],
  code: code(`
    function containsDuplicate(nums: number[]): boolean {
      const seen = new Set<number>(); //@init
      for (const num of nums) { //@loop
        if (seen.has(num)) return true; //@found
        seen.add(num); //@add
      }
      return false; //@ret
    }
  `),
  run({ nums }, t) {
    const seen = new Set<number>();
    const view = (i?: number, hit = false) => [
      arr("nums", nums, { tones: tones([i, hit ? "danger" : "active"]), pointers: { i } }),
      map("seen", seen, tones([i !== undefined ? nums[i] : null, hit ? "danger" : "compare"])),
    ];
    t.step("init", "Start with an empty set.", view());
    for (let i = 0; i < nums.length; i++) {
      const x = nums[i];
      t.step("loop", `x = ${x}.`, view(i));
      if (seen.has(x)) {
        t.step("found", `${x} is already in the set. Duplicate.`, view(i, true));
        return true;
      }
      seen.add(x);
      t.step("add", `Add ${x} to the set.`, view(i));
    }
    t.step("ret", "All values distinct. Return false.", view());
    return false;
  },
});

export default defineProblem<Input>({
  description: "Return true if any value appears at least twice in nums, and false if every element is distinct.",
  input: { default: "nums = [1,2,3,1]", parse: (a) => ({ nums: a.ints("nums") }) },
  examples: [
    { input: "nums = [1,2,3,1]", output: true },
    { input: "nums = [1,2,3,4]", output: false },
    { input: "nums = [1,1,1,3,3,4,3,2,4,2]", output: true },
  ],
  solutions: [bruteForce, sorting, hashSet],
});

import { arr, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  numbers: number[];
  target: number;
}

const binarySearch = defineSolution<Input>({
  id: "binary-search",
  name: "Binary Search for the Complement",
  time: "O(n log n)",
  space: "O(1)",
  idea: "For each i, binary-search the part of the sorted array to its right for target − numbers[i].",
  code: code(`
    function twoSum(numbers: number[], target: number): number[] {
      for (let i = 0; i < numbers.length; i++) { //@i
        const need = target - numbers[i];
        let lo = i + 1, hi = numbers.length - 1;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1; //@mid
          if (numbers[mid] === need) return [i + 1, mid + 1]; //@found
          if (numbers[mid] < need) lo = mid + 1;
          else hi = mid - 1;
        }
      }
      return []; //@none
    }
  `),
  run({ numbers, target }, t) {
    const view = (i: number, lo?: number, hi?: number, mid?: number, hit = false) => [
      vars({ target, need: target - numbers[i] }),
      arr("numbers", numbers, {
        tones: tones([i, "active"], [mid, hit ? "success" : "compare"]),
        pointers: { i, lo, hi },
        window: lo !== undefined && hi !== undefined && lo <= hi ? [lo, hi] : null,
      }),
    ];
    for (let i = 0; i < numbers.length; i++) {
      const need = target - numbers[i];
      let lo = i + 1,
        hi = numbers.length - 1;
      t.step("i", `i = ${i}: look for ${need} in [${lo}, ${hi}].`, view(i, lo, hi));
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (numbers[mid] === need) {
          t.step("found", `numbers[${mid}] = ${need}. Return [${i + 1}, ${mid + 1}] (1-indexed).`, view(i, lo, hi, mid, true));
          return [i + 1, mid + 1];
        }
        t.step("mid", `numbers[${mid}] = ${numbers[mid]} is ${numbers[mid] < need ? "too small: go right" : "too big: go left"}.`, view(i, lo, hi, mid));
        if (numbers[mid] < need) lo = mid + 1;
        else hi = mid - 1;
      }
    }
    t.step("none", "No pair found.");
    return [];
  },
});

const twoPointers = defineSolution<Input>({
  id: "two-pointers",
  name: "Two Pointers",
  time: "O(n)",
  space: "O(1)",
  idea: "Start at both ends. Since the array is sorted, a sum that is too small can only grow by moving l right, and a sum that is too big can only shrink by moving r left.",
  code: code(`
    function twoSum(numbers: number[], target: number): number[] {
      let l = 0, r = numbers.length - 1; //@init
      while (l < r) {
        const sum = numbers[l] + numbers[r]; //@sum
        if (sum === target) return [l + 1, r + 1]; //@found
        if (sum < target) l++; //@left
        else r--; //@right
      }
      return []; //@none
    }
  `),
  run({ numbers, target }, t) {
    let l = 0,
      r = numbers.length - 1;
    const view = (sum?: number, tone: Tone = "active") => [
      vars({ target, sum }),
      arr("numbers", numbers, { tones: tones([l, tone], [r, tone]), pointers: { l, r }, window: [l, r] }),
    ];
    t.step("init", "l at the smallest value, r at the largest.", view());
    while (l < r) {
      const sum = numbers[l] + numbers[r];
      t.step("sum", `${numbers[l]} + ${numbers[r]} = ${sum}.`, view(sum));
      if (sum === target) {
        t.step("found", `Hit the target. Return [${l + 1}, ${r + 1}].`, view(sum, "success"));
        return [l + 1, r + 1];
      }
      if (sum < target) {
        l++;
        t.step("left", "Too small: move l right.", view());
      } else {
        r--;
        t.step("right", "Too big: move r left.", view());
      }
    }
    t.step("none", "Pointers met. No pair.");
    return [];
  },
});

export default defineProblem<Input>({
  description: "Given a 1-indexed array of integers sorted in non-decreasing order, find two numbers that add up to target and return their indices [index1, index2] (1-indexed). Use only constant extra space.",
  input: { default: "numbers = [1,3,4,5,7,10,11], target = 9", parse: (a) => ({ numbers: a.ints("numbers"), target: a.int("target") }) },
  examples: [
    { input: "numbers = [2,7,11,15], target = 9", output: [1, 2] },
    { input: "numbers = [2,3,4], target = 6", output: [1, 3] },
    { input: "numbers = [-1,0], target = -1", output: [1, 2] },
  ],
  solutions: [binarySearch, twoPointers],
});

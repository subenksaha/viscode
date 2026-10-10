import { arr, range, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  nums: number[];
  target: number;
}

const linear = defineSolution<Input>({
  id: "linear",
  name: "Linear Scan",
  time: "O(n)",
  space: "O(1)",
  idea: "Check every element from left to right. This ignores the fact that the array is sorted.",
  code: code(`
    function search(nums: number[], target: number): number {
      for (let i = 0; i < nums.length; i++) //@loop
        if (nums[i] === target) return i; //@found
      return -1; //@none
    }
  `),
  run({ nums, target }, t) {
    for (let i = 0; i < nums.length; i++) {
      const hit = nums[i] === target;
      t.step(hit ? "found" : "loop", hit ? `nums[${i}] = ${target}. Return ${i}.` : `nums[${i}] = ${nums[i]} ≠ ${target}.`, [
        vars({ target }),
        arr("nums", nums, { tones: tones(...range(0, i - 1, "muted"), [i, hit ? "success" : "active"]), pointers: { i } }),
      ]);
      if (hit) return i;
    }
    t.step("none", "Not found. Return −1.", [arr("nums", nums, { tones: tones(...range(0, nums.length - 1, "muted")) })]);
    return -1;
  },
});

const binary = defineSolution<Input>({
  id: "binary-search",
  name: "Binary Search",
  time: "O(log n)",
  space: "O(1)",
  idea: "Keep a window [lo, hi] that must contain the target if it exists. Compare the middle element and throw away the half that cannot hold it.",
  code: code(`
    function search(nums: number[], target: number): number {
      let lo = 0, hi = nums.length - 1; //@init
      while (lo <= hi) { //@loop
        const mid = (lo + hi) >> 1; //@mid
        if (nums[mid] === target) return mid; //@found
        if (nums[mid] < target) lo = mid + 1; //@right
        else hi = mid - 1; //@left
      }
      return -1; //@none
    }
  `),
  run({ nums, target }, t) {
    let lo = 0,
      hi = nums.length - 1;
    const view = (mid?: number, hit = false) => [
      vars({ target, "nums[mid]": mid !== undefined ? nums[mid] : undefined }),
      arr("nums", nums, {
        tones: tones(...range(0, lo - 1, "muted"), ...range(hi + 1, nums.length - 1, "muted"), [mid, hit ? "success" : "active"]),
        pointers: { lo, mid, hi },
        window: lo <= hi ? [lo, hi] : null,
      }),
    ];
    t.step("init", "Search the whole array.", view());
    while (lo <= hi) {
      t.step("loop", `Window [${lo}, ${hi}].`, view());
      const mid = (lo + hi) >> 1;
      t.step("mid", `mid = ${mid}, nums[mid] = ${nums[mid]}.`, view(mid));
      if (nums[mid] === target) {
        t.step("found", `Found ${target} at ${mid}.`, view(mid, true));
        return mid;
      }
      if (nums[mid] < target) {
        lo = mid + 1;
        t.step("right", `${nums[mid]} < ${target}: discard the left half.`, view());
      } else {
        hi = mid - 1;
        t.step("left", `${nums[mid]} > ${target}: discard the right half.`, view());
      }
    }
    t.step("none", "Window is empty. Return −1.", view());
    return -1;
  },
});

export default defineProblem<Input>({
  description: "Given a sorted array of distinct integers nums and a target, return the index of target, or −1 if it is not present. You must write an O(log n) algorithm.",
  input: { default: "nums = [-1,0,3,5,9,12,15,20], target = 9", parse: (a) => ({ nums: a.ints("nums"), target: a.int("target") }) },
  examples: [
    { input: "nums = [-1,0,3,5,9,12], target = 9", output: 4 },
    { input: "nums = [-1,0,3,5,9,12], target = 2", output: -1 },
    { input: "nums = [5], target = 5", output: 0 },
  ],
  solutions: [linear, binary],
});

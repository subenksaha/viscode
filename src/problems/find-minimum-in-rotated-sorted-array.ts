import { arr, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  nums: number[];
}

const linear = defineSolution<Input>({
  id: "linear",
  name: "Linear Scan",
  time: "O(n)",
  space: "O(1)",
  idea: "The minimum is the first element smaller than its predecessor (the rotation point), or nums[0] if there is no drop.",
  code: code(`
    function findMin(nums: number[]): number {
      for (let i = 1; i < nums.length; i++) { //@loop
        if (nums[i] < nums[i - 1]) return nums[i]; //@drop
      }
      return nums[0]; //@ret
    }
  `),
  run({ nums }, t) {
    for (let i = 1; i < nums.length; i++) {
      t.step("loop", `Compare nums[${i - 1}] = ${nums[i - 1]} and nums[${i}] = ${nums[i]}.`, [
        arr("nums", nums, { tones: tones([i - 1, "compare"], [i, "active"]), pointers: { i } }),
      ]);
      if (nums[i] < nums[i - 1]) {
        t.step("drop", `Values drop here. ${nums[i]} is the minimum.`, [
          arr("nums", nums, { tones: tones([i, "success"]) }),
        ]);
        return nums[i];
      }
    }
    t.step("ret", "No drop: the array is not rotated. Return nums[0].", [
      arr("nums", nums, { tones: tones([0, "success"]) }),
    ]);
    return nums[0];
  },
});

const binarySearch = defineSolution<Input>({
  id: "binary-search",
  name: "Binary Search",
  time: "O(log n)",
  space: "O(1)",
  idea: "Compare the middle with the right end. If nums[mid] > nums[hi], the drop (and the minimum) is right of mid; otherwise it is at mid or to its left.",
  code: code(`
    function findMin(nums: number[]): number {
      let lo = 0, hi = nums.length - 1; //@init
      while (lo < hi) { //@loop
        const mid = (lo + hi) >> 1; //@mid
        if (nums[mid] > nums[hi]) lo = mid + 1; //@right
        else hi = mid; //@left
      }
      return nums[lo]; //@ret
    }
  `),
  run({ nums }, t) {
    let lo = 0,
      hi = nums.length - 1;
    const view = (mid?: number, done = false) => [
      vars({ lo, hi, mid }),
      arr("nums", nums, {
        window: [lo, hi],
        tones: done ? tones([lo, "success"]) : tones([mid, "active"], [hi, "compare"]),
        pointers: { lo, mid, hi },
      }),
    ];
    t.step("init", "Search the whole array.", view());
    while (lo < hi) {
      t.step("loop", `Range [${lo}..${hi}].`, view());
      const mid = (lo + hi) >> 1;
      t.step("mid", `mid = ${mid}; compare nums[mid] = ${nums[mid]} with nums[hi] = ${nums[hi]}.`, view(mid));
      if (nums[mid] > nums[hi]) {
        lo = mid + 1;
        t.step("right", `${nums[mid]} > ${nums[hi]}: the drop is right of mid. lo = ${lo}.`, view());
      } else {
        hi = mid;
        t.step("left", `${nums[mid]} ≤ ${nums[hi === mid ? mid : hi]}: the minimum is at mid or left of it. hi = ${hi}.`, view());
      }
    }
    t.step("ret", `lo = hi = ${lo}. Minimum is ${nums[lo]}.`, view(undefined, true));
    return nums[lo];
  },
});

export default defineProblem<Input>({
  description:
    "A sorted array of unique values was rotated an unknown number of times. Return its minimum element in O(log n) time.",
  input: { default: "nums = [4,5,6,7,0,1,2]", parse: (a) => ({ nums: a.ints("nums") }) },
  examples: [
    { input: "nums = [3,4,5,1,2]", output: 1 },
    { input: "nums = [4,5,6,7,0,1,2]", output: 0 },
    { input: "nums = [11,13,15,17]", output: 11 },
  ],
  solutions: [linear, binarySearch],
});

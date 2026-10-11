import { arr, tones, vars } from "@/core/panels";
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
  idea: "Check every element.",
  code: code(`
    function search(nums: number[], target: number): number {
      for (let i = 0; i < nums.length; i++) { //@loop
        if (nums[i] === target) return i; //@found
      }
      return -1; //@none
    }
  `),
  run({ nums, target }, t) {
    for (let i = 0; i < nums.length; i++) {
      const hit = nums[i] === target;
      t.step(hit ? "found" : "loop", hit ? `Found ${target} at ${i}.` : `nums[${i}] = ${nums[i]} ≠ ${target}.`, [
        vars({ target }),
        arr("nums", nums, { tones: tones([i, hit ? "success" : "active"]), pointers: { i } }),
      ]);
      if (hit) return i;
    }
    t.step("none", "Not found.");
    return -1;
  },
});

const pivotThenSearch = defineSolution<Input>({
  id: "pivot-then-search",
  name: "Find Pivot, Then Binary Search",
  time: "O(log n)",
  space: "O(1)",
  idea: "Binary search for the index of the minimum (the pivot). Both sides of it are sorted, so run a normal binary search on the side that can contain target.",
  code: code(`
    function search(nums: number[], target: number): number {
      // 1. Binary search for the smallest element: that is where the rotation happened.
      let left = 0;
      let right = nums.length - 1;
      while (left < right) { //@pivot
        const mid = Math.floor((left + right) / 2);
        if (nums[mid] > nums[right]) left = mid + 1;
        else right = mid;
      }
      const pivot = left; //@found-pivot
      // 2. Pick the sorted half that could contain target.
      const lastValue = nums[nums.length - 1];
      if (target >= nums[pivot] && target <= lastValue) { //@side
        left = pivot;
        right = nums.length - 1;
      } else {
        left = 0;
        right = pivot - 1;
      }
      // 3. Normal binary search in that half.
      while (left <= right) { //@loop
        const mid = Math.floor((left + right) / 2); //@mid
        if (nums[mid] === target) return mid; //@found
        if (nums[mid] < target) {
          left = mid + 1; //@right
        } else {
          right = mid - 1; //@left
        }
      }
      return -1; //@none
    }
  `),
  run({ nums, target }, t) {
    let lo = 0,
      hi = nums.length - 1;
    const view = (mid?: number, extra: Record<string, unknown> = {}, hit = false) => [
      vars({ target, left: lo, right: hi, mid, ...extra }),
      arr("nums", nums, {
        window: lo <= hi ? [lo, hi] : null,
        tones: tones([mid, hit ? "success" : "active"]),
        pointers: { left: lo, mid, right: hi },
      }),
    ];
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (nums[mid] > nums[hi]) lo = mid + 1;
      else hi = mid;
      t.step("pivot", `Pivot search: nums[${mid}] = ${nums[mid]} vs nums[hi]; range now [${lo}..${hi}].`, view(mid));
    }
    const pivot = lo;
    t.step("found-pivot", `Pivot (minimum) at index ${pivot}.`, view(pivot, { pivot }));
    [lo, hi] =
      target >= nums[pivot] && target <= nums[nums.length - 1] ? [pivot, nums.length - 1] : [0, pivot - 1];
    t.step("side", `Target belongs in sorted part [${lo}..${hi}].`, view(undefined, { pivot }));
    while (lo <= hi) {
      t.step("loop", `Range [${lo}..${hi}].`, view(undefined, { pivot }));
      const mid = (lo + hi) >> 1;
      t.step("mid", `mid = ${mid}, nums[mid] = ${nums[mid]}.`, view(mid, { pivot }));
      if (nums[mid] === target) {
        t.step("found", `Found ${target} at ${mid}.`, view(mid, { pivot }, true));
        return mid;
      }
      if (nums[mid] < target) {
        lo = mid + 1;
        t.step("right", "Too small: go right.", view(undefined, { pivot }));
      } else {
        hi = mid - 1;
        t.step("left", "Too big: go left.", view(undefined, { pivot }));
      }
    }
    t.step("none", "Not found.", view(undefined, { pivot }));
    return -1;
  },
});

const onePass = defineSolution<Input>({
  id: "one-pass",
  name: "One-pass Binary Search",
  time: "O(log n)",
  space: "O(1)",
  idea: "At every mid, at least one half is sorted. If target lies inside the sorted half's range, search there; otherwise search the other half.",
  code: code(`
    function search(nums: number[], target: number): number {
      let left = 0; //@init
      let right = nums.length - 1;
      while (left <= right) { //@loop
        const mid = Math.floor((left + right) / 2); //@mid
        if (nums[mid] === target) return mid; //@found
        // One of the two halves is always sorted. Check if target lies inside it.
        if (nums[left] <= nums[mid]) { //@left-sorted
          // Left half nums[left..mid] is sorted.
          if (nums[left] <= target && target < nums[mid]) {
            right = mid - 1; //@go-left-a
          } else {
            left = mid + 1; //@go-right-a
          }
        } else { //@right-sorted
          // Right half nums[mid..right] is sorted.
          if (nums[mid] < target && target <= nums[right]) {
            left = mid + 1; //@go-right-b
          } else {
            right = mid - 1; //@go-left-b
          }
        }
      }
      return -1; //@none
    }
  `),
  run({ nums, target }, t) {
    let lo = 0,
      hi = nums.length - 1;
    const view = (mid?: number, hit = false) => [
      vars({ target, left: lo, right: hi, mid }),
      arr("nums", nums, {
        window: lo <= hi ? [lo, hi] : null,
        tones: tones([mid, hit ? "success" : "active"]),
        pointers: { left: lo, mid, right: hi },
      }),
    ];
    t.step("init", "Search the whole array.", view());
    while (lo <= hi) {
      t.step("loop", `Range [${lo}..${hi}].`, view());
      const mid = (lo + hi) >> 1;
      t.step("mid", `mid = ${mid}, nums[mid] = ${nums[mid]}.`, view(mid));
      if (nums[mid] === target) {
        t.step("found", `Found ${target} at index ${mid}.`, view(mid, true));
        return mid;
      }
      if (nums[lo] <= nums[mid]) {
        t.step("left-sorted", `Left half [${lo}..${mid}] is sorted (${nums[lo]} ≤ ${nums[mid]}).`, view(mid));
        if (nums[lo] <= target && target < nums[mid]) {
          hi = mid - 1;
          t.step("go-left-a", `${target} is inside [${nums[lo]}, ${nums[mid]}): search left.`, view());
        } else {
          lo = mid + 1;
          t.step("go-right-a", `${target} is outside the sorted left half: search right.`, view());
        }
      } else {
        t.step("right-sorted", `Right half [${mid}..${hi}] is sorted.`, view(mid));
        if (nums[mid] < target && target <= nums[hi]) {
          lo = mid + 1;
          t.step("go-right-b", `${target} is inside (${nums[mid]}, ${nums[hi]}]: search right.`, view());
        } else {
          hi = mid - 1;
          t.step("go-left-b", `${target} is outside the sorted right half: search left.`, view());
        }
      }
    }
    t.step("none", "Range is empty. Return -1.", view());
    return -1;
  },
});

export default defineProblem<Input>({
  description:
    "A sorted array of distinct values was rotated at an unknown pivot. Return the index of target, or -1 if it is absent, in O(log n) time.",
  input: {
    default: "nums = [4,5,6,7,0,1,2], target = 0",
    parse: (a) => ({ nums: a.ints("nums"), target: a.int("target") }),
  },
  examples: [
    { input: "nums = [4,5,6,7,0,1,2], target = 0", output: 4 },
    { input: "nums = [4,5,6,7,0,1,2], target = 3", output: -1 },
    { input: "nums = [1], target = 0", output: -1 },
    { input: "nums = [5,1,3], target = 5", output: 0 },
  ],
  solutions: [linear, pivotThenSearch, onePass],
});

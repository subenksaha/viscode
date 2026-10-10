import { arr, range, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  nums: number[];
  k: number;
}

const minHeap = defineSolution<Input>({
  id: "min-heap",
  name: "Min-heap of Size k",
  time: "O(n log k)",
  space: "O(k)",
  idea: "Stream the numbers through a min-heap capped at k entries. After the pass it holds the k largest, and its top is the kth largest.",
  code: code(`
    function findKthLargest(nums: number[], k: number): number {
      const heap = new MinPriorityQueue<number>();
      for (const x of nums) { //@loop
        heap.enqueue(x); //@push
        if (heap.size() > k) heap.dequeue(); //@evict
      }
      return heap.front()!; //@ret
    }
  `),
  run({ nums, k }, t) {
    const heap: number[] = [];
    const view = (i?: number) => [
      vars({ k }),
      arr("nums", nums, { tones: tones([i, "active"]), pointers: { i } }),
      arr("min-heap (smallest first)", heap, { indexLabels: false, tones: tones([0, "success"]) }),
    ];
    nums.forEach((x, i) => {
      let p = 0;
      while (p < heap.length && heap[p] < x) p++;
      heap.splice(p, 0, x);
      t.step("push", `Push ${x}.`, view(i));
      if (heap.length > k) {
        const gone = heap.shift();
        t.step("evict", `Too many: drop the smallest, ${gone}.`, view(i));
      }
    });
    t.step("ret", `The heap top ${heap[0]} is the ${k}th largest.`, view());
    return heap[0];
  },
});

const quickselect = defineSolution<Input>({
  id: "quickselect",
  name: "Quickselect",
  time: "O(n) average",
  space: "O(1)",
  idea: "The kth largest sits at index n − k in sorted order. Partition around a pivot like quicksort, then continue only in the side that contains that index.",
  code: code(`
    function findKthLargest(nums: number[], k: number): number {
      const target = nums.length - k;
      let lo = 0, hi = nums.length - 1; //@init
      while (true) {
        const pivot = nums[hi];
        let p = lo;
        for (let i = lo; i < hi; i++) //@scan
          if (nums[i] <= pivot) { [nums[i], nums[p]] = [nums[p], nums[i]]; p++; } //@swap
        [nums[p], nums[hi]] = [nums[hi], nums[p]]; //@place
        if (p === target) return nums[p]; //@ret
        if (p < target) lo = p + 1; //@right
        else hi = p - 1; //@left
      }
    }
  `),
  run({ nums, k }, t) {
    const target = nums.length - k;
    let lo = 0,
      hi = nums.length - 1;
    const view = (p: number | undefined, i: number | undefined, extra: [number | undefined, Tone][] = []) => [
      vars({ target, pivot: nums[hi] }),
      arr("nums", nums, { window: [lo, hi], tones: tones(...(p !== undefined ? range(lo, p - 1, "compare") : []), [hi, "active"], ...extra), pointers: { p, i, target } }),
    ];
    t.step("init", `Sorted, the answer is at index ${target}.`, view(undefined, undefined));
    while (true) {
      const pivot = nums[hi];
      let p = lo;
      for (let i = lo; i < hi; i++) {
        if (nums[i] <= pivot) {
          [nums[i], nums[p]] = [nums[p], nums[i]];
          p++;
          t.step("swap", `${nums[p - 1]} ≤ pivot ${pivot}: move it to the left part.`, view(p, i));
        } else t.step("scan", `${nums[i]} > pivot ${pivot}: leave it.`, view(p, i));
      }
      [nums[p], nums[hi]] = [nums[hi], nums[p]];
      t.step("place", `Put the pivot ${pivot} in its final place, index ${p}.`, () => [vars({ target, pivot }), arr("nums", nums, { window: [lo, hi], tones: tones([p, "success"]), pointers: { p, target } })]);
      if (p === target) {
        t.step("ret", `Index ${p} is the target. Answer: ${nums[p]}.`, () => [arr("nums", nums, { tones: tones([p, "success"]) })]);
        return nums[p];
      }
      if (p < target) {
        lo = p + 1;
        t.step("right", "Target is to the right of the pivot.", view(undefined, undefined));
      } else {
        hi = p - 1;
        t.step("left", "Target is to the left of the pivot.", view(undefined, undefined));
      }
    }
  },
});

export default defineProblem<Input>({
  description: "Given an integer array nums and an integer k, return the kth largest element in sorted order (not the kth distinct element). Try to solve it without sorting.",
  input: { default: "nums = [3,2,1,5,6,4], k = 2", parse: (a) => ({ nums: a.ints("nums"), k: a.int("k") }) },
  examples: [
    { input: "nums = [3,2,1,5,6,4], k = 2", output: 5 },
    { input: "nums = [3,2,3,1,2,4,5,5,6], k = 4", output: 4 },
    { input: "nums = [1], k = 1", output: 1 },
  ],
  solutions: [minHeap, quickselect],
});

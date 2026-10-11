import { arr, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  nums: number[];
  k: number;
}

const brute = defineSolution<Input>({
  id: "brute-force",
  name: "Scan Every Window",
  time: "O(n·k)",
  space: "O(1)",
  idea: "For every window of size k, scan its k values and record the largest.",
  code: code(`
    function maxSlidingWindow(nums: number[], k: number): number[] {
      const result: number[] = [];
      for (let start = 0; start + k <= nums.length; start++) { //@window
        let best = nums[start];
        for (let j = start + 1; j < start + k; j++) best = Math.max(best, nums[j]); //@scan
        result.push(best); //@push
      }
      return result; //@ret
    }
  `),
  run({ nums, k }, t) {
    const res: number[] = [];
    for (let i = 0; i + k <= nums.length; i++) {
      let best = i;
      const view = (j?: number) => [
        vars({ best: nums[best] }),
        arr("nums", nums, { window: [i, i + k - 1], tones: tones([j, "compare"], [best, "active"]), pointers: { j } }),
        arr("result", res, { indexLabels: false }),
      ];
      t.step("window", `Window [${i}, ${i + k - 1}].`, view());
      for (let j = i + 1; j < i + k; j++) {
        if (nums[j] > nums[best]) best = j;
        t.step("scan", `Compare ${nums[j]}: best = ${nums[best]}.`, view(j));
      }
      res.push(nums[best]);
      t.step("push", `Max of this window is ${nums[best]}.`, view());
    }
    t.step("ret", `Return [${res}].`, [arr("result", res)]);
    return res;
  },
});

const deque = defineSolution<Input>({
  id: "monotonic-deque",
  name: "Monotonic Deque",
  time: "O(n)",
  space: "O(k)",
  idea: "Keep a deque of indices whose values are strictly decreasing. A new value evicts smaller values from the back (they can never be a max again). The front is the window max; drop it once it slides out.",
  code: code(`
    function maxSlidingWindow(nums: number[], k: number): number[] {
      // Indices whose values are decreasing from front to back. The front is the window max.
      const candidates: number[] = [];
      const result: number[] = [];
      for (let i = 0; i < nums.length; i++) { //@loop
        // Smaller values behind nums[i] can never be the max again.
        while (candidates.length > 0 && nums[candidates[candidates.length - 1]] <= nums[i]) { //@pop
          candidates.pop();
        }
        candidates.push(i); //@push
        // Drop the front if it slid out of the window.
        if (candidates[0] <= i - k) candidates.shift(); //@expire
        if (i >= k - 1) result.push(nums[candidates[0]]); //@record
      }
      return result; //@ret
    }
  `),
  run({ nums, k }, t) {
    const dq: number[] = [],
      res: number[] = [];
    const view = (i: number) => [
      arr("nums", nums, {
        window: [Math.max(0, i - k + 1), i],
        tones: tones(...dq.map((d) => [d, "compare"] as [number, "compare"]), [dq[0], "success"], [i, "active"]),
        pointers: { i },
      }),
      arr("candidates (deque of indices, values decreasing)", dq.map((d) => `${d}:${nums[d]}`), { indexLabels: false, tones: tones([0, "success"]) }),
      arr("result", res, { indexLabels: false }),
    ];
    for (let i = 0; i < nums.length; i++) {
      t.step("loop", `i = ${i}, nums[i] = ${nums[i]}.`, view(i));
      while (dq.length && nums[dq.at(-1)!] <= nums[i]) {
        const p = dq.pop()!;
        t.step("pop", `${nums[p]} ≤ ${nums[i]}: it can never be a max again. Pop it.`, view(i));
      }
      dq.push(i);
      t.step("push", `Push index ${i}.`, view(i));
      if (dq[0] <= i - k) {
        const s = dq.shift()!;
        t.step("expire", `Index ${s} left the window. Drop it from the front.`, view(i));
      }
      if (i >= k - 1) {
        res.push(nums[dq[0]]);
        t.step("record", `Window max is the front: ${nums[dq[0]]}.`, view(i));
      }
    }
    t.step("ret", `Return [${res}].`, [arr("result", res)]);
    return res;
  },
});

export default defineProblem<Input>({
  description: "Given an array nums and a window size k that slides from left to right one step at a time, return the maximum of each window.",
  input: { default: "nums = [1,3,-1,-3,5,3,6,7], k = 3", parse: (a) => ({ nums: a.ints("nums"), k: a.int("k") }) },
  examples: [
    { input: "nums = [1,3,-1,-3,5,3,6,7], k = 3", output: [3, 3, 5, 5, 6, 7] },
    { input: "nums = [1], k = 1", output: [1] },
    { input: "nums = [9,8,7,6,5], k = 2", output: [9, 8, 7, 6] },
  ],
  solutions: [brute, deque],
});

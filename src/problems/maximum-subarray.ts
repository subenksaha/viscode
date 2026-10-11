import { arr, range, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  nums: number[];
}

const bruteForce = defineSolution<Input>({
  id: "brute-force",
  name: "Brute Force",
  time: "O(n²)",
  space: "O(1)",
  idea: "Fix each start, extend the end one step at a time, and keep a running sum.",
  approach: [
    {
      title: "Fix a start index",
      detail: "Every subarray has a start i. Try them all.",
      at: "i",
    },
    {
      title: "Extend the end with a running sum",
      detail: "Rather than re-summing each subarray, add nums[j] to the running sum as j moves right. Every subarray starting at i gets its sum in O(1).",
      at: "sum",
      nth: 3,
    },
    {
      title: "Track the best sum",
      detail: "Compare each running sum with best. All n(n+1)/2 subarrays are covered, so the result is exact.",
      at: "best",
      nth: -1,
    },
  ],
  code: code(`
    function maxSubArray(nums: number[]): number {
      let best = -Infinity; //@init
      for (let i = 0; i < nums.length; i++) { //@i
        let sum = 0;
        for (let j = i; j < nums.length; j++) { //@j
          sum += nums[j]; //@sum
          best = Math.max(best, sum); //@best
        }
      }
      return best; //@ret
    }
  `),
  run({ nums }, t) {
    let best = -Infinity;
    const view = (i?: number, j?: number, sum?: number) => [
      vars({ sum, best: best === -Infinity ? "-∞" : best }),
      arr("nums", nums, { window: i !== undefined && j !== undefined ? [i, j] : null, tones: tones([j, "active"]), pointers: { i, j } }),
    ];
    t.step("init", "best = -∞.", view());
    for (let i = 0; i < nums.length; i++) {
      let sum = 0;
      t.step("i", `Start at i = ${i}.`, view(i));
      for (let j = i; j < nums.length; j++) {
        sum += nums[j];
        t.step("sum", `Add nums[${j}]: sum of [${i}..${j}] = ${sum}.`, view(i, j, sum));
        best = Math.max(best, sum);
        t.step("best", `best = ${best}.`, view(i, j, sum));
      }
    }
    t.step("ret", `Return ${best}.`, view());
    return best;
  },
});

const kadane = defineSolution<Input>({
  id: "kadane",
  name: "Kadane's Algorithm",
  time: "O(n)",
  space: "O(1)",
  idea: "At each index, either extend the current subarray or start fresh, whichever is larger. A negative running sum only hurts, so drop it.",
  approach: [
    {
      title: "Seed with the first element",
      detail: "current is the best sum of a subarray ending exactly at i. best is the best seen anywhere.",
      at: "init",
    },
    {
      title: "Extend or restart",
      detail: "At each i, the best subarray ending at i either extends the one ending at i−1 or starts fresh at nums[i]. If current was negative, restarting wins.",
      at: "cur",
    },
    {
      title: "Record the best",
      detail: "After computing current, update best. Green cells mark the winning subarray so far.",
      at: "best",
      nth: 3,
    },
    {
      title: "Finish in one pass",
      detail: "Each element is handled once with two variables, so O(n) time and O(1) space.",
      at: "ret",
    },
  ],
  code: code(`
    function maxSubArray(nums: number[]): number {
      let current = nums[0]; // best sum of a subarray ending at i //@init
      let best = nums[0];
      for (let i = 1; i < nums.length; i++) { //@loop
        // Either extend the previous subarray or start fresh at nums[i].
        current = Math.max(nums[i], current + nums[i]); //@cur
        best = Math.max(best, current); //@best
      }
      return best; //@ret
    }
  `),
  run({ nums }, t) {
    let cur = nums[0],
      best = nums[0],
      start = 0,
      bestRange: [number, number] = [0, 0];
    const view = (i: number) => [
      vars({ current: cur, best }),
      arr("nums", nums, { window: [start, i], tones: tones(...range(bestRange[0], bestRange[1], "success"), [i, "active"]), pointers: { i } }),
    ];
    t.step("init", `cur = best = nums[0] = ${nums[0]}.`, view(0));
    for (let i = 1; i < nums.length; i++) {
      t.step("loop", `i = ${i}, nums[i] = ${nums[i]}.`, view(i - 1));
      if (nums[i] > cur + nums[i]) {
        start = i;
        cur = nums[i];
        t.step("cur", `Starting fresh (${nums[i]}) beats extending. cur = ${cur}.`, view(i));
      } else {
        cur += nums[i];
        t.step("cur", `Extend the current run: cur = ${cur}.`, view(i));
      }
      if (cur > best) bestRange = [start, i];
      best = Math.max(best, cur);
      t.step("best", `best = ${best} (green marks the best subarray so far).`, view(i));
    }
    t.step("ret", `Return ${best}.`, view(nums.length - 1));
    return best;
  },
});

const divideConquer = defineSolution<Input>({
  id: "divide-conquer",
  name: "Divide & Conquer",
  time: "O(n log n)",
  space: "O(log n)",
  idea: "The best subarray lies in the left half, in the right half, or crosses the middle. Solve both halves recursively and compute the best crossing sum directly.",
  approach: [
    {
      title: "Split at the middle",
      detail: "Any subarray lies wholly in the left half, wholly in the right half, or crosses mid.",
      at: "split",
    },
    {
      title: "Best crossing sum: left part",
      detail: "A crossing subarray must include nums[mid]. Walk left from mid and keep the largest suffix sum ending at mid.",
      at: "left",
    },
    {
      title: "Best crossing sum: right part",
      detail: "Similarly, walk right from mid+1 and keep the largest prefix sum. Adding the two gives the best crossing subarray in linear time.",
      at: "right",
    },
    {
      title: "Recurse and take the max",
      detail: "Single elements are base cases. Each level returns max(left half, right half, crossing). There are log n levels with O(n) work each, so O(n log n).",
      at: "combine",
    },
  ],
  code: code(`
    function maxSubArray(nums: number[]): number {
      // Best subarray sum inside nums[start..end].
      function solve(start: number, end: number): number {
        if (start === end) return nums[start]; //@base
        const mid = Math.floor((start + end) / 2); //@split
        // Best sum that ends exactly at mid, going left.
        let bestLeft = -Infinity;
        let sum = 0;
        for (let i = mid; i >= start; i--) { //@left
          sum += nums[i];
          bestLeft = Math.max(bestLeft, sum);
        }
        // Best sum that starts exactly at mid + 1, going right.
        let bestRight = -Infinity;
        sum = 0;
        for (let i = mid + 1; i <= end; i++) { //@right
          sum += nums[i];
          bestRight = Math.max(bestRight, sum);
        }
        const crossing = bestLeft + bestRight;
        return Math.max(solve(start, mid), solve(mid + 1, end), crossing); //@combine
      }
      return solve(0, nums.length - 1); //@ret
    }
  `),
  run({ nums }, t) {
    const view = (lo: number, hi: number, mid?: number, extra: Record<string, unknown> = {}) => [
      vars({ start: lo, end: hi, mid, ...extra }),
      arr("nums", nums, { window: [lo, hi], tones: tones([mid, "active"]), pointers: { start: lo, end: hi } }),
    ];
    function solve(lo: number, hi: number): number {
      if (lo === hi) {
        t.step("base", `Single element [${lo}]: ${nums[lo]}.`, view(lo, hi));
        return nums[lo];
      }
      const mid = (lo + hi) >> 1;
      t.step("split", `Split [${lo}..${hi}] at mid = ${mid}.`, view(lo, hi, mid));
      let left = -Infinity,
        right = -Infinity,
        s = 0;
      for (let i = mid; i >= lo; i--) left = Math.max(left, (s += nums[i]));
      t.step("left", `Best sum ending at mid going left: ${left}.`, view(lo, hi, mid, { left }));
      s = 0;
      for (let i = mid + 1; i <= hi; i++) right = Math.max(right, (s += nums[i]));
      t.step("right", `Best sum starting at mid+1 going right: ${right}.`, view(lo, hi, mid, { left, right }));
      const a = solve(lo, mid);
      const b = solve(mid + 1, hi);
      const res = Math.max(a, b, left + right);
      t.step("combine", `[${lo}..${hi}]: max(left half ${a}, right half ${b}, crossing ${left + right}) = ${res}.`, view(lo, hi, mid, { result: res }));
      return res;
    }
    const best = solve(0, nums.length - 1);
    t.step("ret", `Return ${best}.`, view(0, nums.length - 1));
    return best;
  },
});

export default defineProblem<Input>({
  description: "Find the contiguous subarray with the largest sum and return its sum.",
  input: { default: "nums = [-2,1,-3,4,-1,2,1,-5,4]", parse: (a) => ({ nums: a.ints("nums") }) },
  examples: [
    { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: 6 },
    { input: "nums = [1]", output: 1 },
    { input: "nums = [5,4,-1,7,8]", output: 23 },
  ],
  solutions: [bruteForce, divideConquer, kadane],
});

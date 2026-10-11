import { arr, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  nums: number[];
}

const quadratic = defineSolution<Input>({
  id: "dp",
  name: "DP O(n²)",
  time: "O(n²)",
  space: "O(n)",
  idea: "dp[i] = length of the longest increasing subsequence ending at i = 1 + max dp[j] over j < i with nums[j] < nums[i].",
  approach: [
    {
      title: "Every element starts a run of 1",
      detail: "dp[i] is the length of the longest increasing subsequence that ends exactly at nums[i]. On its own, each element has length 1.",
      at: "init",
    },
    {
      title: "Look back at earlier elements",
      detail: "For index i, consider every j < i as the previous element of the subsequence.",
      at: "i",
      nth: 3,
    },
    {
      title: "Extend smaller predecessors",
      detail: "If nums[j] < nums[i], the subsequence ending at j can be extended by nums[i]: dp[i] = max(dp[i], dp[j] + 1).",
      at: "extend",
    },
    {
      title: "Take the max over all ends",
      detail: "The LIS can end anywhere, so the answer is max(dp). Two nested loops make this O(n²).",
      at: "ret",
    },
  ],
  code: code(`
    function lengthOfLIS(nums: number[]): number {
      // dp[i] = length of the longest increasing subsequence ending at nums[i]
      const dp = new Array(nums.length).fill(1); //@init
      for (let i = 1; i < nums.length; i++) { //@i
        for (let j = 0; j < i; j++) { //@j
          if (nums[j] < nums[i]) dp[i] = Math.max(dp[i], dp[j] + 1); //@extend
        }
      }
      return Math.max(...dp); //@ret
    }
  `),
  run({ nums }, t) {
    const dp = new Array(nums.length).fill(1);
    const view = (i?: number, j?: number, ok?: boolean) => [
      arr("nums", nums, { tones: tones([i, "active"], [j, ok ? "success" : "compare"]), pointers: { i, j } }),
      arr("dp", dp, { tones: tones([i, "active"], [j, "compare"]) }),
    ];
    t.step("init", "Every element alone is a subsequence of length 1.", view());
    for (let i = 1; i < nums.length; i++) {
      t.step("i", `Best subsequence ending at nums[${i}] = ${nums[i]}?`, view(i));
      for (let j = 0; j < i; j++) {
        if (nums[j] < nums[i]) {
          dp[i] = Math.max(dp[i], dp[j] + 1);
          t.step("extend", `${nums[j]} < ${nums[i]}: extend that run. dp[${i}] = ${dp[i]}.`, () => view(i, j, true));
        } else t.step("j", `${nums[j]} ≥ ${nums[i]}: cannot extend.`, () => view(i, j));
      }
    }
    const best = Math.max(...dp);
    t.step("ret", `Return max(dp) = ${best}.`, view());
    return best;
  },
});

const patience = defineSolution<Input>({
  id: "binary-search",
  name: "Patience Sorting + Binary Search",
  time: "O(n log n)",
  space: "O(n)",
  idea: "tails[k] = the smallest possible tail of an increasing subsequence of length k+1. For each x, binary-search the first tail ≥ x and replace it, or append x if none exists.",
  approach: [
    {
      title: "tails[k] = smallest tail of length k+1",
      detail: "Keep, for each possible length, the smallest value an increasing subsequence of that length can end with. Small tails are easier to extend.",
      at: "init",
    },
    {
      title: "Binary search the slot",
      detail: "tails is always sorted, so find the first tail ≥ num in O(log n).",
      at: "search",
    },
    {
      title: "Replace or append",
      detail: "If num beats every tail, it extends the longest subsequence (append). Otherwise it replaces a tail with a smaller value, leaving more room to grow later.",
      at: "place",
      nth: 4,
    },
    {
      title: "The length of tails is the answer",
      detail: "tails may not be a real subsequence, but its length equals the LIS length. Overall O(n log n).",
      at: "ret",
    },
  ],
  code: code(`
    function lengthOfLIS(nums: number[]): number {
      // tails[len - 1] = smallest possible last number of an increasing subsequence of length len
      const tails: number[] = []; //@init
      for (const num of nums) { //@loop
        // Binary search for the first tail that is >= num.
        let left = 0;
        let right = tails.length;
        while (left < right) { //@search
          const mid = Math.floor((left + right) / 2);
          if (tails[mid] < num) left = mid + 1;
          else right = mid;
        }
        tails[left] = num; // replace that tail, or append if left === tails.length //@place
      }
      return tails.length; //@ret
    }
  `),
  run({ nums }, t) {
    const tails: number[] = [];
    const view = (i?: number, pos?: number, extra: Record<string, unknown> = {}) => [
      vars(extra),
      arr("nums", nums, { tones: tones([i, "active"]), pointers: { i } }),
      arr("tails", tails, { tones: tones([pos, "success"]) }),
    ];
    t.step("init", "tails is empty.", view());
    nums.forEach((x, i) => {
      t.step("loop", `x = ${x}.`, view(i));
      let lo = 0,
        hi = tails.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        t.step("search", `tails[${mid}] = ${tails[mid]} ${tails[mid] < x ? "<" : "≥"} ${x}.`, view(i, undefined, { lo, hi, mid }));
        if (tails[mid] < x) lo = mid + 1;
        else hi = mid;
      }
      const append = lo === tails.length;
      tails[lo] = x;
      t.step("place", append ? `${x} is larger than every tail: append. LIS length ${tails.length}.` : `Replace tails[${lo}] with ${x}: a smaller tail for length ${lo + 1}.`, view(i, lo));
    });
    t.step("ret", `Return ${tails.length}. (tails is not necessarily an actual subsequence.)`, view());
    return tails.length;
  },
});

export default defineProblem<Input>({
  description: "Return the length of the longest strictly increasing subsequence of nums.",
  input: { default: "nums = [10,9,2,5,3,7,101,18]", parse: (a) => ({ nums: a.ints("nums") }) },
  examples: [
    { input: "nums = [10,9,2,5,3,7,101,18]", output: 4 },
    { input: "nums = [0,1,0,3,2,3]", output: 4 },
    { input: "nums = [7,7,7,7,7,7,7]", output: 1 },
  ],
  solutions: [quadratic, patience],
});

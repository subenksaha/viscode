import { arr, graph, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  nums: number[];
}

const binary = defineSolution<Input>({
  id: "binary-search-count",
  name: "Binary Search on Value Counts",
  time: "O(n log n)",
  space: "O(1)",
  idea: "Values are in [1, n]. If more than mid values are ≤ mid, the duplicate is in [1, mid] (pigeonhole); otherwise it is above mid.",
  approach: [
    {
      title: "Search over values",
      detail: "The duplicate is in [1, n].",
      at: "init",
    },
    {
      title: "Count values ≤ mid",
      detail: "With no duplicate in [1, mid], at most mid values could be ≤ mid.",
      at: "count",
    },
    {
      title: "Too many: it's in the low half",
      detail: "If the count exceeds mid, pigeonhole says the duplicate is ≤ mid.",
      at: "low",
    },
    {
      title: "Otherwise the high half",
      detail: "O(n) counting per step × log n steps.",
      at: "high",
    },
  ],
  code: code(`
    function findDuplicate(nums: number[]): number {
      // Binary search on the answer: the duplicate is somewhere in [low, high].
      let low = 1; //@init
      let high = nums.length - 1;
      while (low < high) {
        const mid = Math.floor((low + high) / 2);
        const countAtMostMid = nums.filter((num) => num <= mid).length; //@count
        // More than mid numbers fit in 1..mid, so the duplicate is in that range.
        if (countAtMostMid > mid) {
          high = mid; //@low
        } else {
          low = mid + 1; //@high
        }
      }
      return low; //@ret
    }
  `),
  run({ nums }, t) {
    let lo = 1,
      hi = nums.length - 1;
    const view = (mid?: number, cnt?: number) => [
      vars({ low: lo, high: hi, mid, countAtMostMid: cnt }),
      arr("nums", nums, { tones: mid !== undefined ? tones(...nums.map((x, i) => [i, x <= mid ? "compare" : "muted"] as [number, Tone])) : {} }),
    ];
    t.step("init", `The duplicate is somewhere in [1, ${hi}].`, view());
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      const cnt = nums.filter((x) => x <= mid).length;
      t.step("count", `${cnt} values are ≤ ${mid}.`, view(mid, cnt));
      if (cnt > mid) {
        hi = mid;
        t.step("low", `${cnt} > ${mid}: too many for distinct values. Duplicate is in [${lo}, ${hi}].`, view(mid, cnt));
      } else {
        lo = mid + 1;
        t.step("high", `${cnt} ≤ ${mid}: duplicate is in [${lo}, ${hi}].`, view(mid, cnt));
      }
    }
    t.step("ret", `Return ${lo}.`, view());
    return lo;
  },
});

const floyd = defineSolution<Input>({
  id: "floyd",
  name: "Floyd's Cycle Detection",
  time: "O(n)",
  space: "O(1)",
  idea: "Treat i → nums[i] as a linked list. Two indices point to the duplicate value, so the list has a cycle whose entrance is the duplicate. Find it with tortoise and hare.",
  approach: [
    {
      title: "Index → value is a linked list",
      detail: "Follow i → nums[i]. Two indices point to the duplicate value, so the list has a cycle whose entrance is the duplicate.",
      at: "meet",
    },
    {
      title: "Phase 1: meet inside the cycle",
      detail: "slow moves 1 step and fast 2 steps until they meet.",
      at: "phase2",
    },
    {
      title: "Phase 2: find the entrance",
      detail: "A pointer from the start and one from the meeting point, both moving 1 step at a time, meet at the cycle entrance.",
      at: "walk",
    },
    {
      title: "Duplicate",
      detail: "O(n) time, O(1) space, and the array is untouched.",
      at: "ret",
    },
  ],
  code: code(`
    function findDuplicate(nums: number[]): number {
      // Treat index i as a node pointing to nums[i]. The duplicate value is where the cycle starts.
      let slow = 0;
      let fast = 0;
      do { //@meet
        slow = nums[slow];
        fast = nums[nums[fast]];
      } while (slow !== fast);
      let finder = 0; //@phase2
      while (finder !== slow) { //@walk
        finder = nums[finder];
        slow = nums[slow];
      }
      return finder; //@ret
    }
  `),
  run({ nums }, t) {
    const nodes = nums.map((_, i) => i);
    const edges = nums.map((v, i) => [i, v] as const);
    const view = (marks: [number, Tone][], ptr: Record<string, number>) => [
      vars(ptr),
      graph("i → nums[i]", nodes, edges, { directed: true, tones: tones(...marks) }),
      arr("nums", nums, { pointers: ptr }),
    ];
    let slow = 0,
      fast = 0;
    do {
      slow = nums[slow];
      fast = nums[nums[fast]];
      t.step("meet", `slow → ${slow}, fast → ${fast}.`, view([[slow, "active"], [fast, "compare"]], { slow, fast }));
    } while (slow !== fast);
    let p = 0;
    t.step("phase2", `They meet at ${slow}. Start finder at 0; walk both one step at a time.`, view([[slow, "active"], [p, "compare"]], { slow, finder: p }));
    while (p !== slow) {
      p = nums[p];
      slow = nums[slow];
      t.step("walk", `finder → ${p}, slow → ${slow}.`, view([[slow, "active"], [p, "compare"]], { slow, finder: p }));
    }
    t.step("ret", `They meet at the cycle entrance: ${p}.`, view([[p, "success"]], { p }));
    return p;
  },
});

export default defineProblem<Input>({
  description: "nums has n + 1 integers, each in [1, n], and exactly one value repeats (possibly many times). Return the repeated value without modifying nums and with O(1) extra space.",
  input: { default: "nums = [1,3,4,2,2]", parse: (a) => ({ nums: a.ints("nums") }) },
  examples: [
    { input: "nums = [1,3,4,2,2]", output: 2 },
    { input: "nums = [3,1,3,4,2]", output: 3 },
    { input: "nums = [3,3,3,3,3]", output: 3 },
  ],
  solutions: [binary, floyd],
});

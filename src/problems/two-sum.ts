import { arr, map, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  nums: number[];
  target: number;
}

const bruteForce = defineSolution<Input>({
  id: "brute-force",
  name: "Brute Force",
  time: "O(n²)",
  space: "O(1)",
  idea: "Try every pair (i, j) with i < j and check whether they add up to target.",
  code: code(`
    function twoSum(nums: number[], target: number): number[] {
      for (let i = 0; i < nums.length; i++) { //@i
        for (let j = i + 1; j < nums.length; j++) { //@j
          if (nums[i] + nums[j] === target) { //@check
            return [i, j]; //@found
          }
        }
      }
      return []; //@none
    }
  `),
  run({ nums, target }, t) {
    const view = (i: number, j?: number, hit = false) => [
      vars({ target, sum: j !== undefined ? nums[i] + nums[j] : undefined }),
      arr("nums", nums, {
        tones: tones([i, hit ? "success" : "active"], [j, hit ? "success" : "compare"]),
        pointers: { i, j },
      }),
    ];
    for (let i = 0; i < nums.length; i++) {
      t.step("i", `Fix i = ${i} (nums[i] = ${nums[i]}).`, view(i));
      for (let j = i + 1; j < nums.length; j++) {
        t.step("j", `Try j = ${j}.`, view(i, j));
        const hit = nums[i] + nums[j] === target;
        t.step(
          "check",
          `${nums[i]} + ${nums[j]} = ${nums[i] + nums[j]}${hit ? " = target" : " ≠ target"}.`,
          view(i, j, hit),
        );
        if (hit) {
          t.step("found", `Return [${i}, ${j}].`, view(i, j, true));
          return [i, j];
        }
      }
    }
    t.step("none", "No pair adds up to target.");
    return [];
  },
});

const twoPointers = defineSolution<Input>({
  id: "sort-two-pointers",
  name: "Sort + Two Pointers",
  time: "O(n log n)",
  space: "O(n)",
  idea: "Sort indices by value, then move two pointers inward: a small sum moves left forward, a big sum moves right back.",
  code: code(`
    function twoSum(nums: number[], target: number): number[] {
      // Sort the indices by their values, so we can still return original positions.
      const order = nums.map((_, index) => index);
      order.sort((a, b) => nums[a] - nums[b]); //@sort
      let left = 0; //@init
      let right = order.length - 1;
      while (left < right) { //@loop
        const sum = nums[order[left]] + nums[order[right]]; //@sum
        if (sum === target) { //@found
          const first = Math.min(order[left], order[right]);
          const second = Math.max(order[left], order[right]);
          return [first, second];
        }
        if (sum < target) {
          left++; // need a bigger sum //@lo
        } else {
          right--; // need a smaller sum //@hi
        }
      }
      return []; //@none
    }
  `),
  run({ nums, target }, t) {
    const idx = nums.map((_, i) => i).sort((a, b) => nums[a] - nums[b]);
    const sorted = idx.map((i) => nums[i]);
    const view = (lo: number, hi: number, done = false, sum?: number) => [
      vars({ target, sum }),
      arr("sorted values", sorted, {
        indexLabels: idx.map((i) => `#${i}`),
        tones: tones([lo, done ? "success" : "active"], [hi, done ? "success" : "compare"]),
        pointers: { left: lo, right: hi },
      }),
    ];
    t.step("sort", "Sort indices by their value (labels show original indices).", [
      arr("sorted values", sorted, { indexLabels: idx.map((i) => `#${i}`) }),
    ]);
    let lo = 0,
      hi = idx.length - 1;
    t.step("init", "Start with the smallest and largest values.", view(lo, hi));
    while (lo < hi) {
      t.step("loop", `left = ${lo}, right = ${hi}.`, view(lo, hi));
      const sum = sorted[lo] + sorted[hi];
      t.step("sum", `${sorted[lo]} + ${sorted[hi]} = ${sum}.`, view(lo, hi, false, sum));
      if (sum === target) {
        const res = [idx[lo], idx[hi]].sort((a, b) => a - b);
        t.step("found", `Found it. Return original indices [${res}].`, view(lo, hi, true, sum));
        return res;
      }
      if (sum < target) {
        lo++;
        t.step("lo", "Sum too small: move left forward.", view(lo, hi));
      } else {
        hi--;
        t.step("hi", "Sum too big: move right back.", view(lo, hi));
      }
    }
    t.step("none", "Pointers met. No pair found.");
    return [];
  },
});

const hashMap = defineSolution<Input>({
  id: "hash-map",
  name: "One-pass Hash Map",
  time: "O(n)",
  space: "O(n)",
  idea: "Walk once, remembering value → index. For each number, check whether its complement was already seen.",
  code: code(`
    function twoSum(nums: number[], target: number): number[] {
      const seen = new Map<number, number>(); //@init
      for (let i = 0; i < nums.length; i++) { //@loop
        const need = target - nums[i]; //@need
        if (seen.has(need)) { //@check
          return [seen.get(need)!, i]; //@found
        }
        seen.set(nums[i], i); //@store
      }
      return []; //@none
    }
  `),
  run({ nums, target }, t) {
    const seen = new Map<number, number>();
    const view = (i: number | null, need?: number, key?: number, hit?: boolean, done?: number) => [
      vars({ target, need }),
      arr("nums", nums, {
        tones: tones(
          ...nums.map((_, k) => [i !== null && k > i ? k : null, "muted"] as [number | null, "muted"]),
          [i, done !== undefined ? "success" : "active"],
          [done, "success"],
        ),
        pointers: { i },
      }),
      map("seen (value → index)", seen, tones([key, hit ? "success" : "compare"])),
    ];
    t.step("init", "Create an empty map from value → index.", view(null));
    for (let i = 0; i < nums.length; i++) {
      t.step("loop", `i = ${i}, nums[i] = ${nums[i]}.`, view(i));
      const need = target - nums[i];
      t.step("need", `need = ${target} − ${nums[i]} = ${need}.`, view(i, need));
      if (seen.has(need)) {
        t.step("check", `${need} is in the map at index ${seen.get(need)}.`, view(i, need, need, true));
        const res = [seen.get(need)!, i];
        t.step("found", `Return [${res}].`, view(i, need, need, true, res[0]));
        return res;
      }
      t.step("check", `${need} is not in the map yet.`, view(i, need, need));
      seen.set(nums[i], i);
      t.step("store", `Store ${nums[i]} → ${i}.`, view(i, need, nums[i]));
    }
    t.step("none", "No pair found.");
    return [];
  },
});

export default defineProblem<Input>({
  description:
    "Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target. Each input has exactly one solution.",
  input: {
    default: "nums = [2,7,11,15], target = 9",
    parse: (a) => ({ nums: a.ints("nums"), target: a.int("target") }),
  },
  examples: [
    { input: "nums = [2,7,11,15], target = 9", output: [0, 1] },
    { input: "nums = [3,2,4], target = 6", output: [1, 2] },
    { input: "nums = [3,3], target = 6", output: [0, 1] },
  ],
  solutions: [bruteForce, twoPointers, hashMap],
});

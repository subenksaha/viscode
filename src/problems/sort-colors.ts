import { arr, range, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  nums: number[];
}

const counting = defineSolution<Input>({
  id: "counting-sort",
  name: "Counting Sort (Two Passes)",
  time: "O(n)",
  space: "O(1)",
  idea: "Count the 0s, 1s and 2s, then overwrite the array with that many of each.",
  code: code(`
    function sortColors(nums: number[]): void {
      const count = [0, 0, 0]; // how many 0s, 1s and 2s
      for (const color of nums) count[color]++; //@count
      let pos = 0;
      for (let color = 0; color < 3; color++) {
        for (let k = 0; k < count[color]; k++) {
          nums[pos] = color; //@write
          pos++;
        }
      }
    }
  `),
  run({ nums }, t) {
    const count = [0, 0, 0];
    nums.forEach((x, i) => {
      count[x]++;
      t.step("count", `Count a ${x}.`, [arr("nums", nums, { tones: tones([i, "active"]), pointers: { i } }), arr("count", count, { tones: tones([x, "active"]) })]);
    });
    let i = 0;
    for (let c = 0; c < 3; c++)
      for (let k = 0; k < count[c]; k++) {
        nums[i++] = c;
        t.step("write", `Write ${c} at ${i - 1}.`, [arr("nums", nums, { tones: tones(...range(0, i - 2, "success"), [i - 1, "active"]) }), arr("count", count, { tones: tones([c, "active"]) })]);
      }
    return nums;
  },
});

const dutchFlag = defineSolution<Input>({
  id: "dutch-national-flag",
  name: "Dutch National Flag (One Pass)",
  time: "O(n)",
  space: "O(1)",
  idea: "Keep three regions: [0, low) are 0s, [low, mid) are 1s, (high, end] are 2s. Look at nums[mid]: send 0s left, 2s right, and step over 1s.",
  code: code(`
    function sortColors(nums: number[]): void {
      // nums[0..low-1] are 0s, nums[low..mid-1] are 1s, nums[high+1..] are 2s.
      let low = 0; //@init
      let mid = 0;
      let high = nums.length - 1;
      while (mid <= high) { //@loop
        if (nums[mid] === 0) {
          swap(nums, low, mid); //@zero
          low++;
          mid++;
        } else if (nums[mid] === 1) {
          mid++; //@one
        } else {
          swap(nums, mid, high); //@two
          high--;
        }
      }
    }

    function swap(nums: number[], a: number, b: number) {
      const temp = nums[a];
      nums[a] = nums[b];
      nums[b] = temp;
    }
  `),
  run({ nums }, t) {
    let lo = 0,
      mid = 0,
      hi = nums.length - 1;
    const view = () => [
      vars({ "nums[mid]": nums[mid] }),
      arr("nums", nums, {
        tones: tones(...range(0, lo - 1, "success"), ...range(lo, mid - 1, "window"), ...range(hi + 1, nums.length - 1, "danger"), [mid <= hi ? mid : null, "active"]),
        pointers: { low: lo, mid, high: hi },
      }),
    ];
    t.step("init", "Everything is unsorted: lo = mid = 0, hi = end.", view());
    while (mid <= hi) {
      t.step("loop", `Look at nums[${mid}] = ${nums[mid]}.`, view());
      if (nums[mid] === 0) {
        [nums[lo], nums[mid]] = [nums[mid], nums[lo]];
        lo++;
        mid++;
        t.step("zero", "0: swap it to the lo boundary; advance lo and mid.", view());
      } else if (nums[mid] === 1) {
        mid++;
        t.step("one", "1: already in the middle region; advance mid.", view());
      } else {
        [nums[mid], nums[hi]] = [nums[hi], nums[mid]];
        hi--;
        t.step("two", "2: swap it to the hi boundary; shrink hi. Re-check the swapped-in value.", view());
      }
    }
    t.step("loop", "mid passed hi. Sorted.", view());
    return nums;
  },
});

export default defineProblem<Input>({
  description: "Given an array of 0s (red), 1s (white) and 2s (blue), sort it in place so equal colors are adjacent, in the order red, white, blue. Don't use the library sort.",
  input: { default: "nums = [2,0,2,1,1,0,1,2,0]", parse: (a) => ({ nums: a.ints("nums") }) },
  examples: [
    { input: "nums = [2,0,2,1,1,0]", output: [0, 0, 1, 1, 2, 2] },
    { input: "nums = [2,0,1]", output: [0, 1, 2] },
  ],
  solutions: [counting, dutchFlag],
});

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
      const count = [0, 0, 0];
      for (const x of nums) count[x]++; //@count
      let i = 0;
      for (let c = 0; c < 3; c++)
        for (let k = 0; k < count[c]; k++) nums[i++] = c; //@write
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
  idea: "Keep three regions: [0, lo) are 0s, [lo, mid) are 1s, (hi, end] are 2s. Look at nums[mid]: send 0s left, 2s right, and step over 1s.",
  code: code(`
    function sortColors(nums: number[]): void {
      let lo = 0, mid = 0, hi = nums.length - 1; //@init
      while (mid <= hi) { //@loop
        if (nums[mid] === 0) { [nums[lo], nums[mid]] = [nums[mid], nums[lo]]; lo++; mid++; } //@zero
        else if (nums[mid] === 1) mid++; //@one
        else { [nums[mid], nums[hi]] = [nums[hi], nums[mid]]; hi--; } //@two
      }
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
        pointers: { lo, mid, hi },
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

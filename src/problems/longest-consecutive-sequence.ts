import { arr, map, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  nums: number[];
}

const bruteForce = defineSolution<Input>({
  id: "brute-force",
  name: "Brute Force",
  time: "O(n³)",
  space: "O(1)",
  idea: "From every number, keep checking whether the next integer exists by scanning the array.",
  code: code(`
    function longestConsecutive(nums: number[]): number {
      let best = 0; //@init
      for (const x of nums) { //@start
        let cur = x, len = 1;
        while (nums.includes(cur + 1)) { cur++; len++; } //@extend
        best = Math.max(best, len); //@best
      }
      return best; //@ret
    }
  `),
  run({ nums }, t) {
    let best = 0;
    t.step("init", "best = 0.", [vars({ best }), arr("nums", nums)]);
    nums.forEach((x, i) => {
      let cur = x,
        len = 1;
      t.step("start", `Start a run at ${x}.`, () => [vars({ cur, len, best }), arr("nums", nums, { tones: tones([i, "active"]) })]);
      while (nums.includes(cur + 1)) {
        cur++;
        len++;
        const at = nums.indexOf(cur);
        t.step("extend", `${cur} exists. len = ${len}.`, () => [vars({ cur, len, best }), arr("nums", nums, { tones: tones([i, "active"], [at, "success"]) })]);
      }
      best = Math.max(best, len);
      t.step("best", `Run from ${x} has length ${len}. best = ${best}.`, () => [vars({ best }), arr("nums", nums, { tones: tones([i, "active"]) })]);
    });
    t.step("ret", `Return ${best}.`, [vars({ best })]);
    return best;
  },
});

const sorting = defineSolution<Input>({
  id: "sort",
  name: "Sort",
  time: "O(n log n)",
  space: "O(1)*",
  idea: "Sort, then walk once: a +1 step extends the run, an equal value is skipped, and anything else starts a new run.",
  code: code(`
    function longestConsecutive(nums: number[]): number {
      if (!nums.length) return 0;
      nums.sort((a, b) => a - b); //@sort
      let best = 1, len = 1;
      for (let i = 1; i < nums.length; i++) { //@loop
        if (nums[i] === nums[i - 1]) continue; //@dup
        if (nums[i] === nums[i - 1] + 1) len++; //@extend
        else len = 1; //@reset
        best = Math.max(best, len); //@best
      }
      return best; //@ret
    }
  `),
  run({ nums }, t) {
    if (!nums.length) {
      t.step("ret", "Empty array: 0.");
      return 0;
    }
    nums.sort((a, b) => a - b);
    let best = 1,
      len = 1,
      start = 0;
    const view = (i?: number) => [vars({ len, best }), arr("nums (sorted)", nums, { window: i !== undefined ? [start, i] : null, tones: tones([i, "active"]), pointers: { i } })];
    t.step("sort", "Sort the numbers.", view());
    for (let i = 1; i < nums.length; i++) {
      t.step("loop", `Compare ${nums[i - 1]} and ${nums[i]}.`, view(i));
      if (nums[i] === nums[i - 1]) {
        t.step("dup", "Duplicate: it neither extends nor breaks the run.", view(i));
        continue;
      }
      if (nums[i] === nums[i - 1] + 1) {
        len++;
        t.step("extend", `Consecutive. len = ${len}.`, view(i));
      } else {
        len = 1;
        start = i;
        t.step("reset", "Gap: start a new run.", view(i));
      }
      best = Math.max(best, len);
      t.step("best", `best = ${best}.`, view(i));
    }
    t.step("ret", `Return ${best}.`, view());
    return best;
  },
});

const hashSet = defineSolution<Input>({
  id: "hash-set",
  name: "Hash Set (Start of Runs)",
  time: "O(n)",
  space: "O(n)",
  idea: "Put everything in a set. Only start counting at x when x − 1 is absent (x starts a run), then walk x+1, x+2, … Each number is visited a constant number of times.",
  code: code(`
    function longestConsecutive(nums: number[]): number {
      const set = new Set(nums); //@build
      let best = 0;
      for (const x of set) { //@loop
        if (set.has(x - 1)) continue; //@skip
        let len = 1; //@start
        while (set.has(x + len)) len++; //@extend
        best = Math.max(best, len); //@best
      }
      return best; //@ret
    }
  `),
  run({ nums }, t) {
    const set = new Set(nums);
    let best = 0;
    const view = (x?: number, len = 0, skip = false) => {
      const tn: Record<string, "active" | "success" | "muted"> = {};
      if (x !== undefined) {
        for (let k = 0; k < len; k++) tn[x + k] = "success";
        tn[x] = skip ? "muted" : "active";
      }
      return [vars({ x, len: len || undefined, best }), map("set", set, tn)];
    };
    t.step("build", "Put every number in a set.", view());
    for (const x of set) {
      if (set.has(x - 1)) {
        t.step("skip", `${x - 1} exists, so ${x} is not the start of a run.`, view(x, 0, true));
        continue;
      }
      let len = 1;
      t.step("start", `${x} starts a run.`, view(x, len));
      while (set.has(x + len)) {
        len++;
        t.step("extend", `${x + len - 1} exists. len = ${len}.`, view(x, len));
      }
      best = Math.max(best, len);
      t.step("best", `best = ${best}.`, view(x, len));
    }
    t.step("ret", `Return ${best}.`, view());
    return best;
  },
});

export default defineProblem<Input>({
  description: "Given an unsorted array, return the length of the longest run of consecutive integers. Aim for O(n) time.",
  input: { default: "nums = [100,4,200,1,3,2]", parse: (a) => ({ nums: a.ints("nums") }) },
  examples: [
    { input: "nums = [100,4,200,1,3,2]", output: 4 },
    { input: "nums = [0,3,7,2,5,8,4,6,0,1]", output: 9 },
    { input: "nums = [1,0,1,2]", output: 3 },
    { input: "nums = []", output: 0 },
  ],
  solutions: [bruteForce, sorting, hashSet],
});

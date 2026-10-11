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
  approach: [
    {
      title: "Start a run at each number",
      detail: "Pretend every number begins a run.",
      at: "start",
    },
    {
      title: "Extend by scanning",
      detail: "Look for current + 1 with a linear scan, again and again. Each lookup is O(n), which is why this is slow.",
      at: "extend",
    },
    {
      title: "Keep the best length",
      detail: "Compare each run length with best.",
      at: "best",
      nth: -1,
    },
  ],
  code: code(`
    function longestConsecutive(nums: number[]): number {
      let best = 0; //@init
      for (const num of nums) { //@start
        let current = num;
        let length = 1;
        while (nums.includes(current + 1)) { //@extend
          current++;
          length++;
        }
        best = Math.max(best, length); //@best
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
      t.step("start", `Start a run at ${x}.`, () => [vars({ current: cur, length: len, best }), arr("nums", nums, { tones: tones([i, "active"]) })]);
      while (nums.includes(cur + 1)) {
        cur++;
        len++;
        const at = nums.indexOf(cur);
        t.step("extend", `${cur} exists. length = ${len}.`, () => [vars({ current: cur, length: len, best }), arr("nums", nums, { tones: tones([i, "active"], [at, "success"]) })]);
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
  approach: [
    {
      title: "Sort",
      detail: "Consecutive numbers become neighbors.",
      at: "sort",
    },
    {
      title: "Extend on +1",
      detail: "If nums[i] is exactly nums[i−1] + 1, the current run grows.",
      at: "extend",
    },
    {
      title: "Reset on a gap",
      detail: "Anything bigger than +1 starts a new run. Duplicates are skipped without breaking the run.",
      at: "reset",
    },
    {
      title: "Track the best",
      detail: "O(n log n), dominated by the sort.",
      at: "best",
      nth: -1,
    },
  ],
  code: code(`
    function longestConsecutive(nums: number[]): number {
      if (nums.length === 0) return 0;
      nums.sort((a, b) => a - b); //@sort
      let best = 1;
      let length = 1; // length of the run ending at nums[i]
      for (let i = 1; i < nums.length; i++) { //@loop
        if (nums[i] === nums[i - 1]) continue; //@dup
        if (nums[i] === nums[i - 1] + 1) {
          length++; //@extend
        } else {
          length = 1; //@reset
        }
        best = Math.max(best, length); //@best
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
    const view = (i?: number) => [vars({ length: len, best }), arr("nums (sorted)", nums, { window: i !== undefined ? [start, i] : null, tones: tones([i, "active"]), pointers: { i } })];
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
  approach: [
    {
      title: "Build a set",
      detail: "O(1) membership tests, with duplicates removed.",
      at: "build",
    },
    {
      title: "Only start at the beginning of a run",
      detail: "If num − 1 exists, num is in the middle of some run, so skip it. This keeps the work linear.",
      at: "skip",
    },
    {
      title: "Count upward from run starts",
      detail: "From a true start, walk num+1, num+2, … while they exist.",
      at: "extend",
    },
    {
      title: "Best length",
      detail: "Each number is part of exactly one upward walk, so the total is O(n).",
      at: "best",
      nth: -1,
    },
  ],
  code: code(`
    function longestConsecutive(nums: number[]): number {
      const numSet = new Set(nums); //@build
      let best = 0;
      for (const num of numSet) { //@loop
        if (numSet.has(num - 1)) continue; // not the start of a run //@skip
        let length = 1; //@start
        while (numSet.has(num + length)) length++; //@extend
        best = Math.max(best, length); //@best
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
      return [vars({ num: x, length: len || undefined, best }), map("numSet", set, tn)];
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

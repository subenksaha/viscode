import { arr, intervals, range, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  startTime: number[];
  endTime: number[];
  profit: number[];
}

type Job = [number, number, number];

const sortedJobs = ({ startTime, endTime, profit }: Input): Job[] =>
  startTime.map((s, i): Job => [s, endTime[i], profit[i]]).sort((a, b) => a[1] - b[1]);

const quadratic = defineSolution<Input>({
  id: "dp-quadratic",
  name: "DP with Linear Look-back",
  time: "O(n²)",
  space: "O(n)",
  idea: "Sort jobs by end time. dp[i] is the best profit using the first i jobs: either skip job i, or take it plus the best dp over jobs that end by its start (found by scanning back).",
  code: code(`
    function jobScheduling(startTime: number[], endTime: number[], profit: number[]): number {
      const jobs = startTime.map((s, i) => [s, endTime[i], profit[i]]).sort((a, b) => a[1] - b[1]); //@sort
      const dp = new Array(jobs.length + 1).fill(0);
      for (let i = 1; i <= jobs.length; i++) { //@job
        const [s, , p] = jobs[i - 1];
        let j = i - 1;
        while (j > 0 && jobs[j - 1][1] > s) j--; //@scan
        dp[i] = Math.max(dp[i - 1], dp[j] + p); //@choose
      }
      return dp[jobs.length]; //@ret
    }
  `),
  run(input, t) {
    const jobs = sortedJobs(input);
    const dp: number[] = new Array(jobs.length + 1).fill(0);
    const view = (i?: number, j?: number, take?: boolean) => [
      intervals("jobs (by end time)", jobs.map(([s, e]) => [s, e]), tones(...(i !== undefined && j !== undefined ? range(0, j - 1, "compare") : []), [i !== undefined ? i - 1 : null, take === false ? "muted" : "active"])),
      arr("profit", jobs.map((jb) => jb[2]), { tones: tones([i !== undefined ? i - 1 : null, "active"]) }),
      arr("dp (best using first i jobs)", dp, { tones: tones([j, "compare"], [i, take ? "success" : "active"]) }),
    ];
    t.step("sort", "Sort jobs by end time.", view());
    for (let i = 1; i <= jobs.length; i++) {
      const [s, , p] = jobs[i - 1];
      let j = i - 1;
      while (j > 0 && jobs[j - 1][1] > s) {
        t.step("scan", `Job ${j - 1} ends at ${jobs[j - 1][1]} > ${s}: overlaps. Look further back.`, () => view(i, j));
        j--;
      }
      const take = dp[j] + p;
      dp[i] = Math.max(dp[i - 1], take);
      t.step("choose", `Skip: ${dp[i - 1]}. Take: dp[${j}] + ${p} = ${take}. dp[${i}] = ${dp[i]}.`, () => view(i, j, take >= dp[i - 1]));
    }
    t.step("ret", `Return ${dp[jobs.length]}.`, view());
    return dp[jobs.length];
  },
});

const binarySearch = defineSolution<Input>({
  id: "dp-binary-search",
  name: "DP + Binary Search",
  time: "O(n log n)",
  space: "O(n)",
  idea: "Same recurrence, but since jobs are sorted by end time, binary search for the last job ending at or before the current start.",
  code: code(`
    function jobScheduling(startTime: number[], endTime: number[], profit: number[]): number {
      const jobs = startTime.map((s, i) => [s, endTime[i], profit[i]]).sort((a, b) => a[1] - b[1]); //@sort
      const dp = new Array(jobs.length + 1).fill(0);
      for (let i = 1; i <= jobs.length; i++) { //@job
        const [s, , p] = jobs[i - 1];
        let lo = 0, hi = i - 1; // count of jobs ending by s
        while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (jobs[mid - 1][1] <= s) lo = mid; else hi = mid - 1; } //@search
        dp[i] = Math.max(dp[i - 1], dp[lo] + p); //@choose
      }
      return dp[jobs.length]; //@ret
    }
  `),
  run(input, t) {
    const jobs = sortedJobs(input);
    const dp: number[] = new Array(jobs.length + 1).fill(0);
    const view = (i?: number, j?: number, take?: boolean) => {
      const jobTones: [number | null, Tone][] = [];
      if (i !== undefined && j !== undefined) jobTones.push(...range(0, j - 1, "compare"));
      jobTones.push([i !== undefined ? i - 1 : null, "active"]);
      return [
        intervals("jobs (by end time)", jobs.map(([s, e]) => [s, e]), tones(...jobTones)),
        arr("profit", jobs.map((jb) => jb[2]), { tones: tones([i !== undefined ? i - 1 : null, "active"]) }),
        arr("dp (best using first i jobs)", dp, { tones: tones([j, "compare"], [i, take ? "success" : "active"]) }),
      ];
    };
    t.step("sort", "Sort jobs by end time.", view());
    for (let i = 1; i <= jobs.length; i++) {
      const [s, , p] = jobs[i - 1];
      let lo = 0,
        hi = i - 1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (jobs[mid - 1][1] <= s) lo = mid;
        else hi = mid - 1;
      }
      t.step("search", `Job [${s}, ${jobs[i - 1][1]}]: binary search finds ${lo} earlier job(s) ending by ${s}.`, () => [vars({ start: s, compatible: lo }), ...view(i, lo)]);
      const take = dp[lo] + p;
      dp[i] = Math.max(dp[i - 1], take);
      t.step("choose", `Skip: ${dp[i - 1]}. Take: dp[${lo}] + ${p} = ${take}. dp[${i}] = ${dp[i]}.`, () => view(i, lo, take >= dp[i - 1]));
    }
    t.step("ret", `Return ${dp[jobs.length]}.`, view());
    return dp[jobs.length];
  },
});

export default defineProblem<Input>({
  description: "Job i runs from startTime[i] to endTime[i] and earns profit[i]. Choose non-overlapping jobs to maximize total profit. A job may start exactly when another ends.",
  input: {
    default: "startTime = [1,2,3,4,6], endTime = [3,5,10,6,9], profit = [20,20,100,70,60]",
    parse: (a) => {
      const startTime = a.ints("startTime"),
        endTime = a.ints("endTime"),
        profit = a.ints("profit");
      if (startTime.length !== endTime.length || startTime.length !== profit.length) throw new Error("all three arrays must have the same length");
      return { startTime, endTime, profit };
    },
  },
  examples: [
    { input: "startTime = [1,2,3,3], endTime = [3,4,5,6], profit = [50,10,40,70]", output: 120 },
    { input: "startTime = [1,2,3,4,6], endTime = [3,5,10,6,9], profit = [20,20,100,70,60]", output: 150 },
    { input: "startTime = [1,1,1], endTime = [2,3,4], profit = [5,6,4]", output: 6 },
  ],
  solutions: [quadratic, binarySearch],
});

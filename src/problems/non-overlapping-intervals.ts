import { arr, intervals, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  intervals: [number, number][];
}

const greedyEnd = defineSolution<Input>({
  id: "greedy-end",
  name: "Greedy: Sort by End",
  time: "O(n log n)",
  space: "O(1)*",
  idea: "Keep the interval that finishes earliest. It leaves the most room for the rest. Any interval starting before the last kept end must be removed.",
  code: code(`
    function eraseOverlapIntervals(intervals: number[][]): number {
      intervals.sort((a, b) => a[1] - b[1]); //@sort
      let end = -Infinity, removed = 0; //@init
      for (const [s, e] of intervals) { //@loop
        if (s >= end) end = e; //@keep
        else removed++; //@remove
      }
      return removed; //@ret
    }
  `),
  run({ intervals: list }, t) {
    list.sort((a, b) => a[1] - b[1]);
    let end = -Infinity,
      removed = 0;
    const status: Record<number, Tone> = {};
    const view = (k?: number) => [vars({ end: end === -Infinity ? "-∞" : end, removed }), intervals("sorted by end", list, { ...status, ...tones([k, "active"]) })];
    t.step("sort", "Sort by end time.", view());
    t.step("init", "Nothing kept yet.", view());
    list.forEach(([s, e], k) => {
      t.step("loop", `[${s},${e}].`, view(k));
      if (s >= end) {
        end = e;
        status[k] = "success";
        t.step("keep", `Starts at or after the last end: keep it. end = ${e}.`, view());
      } else {
        removed++;
        status[k] = "danger";
        t.step("remove", `Starts before ${end}: remove it. removed = ${removed}.`, view());
      }
    });
    t.step("ret", `Return ${removed}.`, view());
    return removed;
  },
});

const greedyStart = defineSolution<Input>({
  id: "greedy-start",
  name: "Greedy: Sort by Start",
  time: "O(n log n)",
  space: "O(1)*",
  idea: "Sort by start. When two intervals overlap, remove the one that ends later, i.e. keep the smaller end.",
  code: code(`
    function eraseOverlapIntervals(intervals: number[][]): number {
      intervals.sort((a, b) => a[0] - b[0]); //@sort
      let end = intervals[0][1], removed = 0; //@init
      for (let i = 1; i < intervals.length; i++) { //@loop
        const [s, e] = intervals[i];
        if (s >= end) end = e; //@keep
        else { removed++; end = Math.min(end, e); } //@remove
      }
      return removed; //@ret
    }
  `),
  run({ intervals: list }, t) {
    list.sort((a, b) => a[0] - b[0]);
    let end = list[0][1],
      removed = 0;
    const view = (k?: number) => [vars({ end, removed }), intervals("sorted by start", list, tones([k, "active"]))];
    t.step("sort", "Sort by start time.", view());
    t.step("init", `Keep the first interval. end = ${end}.`, view(0));
    for (let i = 1; i < list.length; i++) {
      const [s, e] = list[i];
      t.step("loop", `[${s},${e}].`, view(i));
      if (s >= end) {
        end = e;
        t.step("keep", `No overlap. end = ${end}.`, view(i));
      } else {
        removed++;
        end = Math.min(end, e);
        t.step("remove", `Overlap: remove the one ending later. end = ${end}, removed = ${removed}.`, view(i));
      }
    }
    t.step("ret", `Return ${removed}.`, view());
    return removed;
  },
});

const dp = defineSolution<Input>({
  id: "dp",
  name: "DP (Longest Non-overlapping Chain)",
  time: "O(n²)",
  space: "O(n)",
  idea: "Sort by start. dp[i] = most intervals you can keep ending with interval i = 1 + max dp[j] over compatible j < i. Answer = n − max(dp).",
  code: code(`
    function eraseOverlapIntervals(intervals: number[][]): number {
      intervals.sort((a, b) => a[0] - b[0]); //@sort
      const dp = new Array(intervals.length).fill(1);
      for (let i = 1; i < intervals.length; i++) //@i
        for (let j = 0; j < i; j++) //@j
          if (intervals[j][1] <= intervals[i][0]) dp[i] = Math.max(dp[i], dp[j] + 1); //@extend
      return intervals.length - Math.max(...dp); //@ret
    }
  `),
  run({ intervals: list }, t) {
    list.sort((a, b) => a[0] - b[0]);
    const dpArr = new Array(list.length).fill(1);
    const view = (i?: number, j?: number, ok?: boolean) => [
      intervals("sorted by start", list, tones([i, "active"], [j, ok ? "success" : "compare"])),
      arr("dp (kept, ending here)", dpArr, { tones: tones([i, "active"], [j, "compare"]) }),
    ];
    t.step("sort", "Sort by start. Each interval alone is a chain of 1.", view());
    for (let i = 1; i < list.length; i++) {
      t.step("i", `Longest chain ending with [${list[i]}]?`, () => view(i));
      for (let j = 0; j < i; j++) {
        if (list[j][1] <= list[i][0]) {
          dpArr[i] = Math.max(dpArr[i], dpArr[j] + 1);
          t.step("extend", `[${list[j]}] ends before [${list[i]}] starts: dp[${i}] = ${dpArr[i]}.`, () => view(i, j, true));
        } else t.step("j", `[${list[j]}] overlaps [${list[i]}].`, () => view(i, j));
      }
    }
    const res = list.length - Math.max(...dpArr);
    t.step("ret", `Keep ${Math.max(...dpArr)}, remove ${res}.`, view());
    return res;
  },
});

export default defineProblem<Input>({
  description: "Return the minimum number of intervals to remove so the remaining intervals do not overlap. Touching at an endpoint is fine.",
  input: { default: "intervals = [[1,2],[2,3],[3,4],[1,3]]", parse: (a) => ({ intervals: a.pairs("intervals") }) },
  examples: [
    { input: "intervals = [[1,2],[2,3],[3,4],[1,3]]", output: 1 },
    { input: "intervals = [[1,2],[1,2],[1,2]]", output: 2 },
    { input: "intervals = [[1,2],[2,3]]", output: 0 },
  ],
  solutions: [dp, greedyStart, greedyEnd],
});

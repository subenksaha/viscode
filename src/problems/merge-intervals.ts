import { intervals, tones } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  intervals: [number, number][];
}

const show = (xs: number[][]) => xs.map((x) => `[${x}]`).join(" ");

const sortMerge = defineSolution<Input>({
  id: "sort-merge",
  name: "Sort + Merge",
  time: "O(n log n)",
  space: "O(n)",
  idea: "After sorting by start, overlapping intervals are adjacent. Extend the last merged interval while the next one starts inside it.",
  code: code(`
    function merge(intervals: number[][]): number[][] {
      intervals.sort((a, b) => a[0] - b[0]); //@sort
      const merged = [intervals[0]]; //@init
      for (let i = 1; i < intervals.length; i++) { //@loop
        const [start, end] = intervals[i];
        const last = merged[merged.length - 1];
        if (start <= last[1]) {
          last[1] = Math.max(last[1], end); // overlaps: extend the last interval //@merge
        } else {
          merged.push([start, end]); //@push
        }
      }
      return merged; //@ret
    }
  `),
  run({ intervals: list }, t) {
    list.sort((a, b) => a[0] - b[0]);
    const res: [number, number][] = [[...list[0]]];
    const view = (k?: number, tone: Tone = "active") => [intervals("sorted input", list, tones([k, tone])), intervals("merged", res, tones([res.length - 1, "success"]))];
    t.step("sort", "Sort by start.", view());
    t.step("init", `Start with [${list[0]}].`, view(0));
    for (let k = 1; k < list.length; k++) {
      const [s, e] = list[k];
      const last = res[res.length - 1];
      t.step("loop", `Next: [${s},${e}]. Last merged: [${last}].`, view(k));
      if (s <= last[1]) {
        const prevEnd = last[1];
        last[1] = Math.max(last[1], e);
        t.step("merge", `${s} ≤ ${prevEnd}: overlap. Extend to [${last}].`, view(k, "danger"));
      } else {
        res.push([s, e]);
        t.step("push", `${s} > ${last[1]}: no overlap. Start a new interval.`, view(k));
      }
    }
    t.step("ret", `Result: ${show(res)}.`, view());
    return res;
  },
});

const repeated = defineSolution<Input>({
  id: "repeated-merge",
  name: "Brute Force: Merge Pairs Until Stable",
  time: "O(n³)",
  space: "O(n)",
  idea: "Without sorting: keep looking for any two overlapping intervals, merge them, and repeat until no pair overlaps.",
  code: code(`
    function merge(intervals: number[][]): number[][] {
      const result = intervals.map((interval) => [...interval]);
      // Keep merging any overlapping pair until a full pass finds none.
      let mergedSomething = true;
      while (mergedSomething) { //@pass
        mergedSomething = false;
        for (let i = 0; i < result.length && !mergedSomething; i++) {
          for (let j = i + 1; j < result.length; j++) { //@pair
            const a = result[i];
            const b = result[j];
            if (a[0] <= b[1] && b[0] <= a[1]) { //@overlap
              result[i] = [Math.min(a[0], b[0]), Math.max(a[1], b[1])];
              result.splice(j, 1); //@merge
              mergedSomething = true;
              break;
            }
          }
        }
      }
      return result.sort((a, b) => a[0] - b[0]); //@ret
    }
  `),
  run({ intervals: list }, t) {
    const res = list.map((x) => [...x] as [number, number]);
    let changed = true;
    while (changed) {
      changed = false;
      t.step("pass", "Look for any overlapping pair.", [intervals("intervals", res)]);
      outer: for (let i = 0; i < res.length; i++)
        for (let j = i + 1; j < res.length; j++) {
          if (res[i][0] <= res[j][1] && res[j][0] <= res[i][1]) {
            t.step("overlap", `[${res[i]}] and [${res[j]}] overlap.`, () => [intervals("intervals", res, tones([i, "danger"], [j, "danger"]))]);
            res[i] = [Math.min(res[i][0], res[j][0]), Math.max(res[i][1], res[j][1])];
            res.splice(j, 1);
            changed = true;
            t.step("merge", `Merged into [${res[i]}].`, () => [intervals("intervals", res, tones([i, "success"]))]);
            break outer;
          }
          t.step("pair", `[${res[i]}] and [${res[j]}] do not overlap.`, () => [intervals("intervals", res, tones([i, "active"], [j, "compare"]))]);
        }
    }
    res.sort((a, b) => a[0] - b[0]);
    t.step("ret", `No overlaps left: ${show(res)}.`, [intervals("intervals", res)]);
    return res;
  },
});

export default defineProblem<Input>({
  description: "Merge all overlapping intervals and return the non-overlapping intervals that cover every input interval.",
  input: { default: "intervals = [[1,3],[8,10],[2,6],[15,18],[9,12]]", parse: (a) => ({ intervals: a.pairs("intervals") }) },
  examples: [
    { input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", output: [[1, 6], [8, 10], [15, 18]] },
    { input: "intervals = [[1,4],[4,5]]", output: [[1, 5]] },
    { input: "intervals = [[1,4],[0,0]]", output: [[0, 0], [1, 4]] },
  ],
  solutions: [repeated, sortMerge],
});

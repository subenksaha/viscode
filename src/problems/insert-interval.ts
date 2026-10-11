import { intervals, text, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  intervals: [number, number][];
  newInterval: [number, number];
}

const show = (xs: number[][]) => xs.map((x) => `[${x}]`).join(" ");

const linear = defineSolution<Input>({
  id: "linear",
  name: "Three-phase Linear Scan",
  time: "O(n)",
  space: "O(n)",
  idea: "The list is sorted and disjoint. Copy intervals that end before the new one, merge every interval that overlaps it, then copy the rest.",
  code: code(`
    function insert(intervals: number[][], newInterval: number[]): number[][] {
      const result: number[][] = [];
      let [start, end] = newInterval; //@init
      let i = 0;
      // 1. Intervals that end before the new one starts.
      while (i < intervals.length && intervals[i][1] < start) { //@before
        result.push(intervals[i]);
        i++;
      }
      // 2. Intervals that overlap the new one: merge them in.
      while (i < intervals.length && intervals[i][0] <= end) { //@overlap
        start = Math.min(start, intervals[i][0]);
        end = Math.max(end, intervals[i][1]); //@merge
        i++;
      }
      result.push([start, end]); //@place
      // 3. Intervals that start after the new one ends.
      while (i < intervals.length) { //@after
        result.push(intervals[i]);
        i++;
      }
      return result; //@ret
    }
  `),
  run({ intervals: list, newInterval }, t) {
    const res: number[][] = [];
    let [s, e] = newInterval,
      i = 0;
    const view = (tone?: Tone) => [
      vars({ start: s, end: e, i }),
      intervals("intervals (new one last)", [...list, [s, e]], tones([i < list.length ? i : null, tone ?? "active"], [list.length, "compare"])),
      text("result", show(res)),
    ];
    t.step("init", `Merging window starts as [${s},${e}].`, view());
    while (i < list.length && list[i][1] < s) {
      res.push(list[i]);
      t.step("before", `[${list[i]}] ends before ${s}: copy it.`, view("success"));
      i++;
    }
    while (i < list.length && list[i][0] <= e) {
      t.step("overlap", `[${list[i]}] starts at or before ${e}: it overlaps.`, view("danger"));
      s = Math.min(s, list[i][0]);
      e = Math.max(e, list[i][1]);
      t.step("merge", `Absorb it. Window = [${s},${e}].`, view("danger"));
      i++;
    }
    res.push([s, e]);
    t.step("place", `Place the merged interval [${s},${e}].`, view());
    while (i < list.length) {
      res.push(list[i]);
      t.step("after", `Copy [${list[i]}].`, view("success"));
      i++;
    }
    t.step("ret", `Result: ${show(res)}.`, view());
    return res;
  },
});

const appendMerge = defineSolution<Input>({
  id: "append-sort-merge",
  name: "Append, Sort, Merge",
  time: "O(n log n)",
  space: "O(n)",
  idea: "Ignore the existing order: add the new interval, sort by start and run the standard merge. Simple, but slower.",
  code: code(`
    function insert(intervals: number[][], newInterval: number[]): number[][] {
      const sorted = [...intervals, newInterval].sort((a, b) => a[0] - b[0]); //@sort
      const result = [sorted[0]];
      for (let i = 1; i < sorted.length; i++) { //@loop
        const [start, end] = sorted[i];
        const last = result[result.length - 1];
        if (start <= last[1]) {
          last[1] = Math.max(last[1], end); //@merge
        } else {
          result.push([start, end]); //@push
        }
      }
      return result; //@ret
    }
  `),
  run({ intervals: list, newInterval }, t) {
    const all = [...list, newInterval].sort((a, b) => a[0] - b[0]);
    const res: [number, number][] = [[...all[0]]];
    const view = (k?: number, tone: Tone = "active") => [intervals("sorted", all, tones([k, tone])), intervals("merged", res, tones([res.length - 1, "success"]))];
    t.step("sort", "Add the new interval and sort everything by start.", view(0));
    for (let k = 1; k < all.length; k++) {
      const [s, e] = all[k];
      const last = res[res.length - 1];
      if (s <= last[1]) {
        last[1] = Math.max(last[1], e);
        t.step("merge", `[${s},${e}] overlaps [${last[0]},…]: extend it to ${last[1]}.`, view(k, "danger"));
      } else {
        res.push([s, e]);
        t.step("push", `[${s},${e}] starts after ${last[1]}: new interval.`, view(k));
      }
    }
    t.step("ret", `Result: ${show(res)}.`, view());
    return res;
  },
});

export default defineProblem<Input>({
  description: "Insert newInterval into a sorted list of non-overlapping intervals, merging where necessary so the list stays sorted and non-overlapping.",
  input: {
    default: "intervals = [[1,2],[3,5],[6,7],[8,10],[12,16]], newInterval = [4,8]",
    parse: (a) => {
      const ni = a.ints("newInterval");
      if (ni.length !== 2) throw new Error("newInterval must be [start, end]");
      return { intervals: a.pairs("intervals"), newInterval: [ni[0], ni[1]] };
    },
  },
  examples: [
    { input: "intervals = [[1,3],[6,9]], newInterval = [2,5]", output: [[1, 5], [6, 9]] },
    { input: "intervals = [[1,2],[3,5],[6,7],[8,10],[12,16]], newInterval = [4,8]", output: [[1, 2], [3, 10], [12, 16]] },
    { input: "intervals = [], newInterval = [5,7]", output: [[5, 7]] },
  ],
  solutions: [appendMerge, linear],
});

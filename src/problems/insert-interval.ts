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
      const res: number[][] = [];
      let [s, e] = newInterval, i = 0; //@init
      while (i < intervals.length && intervals[i][1] < s) res.push(intervals[i++]); //@before
      while (i < intervals.length && intervals[i][0] <= e) { //@overlap
        s = Math.min(s, intervals[i][0]);
        e = Math.max(e, intervals[i][1]); //@merge
        i++;
      }
      res.push([s, e]); //@place
      while (i < intervals.length) res.push(intervals[i++]); //@after
      return res; //@ret
    }
  `),
  run({ intervals: list, newInterval }, t) {
    const res: number[][] = [];
    let [s, e] = newInterval,
      i = 0;
    const view = (tone?: Tone) => [
      vars({ s, e, i }),
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
      const all = [...intervals, newInterval].sort((a, b) => a[0] - b[0]); //@sort
      const res = [all[0]];
      for (const [s, e] of all.slice(1)) { //@loop
        const last = res[res.length - 1];
        if (s <= last[1]) last[1] = Math.max(last[1], e); //@merge
        else res.push([s, e]); //@push
      }
      return res; //@ret
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

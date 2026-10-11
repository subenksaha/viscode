import { intervals, tones } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  intervals: [number, number][];
}

const bruteForce = defineSolution<Input>({
  id: "brute-force",
  name: "Check Every Pair",
  time: "O(n²)",
  space: "O(1)",
  idea: "Two meetings conflict when each starts before the other ends. Test every pair.",
  code: code(`
    function canAttendMeetings(intervals: number[][]): boolean {
      for (let i = 0; i < intervals.length; i++) { //@i
        for (let j = i + 1; j < intervals.length; j++) { //@j
          const [startA, endA] = intervals[i];
          const [startB, endB] = intervals[j];
          // Two meetings overlap if each one starts before the other ends.
          if (startA < endB && startB < endA) return false; //@clash
        }
      }
      return true; //@ret
    }
  `),
  run({ intervals: list }, t) {
    for (let i = 0; i < list.length; i++) {
      t.step("i", `Meeting [${list[i]}].`, [intervals("meetings", list, tones([i, "active"]))]);
      for (let j = i + 1; j < list.length; j++) {
        const [a, b] = [list[i], list[j]];
        if (a[0] < b[1] && b[0] < a[1]) {
          t.step("clash", `[${a}] and [${b}] overlap. Return false.`, [intervals("meetings", list, tones([i, "danger"], [j, "danger"]))]);
          return false;
        }
        t.step("j", `[${a}] and [${b}] do not overlap.`, [intervals("meetings", list, tones([i, "active"], [j, "compare"]))]);
      }
    }
    t.step("ret", "No conflicts. Return true.", [intervals("meetings", list)]);
    return true;
  },
});

const sorting = defineSolution<Input>({
  id: "sort",
  name: "Sort by Start",
  time: "O(n log n)",
  space: "O(1)*",
  idea: "After sorting by start, a conflict must involve neighbors: check whether each meeting starts before the previous one ends.",
  code: code(`
    function canAttendMeetings(intervals: number[][]): boolean {
      intervals.sort((a, b) => a[0] - b[0]); //@sort
      for (let i = 1; i < intervals.length; i++) { //@loop
        const previousEnd = intervals[i - 1][1];
        const currentStart = intervals[i][0];
        if (currentStart < previousEnd) return false; //@clash
      }
      return true; //@ret
    }
  `),
  run({ intervals: list }, t) {
    list.sort((a, b) => a[0] - b[0]);
    t.step("sort", "Sort by start time.", [intervals("meetings", list)]);
    for (let i = 1; i < list.length; i++) {
      if (list[i][0] < list[i - 1][1]) {
        t.step("clash", `[${list[i]}] starts before [${list[i - 1]}] ends. Return false.`, [intervals("meetings", list, tones([i - 1, "danger"], [i, "danger"]))]);
        return false;
      }
      t.step("loop", `[${list[i]}] starts after [${list[i - 1]}] ends.`, [intervals("meetings", list, tones([i - 1, "compare"], [i, "active"]))]);
    }
    t.step("ret", "No conflicts. Return true.", [intervals("meetings", list)]);
    return true;
  },
});

export default defineProblem<Input>({
  description: "Given meeting time intervals, decide whether one person can attend all of them (no two meetings overlap).",
  input: { default: "intervals = [[0,30],[5,10],[15,20]]", parse: (a) => ({ intervals: a.pairs("intervals") }) },
  examples: [
    { input: "intervals = [[0,30],[5,10],[15,20]]", output: false },
    { input: "intervals = [[7,10],[2,4]]", output: true },
  ],
  solutions: [bruteForce, sorting],
});

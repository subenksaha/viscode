import { arr, intervals, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  intervals: [number, number][];
}

const minHeap = defineSolution<Input>({
  id: "min-heap",
  name: "Min-heap of End Times",
  time: "O(n log n)",
  space: "O(n)",
  idea: "Process meetings by start time. The heap holds the end time of each room in use. If the earliest-ending room is free by now, reuse it; otherwise open a new room.",
  code: code(`
    function minMeetingRooms(intervals: number[][]): number {
      intervals.sort((a, b) => a[0] - b[0]); //@sort
      const ends = new MinPriorityQueue<number>(); // end time of each busy room
      for (const [s, e] of intervals) { //@loop
        if (ends.size() && ends.front() <= s) ends.dequeue(); //@reuse
        ends.enqueue(e); //@push
      }
      return ends.size(); //@ret
    }
  `),
  run({ intervals: list }, t) {
    list.sort((a, b) => a[0] - b[0]);
    // A sorted array stands in for the heap; front = smallest end.
    const ends: number[] = [];
    const push = (e: number) => {
      let i = 0;
      while (i < ends.length && ends[i] < e) i++;
      ends.splice(i, 0, e);
    };
    const view = (k?: number) => [vars({ rooms: ends.length }), intervals("meetings (by start)", list, tones([k, "active"])), arr("room end times (min first)", ends, { tones: tones([0, "compare"]) })];
    t.step("sort", "Sort meetings by start time.", view());
    list.forEach(([s, e], k) => {
      t.step("loop", `Meeting [${s},${e}].`, view(k));
      if (ends.length && ends[0] <= s) {
        t.step("reuse", `The room ending at ${ends[0]} is free by ${s}. Reuse it.`, view(k));
        ends.shift();
      }
      push(e);
      t.step("push", `That room is now busy until ${e}. Rooms in use: ${ends.length}.`, view(k));
    });
    t.step("ret", `Return ${ends.length}.`, view());
    return ends.length;
  },
});

const twoPointers = defineSolution<Input>({
  id: "two-pointers",
  name: "Sorted Starts & Ends (Two Pointers)",
  time: "O(n log n)",
  space: "O(n)",
  idea: "Sort start and end times separately. Sweep the starts: if a meeting ends before the next one starts, that room frees up; otherwise you need another room.",
  code: code(`
    function minMeetingRooms(intervals: number[][]): number {
      const starts = intervals.map((x) => x[0]).sort((a, b) => a - b);
      const ends = intervals.map((x) => x[1]).sort((a, b) => a - b); //@sort
      let rooms = 0, best = 0, e = 0;
      for (let s = 0; s < starts.length; s++) { //@loop
        if (starts[s] < ends[e]) rooms++; //@open
        else e++; //@reuse
        best = Math.max(best, rooms); //@best
      }
      return best; //@ret
    }
  `),
  run({ intervals: list }, t) {
    const starts = list.map((x) => x[0]).sort((a, b) => a - b);
    const ends = list.map((x) => x[1]).sort((a, b) => a - b);
    let rooms = 0,
      best = 0,
      e = 0;
    const view = (s?: number) => [
      vars({ rooms, best }),
      arr("starts", starts, { tones: tones([s, "active"]), pointers: { s } }),
      arr("ends", ends, { tones: tones([e, "compare"]), pointers: { e } }),
    ];
    t.step("sort", "Sort starts and ends independently.", view());
    for (let s = 0; s < starts.length; s++) {
      t.step("loop", `Next start: ${starts[s]}. Earliest unmatched end: ${ends[e]}.`, view(s));
      if (starts[s] < ends[e]) {
        rooms++;
        t.step("open", `${starts[s]} < ${ends[e]}: every room is busy. Open one (rooms = ${rooms}).`, view(s));
      } else {
        e++;
        t.step("reuse", `A meeting ended at ${ends[e - 1]}: reuse that room.`, view(s));
      }
      best = Math.max(best, rooms);
      t.step("best", `best = ${best}.`, view(s));
    }
    t.step("ret", `Return ${best}.`, view());
    return best;
  },
});

const sweep = defineSolution<Input>({
  id: "sweep-line",
  name: "Sweep Line Events",
  time: "O(n log n)",
  space: "O(n)",
  idea: "Turn each meeting into a +1 at its start and a −1 at its end. Sort the events (ends before starts at the same time) and track the running total.",
  code: code(`
    function minMeetingRooms(intervals: number[][]): number {
      const events = intervals.flatMap(([s, e]) => [[s, 1], [e, -1]]);
      events.sort((a, b) => a[0] - b[0] || a[1] - b[1]); //@sort
      let cur = 0, best = 0;
      for (const [, delta] of events) { //@loop
        cur += delta; //@apply
        best = Math.max(best, cur); //@best
      }
      return best; //@ret
    }
  `),
  run({ intervals: list }, t) {
    const events = list.flatMap(([s, e]) => [[s, 1], [e, -1]] as [number, number][]);
    events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    let cur = 0,
      best = 0;
    const labels = events.map(([time, d]) => `${time}${d > 0 ? "+" : "−"}`);
    const view = (k?: number) => [vars({ "rooms in use": cur, best }), arr("events (time, +start / −end)", labels, { tones: tones([k, k !== undefined && events[k][1] > 0 ? "active" : "compare"]) })];
    t.step("sort", "Build and sort the events.", view());
    events.forEach(([time, delta], k) => {
      t.step("loop", `t = ${time}: a meeting ${delta > 0 ? "starts" : "ends"}.`, view(k));
      cur += delta;
      t.step("apply", `Rooms in use: ${cur}.`, view(k));
      best = Math.max(best, cur);
      t.step("best", `best = ${best}.`, view(k));
    });
    t.step("ret", `Return ${best}.`, view());
    return best;
  },
});

export default defineProblem<Input>({
  description: "Given meeting time intervals, return the minimum number of conference rooms needed so that no two overlapping meetings share a room.",
  input: { default: "intervals = [[0,30],[5,10],[15,20],[10,18]]", parse: (a) => ({ intervals: a.pairs("intervals") }) },
  examples: [
    { input: "intervals = [[0,30],[5,10],[15,20]]", output: 2 },
    { input: "intervals = [[7,10],[2,4]]", output: 1 },
    { input: "intervals = [[1,5],[2,6],[3,7]]", output: 3 },
  ],
  solutions: [minHeap, twoPointers, sweep],
});

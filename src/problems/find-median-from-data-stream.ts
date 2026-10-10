import { arr, tones, vars } from "@/core/panels";
import { parseOps } from "@/core/input";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  ops: string[];
  args: number[][];
}

type Out = number | null;
const fmtOut = (out: Out[]) => out.map((o) => (o === null ? "null" : String(o)));

/** Insert into an ascending array; returns the index used. */
const insertSorted = (a: number[], x: number, desc = false) => {
  let i = 0;
  while (i < a.length && (desc ? a[i] >= x : a[i] <= x)) i++;
  a.splice(i, 0, x);
  return i;
};

const sortedArray = defineSolution<Input>({
  id: "sorted-array",
  name: "Sorted Array with Binary Insert",
  time: "add O(n), find O(1)",
  space: "O(n)",
  idea: "Keep all numbers sorted. Binary search the insert position (shifting costs O(n)); the median is the middle element or the average of the middle two.",
  code: code(`
    class MedianFinder {
      a: number[] = []; //@ctor
      addNum(num: number): void {
        let lo = 0, hi = this.a.length;
        while (lo < hi) { const mid = (lo + hi) >> 1; if (this.a[mid] <= num) lo = mid + 1; else hi = mid; }
        this.a.splice(lo, 0, num); //@add
      }
      findMedian(): number {
        const n = this.a.length, m = n >> 1;
        return n % 2 ? this.a[m] : (this.a[m - 1] + this.a[m]) / 2; //@median
      }
    }
  `),
  run({ ops, args }, t) {
    const a: number[] = [],
      out: Out[] = [];
    const view = (op: string, hi: number[] = []) => [
      vars({ op }),
      arr("sorted", a, { tones: tones(...hi.map((h) => [h, "active"] as [number, "active"])) }),
      arr("output", fmtOut(out), { indexLabels: false }),
    ];
    ops.forEach((op, k) => {
      const label = `${op}(${args[k].join(",")})`;
      if (op === "MedianFinder") {
        out.push(null);
        t.step("ctor", "Empty list.", view(label));
      } else if (op === "addNum") {
        const at = insertSorted(a, args[k][0]);
        out.push(null);
        t.step("add", `Insert ${args[k][0]} at index ${at}.`, view(label, [at]));
      } else {
        const n = a.length,
          m = n >> 1;
        const med = n % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
        out.push(med);
        t.step("median", n % 2 ? `Odd count: middle element ${med}.` : `Even count: (${a[m - 1]} + ${a[m]}) / 2 = ${med}.`, view(label, n % 2 ? [m] : [m - 1, m]));
      }
    });
    return out;
  },
});

const twoHeaps = defineSolution<Input>({
  id: "two-heaps",
  name: "Two Heaps",
  time: "add O(log n), find O(1)",
  space: "O(n)",
  idea: "A max-heap holds the smaller half and a min-heap the larger half, with the max-heap allowed one extra. The median is the max-heap's top, or the average of both tops.",
  code: code(`
    class MedianFinder {
      low = new MaxPriorityQueue<number>(); // smaller half
      high = new MinPriorityQueue<number>(); // larger half //@ctor
      addNum(num: number): void {
        this.low.enqueue(num); //@push-low
        this.high.enqueue(this.low.dequeue()); //@move-up
        if (this.high.size() > this.low.size()) this.low.enqueue(this.high.dequeue()); //@rebalance
      }
      findMedian(): number {
        return this.low.size() > this.high.size() ? this.low.front() : (this.low.front() + this.high.front()) / 2; //@median
      }
    }
  `),
  run({ ops, args }, t) {
    // Sorted arrays stand in for the heaps; index 0 is each heap's top.
    const low: number[] = [],
      high: number[] = [],
      out: Out[] = [];
    const view = (op: string, hiLow = false, hiHigh = false) => [
      vars({ op }),
      arr("low: max-heap (top first)", low, { tones: tones([hiLow ? 0 : null, "active"]), indexLabels: false }),
      arr("high: min-heap (top first)", high, { tones: tones([hiHigh ? 0 : null, "active"]), indexLabels: false }),
      arr("output", fmtOut(out), { indexLabels: false }),
    ];
    ops.forEach((op, k) => {
      const label = `${op}(${args[k].join(",")})`;
      if (op === "MedianFinder") {
        out.push(null);
        t.step("ctor", "Two empty heaps.", view(label));
      } else if (op === "addNum") {
        const x = args[k][0];
        insertSorted(low, x, true);
        t.step("push-low", `Push ${x} into low.`, view(label, true));
        const moved = low.shift()!;
        insertSorted(high, moved);
        t.step("move-up", `Move low's largest (${moved}) to high, so every low ≤ every high.`, view(label, false, true));
        if (high.length > low.length) {
          const back = high.shift()!;
          insertSorted(low, back, true);
          t.step("rebalance", `high is bigger: move its smallest (${back}) back to low.`, view(label, true));
        }
        out.push(null);
      } else {
        const med = low.length > high.length ? low[0] : (low[0] + high[0]) / 2;
        out.push(med);
        t.step("median", low.length > high.length ? `low has the extra element: median ${med}.` : `Equal sizes: (${low[0]} + ${high[0]}) / 2 = ${med}.`, view(label, true, low.length === high.length));
      }
    });
    return out;
  },
});

export default defineProblem<Input>({
  description: "Design a data structure that receives a stream of integers via addNum and returns the median of everything so far via findMedian. Input is a LeetCode-style list of operations.",
  input: {
    default: 'ops = ["MedianFinder","addNum","addNum","findMedian","addNum","findMedian","addNum","addNum","findMedian"], args = [[],[5],[15],[],[1],[],[3],[8],[]]',
    parse: (a) => parseOps<number>(a),
  },
  examples: [
    { input: 'ops = ["MedianFinder","addNum","addNum","findMedian","addNum","findMedian"], args = [[],[1],[2],[],[3],[]]', output: [null, null, null, 1.5, null, 2] },
    { input: 'ops = ["MedianFinder","addNum","findMedian","addNum","findMedian"], args = [[],[-1],[],[-2],[]]', output: [null, null, -1, null, -1.5] },
  ],
  solutions: [sortedArray, twoHeaps],
});

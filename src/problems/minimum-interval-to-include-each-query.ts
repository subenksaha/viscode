import { arr, intervals, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  intervals: [number, number][];
  queries: number[];
}

const size = ([l, r]: [number, number]) => r - l + 1;

const brute = defineSolution<Input>({
  id: "brute-force",
  name: "Check Every Interval per Query",
  time: "O(n·q)",
  space: "O(1)",
  idea: "For each query, scan all intervals and keep the smallest size among those that contain it.",
  code: code(`
    function minInterval(intervals: number[][], queries: number[]): number[] {
      return queries.map((q) => { //@query
        let best = Infinity;
        for (const [l, r] of intervals) //@check
          if (l <= q && q <= r) best = Math.min(best, r - l + 1);
        return best === Infinity ? -1 : best; //@answer
      });
    }
  `),
  run({ intervals: iv, queries }, t) {
    const res: number[] = [];
    queries.forEach((q, qi) => {
      let best = Infinity,
        bestAt = -1;
      t.step("query", `Query ${q}.`, [vars({ q }), intervals("intervals", iv), arr("queries", queries, { tones: tones([qi, "active"]) })]);
      iv.forEach(([l, r], k) => {
        const inside = l <= q && q <= r;
        if (inside && r - l + 1 < best) {
          best = r - l + 1;
          bestAt = k;
        }
        t.step("check", inside ? `[${l}, ${r}] contains ${q} (size ${r - l + 1}).` : `[${l}, ${r}] misses ${q}.`, () => [
          vars({ q, best: best === Infinity ? "∞" : best }),
          intervals("intervals", iv, tones([bestAt, "success"], [k, inside ? "active" : "danger"])),
        ]);
      });
      res.push(best === Infinity ? -1 : best);
      t.step("answer", `Answer for ${q}: ${res.at(-1)}.`, [arr("answers", res, { indexLabels: queries.slice(0, res.length).map(String) })]);
    });
    return res;
  },
});

const sweepHeap = defineSolution<Input>({
  id: "sort-heap",
  name: "Sorted Sweep + Min-heap",
  time: "O((n + q) log n)",
  space: "O(n + q)",
  idea: "Sort intervals by start and answer queries in increasing order. Push every interval that has started into a min-heap keyed by size, pop the ones that already ended, and the heap top is the answer.",
  code: code(`
    function minInterval(intervals: number[][], queries: number[]): number[] {
      intervals.sort((a, b) => a[0] - b[0]);
      const order = queries.map((_, i) => i).sort((a, b) => queries[a] - queries[b]); //@sort
      const heap = new MinPriorityQueue<[number, number]>((e) => e[0]); // [size, right]
      const res = new Array(queries.length).fill(-1);
      let i = 0;
      for (const qi of order) {
        const q = queries[qi];
        while (i < intervals.length && intervals[i][0] <= q) { //@push
          const [l, r] = intervals[i++]; heap.enqueue([r - l + 1, r]);
        }
        while (heap.size() && heap.front()![1] < q) heap.dequeue(); //@pop
        if (heap.size()) res[qi] = heap.front()![0]; //@answer
      }
      return res; //@ret
    }
  `),
  run({ intervals: iv, queries }, t) {
    iv.sort((a, b) => a[0] - b[0]);
    const order = queries.map((_, i) => i).sort((a, b) => queries[a] - queries[b]);
    const heap: [number, number, number][] = []; // [size, right, interval index]
    const res: (number | null)[] = new Array(queries.length).fill(null);
    const state: Tone[] = iv.map(() => "muted");
    let i = 0;
    const view = (qi?: number) => [
      vars({ q: qi !== undefined ? queries[qi] : undefined }),
      intervals("intervals (sorted by start)", iv, tones(...state.map((s, k) => [k, s] as [number, Tone]), [heap[0]?.[2], "success"])),
      arr("min-heap (size, right)", heap.map(([sz, r]) => `${sz}, ${r}`), { indexLabels: false, tones: tones([0, "success"]) }),
      arr("answers", res.map((x) => x ?? ""), { indexLabels: queries.map(String), tones: tones([qi, "active"]) }),
    ];
    const push = (e: [number, number, number]) => {
      let p = 0;
      while (p < heap.length && heap[p][0] <= e[0]) p++;
      heap.splice(p, 0, e);
    };
    t.step("sort", "Sort intervals by start; process queries from smallest to largest.", view());
    for (const qi of order) {
      const q = queries[qi];
      while (i < iv.length && iv[i][0] <= q) {
        push([size(iv[i]), iv[i][1], i]);
        state[i] = "window";
        t.step("push", `[${iv[i]}] has started by ${q}: push size ${size(iv[i])}.`, view(qi));
        i++;
      }
      while (heap.length && heap[0][1] < q) {
        const [, , k] = heap.shift()!;
        state[k] = "danger";
        t.step("pop", `[${iv[k]}] ends before ${q}: pop it.`, view(qi));
      }
      res[qi] = heap.length ? heap[0][0] : -1;
      t.step("answer", heap.length ? `Smallest live interval for ${q} has size ${res[qi]}.` : `No interval contains ${q}: -1.`, view(qi));
    }
    t.step("ret", `Return [${res}].`, view());
    return res as number[];
  },
});

export default defineProblem<Input>({
  description: "Given intervals [left, right] (inclusive, size = right − left + 1) and a list of queries, return for each query the size of the smallest interval that contains it, or -1 if none does.",
  input: { default: "intervals = [[1,4],[2,4],[3,6],[4,4]], queries = [2,3,4,5]", parse: (a) => ({ intervals: a.pairs("intervals"), queries: a.ints("queries") }) },
  examples: [
    { input: "intervals = [[1,4],[2,4],[3,6],[4,4]], queries = [2,3,4,5]", output: [3, 3, 1, 4] },
    { input: "intervals = [[2,3],[2,5],[1,8],[20,25]], queries = [2,19,5,22]", output: [2, -1, 4, 6] },
  ],
  solutions: [brute, sweepHeap],
});

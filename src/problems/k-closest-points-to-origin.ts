import { arr, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  points: [number, number][];
  k: number;
}

const d2 = ([x, y]: [number, number]) => x * x + y * y;
const label = (p: [number, number]) => `(${p[0]},${p[1]}) d²=${d2(p)}`;

const sorting = defineSolution<Input>({
  id: "sort",
  name: "Sort by Distance",
  time: "O(n log n)",
  space: "O(n)",
  idea: "Sort all points by squared distance (no need for the square root) and take the first k.",
  code: code(`
    function kClosest(points: number[][], k: number): number[][] {
      points.sort((a, b) => a[0] ** 2 + a[1] ** 2 - (b[0] ** 2 + b[1] ** 2)); //@sort
      return points.slice(0, k); //@ret
    }
  `),
  run({ points, k }, t) {
    t.step("sort", "Sort by x² + y².", [arr("points", points.map(label), { indexLabels: false })]);
    points.sort((a, b) => d2(a) - d2(b));
    t.step("ret", `Take the first ${k}.`, [arr("sorted", points.map(label), { tones: tones(...points.map((_, i) => [i < k ? i : null, "success"] as [number | null, "success"])) })]);
    return points.slice(0, k);
  },
});

const maxHeap = defineSolution<Input>({
  id: "max-heap",
  name: "Max-heap of Size k",
  time: "O(n log k)",
  space: "O(k)",
  idea: "Keep the k closest points seen so far in a max-heap keyed by distance. A new point that is closer than the heap's farthest replaces it.",
  code: code(`
    function kClosest(points: number[][], k: number): number[][] {
      const dist = (p: number[]) => p[0] ** 2 + p[1] ** 2;
      const heap = new MaxPriorityQueue<number[]>(dist); //@init
      for (const p of points) { //@loop
        heap.enqueue(p); //@push
        if (heap.size() > k) heap.dequeue(); //@evict
      }
      return heap.toArray(); //@ret
    }
  `),
  run({ points, k }, t) {
    // Sorted array stands in for the heap; index 0 = farthest.
    const heap: [number, number][] = [];
    const push = (p: [number, number]) => {
      let i = 0;
      while (i < heap.length && d2(heap[i]) >= d2(p)) i++;
      heap.splice(i, 0, p);
    };
    const view = (i?: number, evicted?: [number, number]) => [
      vars({ k, evicted: evicted ? label(evicted) : undefined }),
      arr("points", points.map(label), { tones: tones([i, "active"]), pointers: { i }, indexLabels: false }),
      arr("max-heap (farthest first)", heap.map(label), { tones: tones([0, "compare"]), indexLabels: false }),
    ];
    t.step("init", "Empty max-heap.", view());
    points.forEach((p, i) => {
      push(p);
      t.step("push", `Add ${label(p)}.`, view(i));
      if (heap.length > k) {
        const out = heap.shift()!;
        t.step("evict", `Heap has ${k + 1} points: drop the farthest, ${label(out)}.`, view(i, out));
      }
    });
    t.step("ret", `The heap holds the ${k} closest.`, view());
    return heap;
  },
});

export default defineProblem<Input>({
  description: "Given an array of points on the plane and an integer k, return the k points closest to the origin (Euclidean distance), in any order.",
  input: {
    default: "points = [[3,3],[5,-1],[-2,4],[1,1],[0,-2],[4,4]], k = 3",
    parse: (a) => ({ points: a.pairs("points"), k: a.int("k") }),
  },
  examples: [
    { input: "points = [[1,3],[-2,2]], k = 1", output: [[-2, 2]] },
    { input: "points = [[3,3],[5,-1],[-2,4]], k = 2", output: [[3, 3], [-2, 4]] },
  ],
  normalize: (v) => (v as number[][]).map((p) => [...p]).sort((a, b) => a[0] - b[0] || a[1] - b[1]),
  solutions: [sorting, maxHeap],
});

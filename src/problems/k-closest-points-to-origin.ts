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
  approach: [
    {
      title: "Sort by squared distance",
      detail: "x² + y² preserves the order of real distances, so no square root is needed.",
      at: "sort",
    },
    {
      title: "Take k",
      detail: "The first k points are the closest.",
      at: "ret",
    },
    {
      title: "Cost",
      detail: "O(n log n), even though only k points matter.",
    },
  ],
  code: code(`
    function kClosest(points: number[][], k: number): number[][] {
      // Squared distance is enough for comparing; no need for a square root.
      const squaredDistance = (point: number[]) => point[0] * point[0] + point[1] * point[1];
      points.sort((a, b) => squaredDistance(a) - squaredDistance(b)); //@sort
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
  approach: [
    {
      title: "Max-heap of size k",
      detail: "The top is the farthest of the k closest points seen so far.",
      at: "init",
    },
    {
      title: "Push each point",
      detail: "Add it to the heap.",
      at: "push",
    },
    {
      title: "Evict the farthest",
      detail: "Once the heap holds k+1 points, drop the top. It can't be among the k closest.",
      at: "evict",
    },
    {
      title: "Result",
      detail: "The heap holds the answer. O(n log k) time, O(k) space.",
      at: "ret",
    },
  ],
  code: code(`
    function kClosest(points: number[][], k: number): number[][] {
      const squaredDistance = (point: number[]) => point[0] * point[0] + point[1] * point[1];
      // Max-heap of the k closest points so far. The top is the farthest of them.
      const heap = new MaxPriorityQueue<number[]>(squaredDistance); //@init
      for (const point of points) { //@loop
        heap.enqueue(point); //@push
        if (heap.size() > k) heap.dequeue(); // drop the farthest //@evict
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

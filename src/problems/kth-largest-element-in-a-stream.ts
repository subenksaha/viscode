import { arr, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  ops: string[];
  args: (number | number[])[][];
}

/** Insert into an ascending array, keeping it sorted. */
const insertSorted = (a: number[], x: number) => {
  let i = 0;
  while (i < a.length && a[i] < x) i++;
  a.splice(i, 0, x);
  return i;
};

const sorted = defineSolution<Input>({
  id: "sorted-array",
  name: "Sorted Array of Everything",
  time: "O(n) per add",
  space: "O(n)",
  idea: "Keep every value in a sorted array. The kth largest is k positions from the end.",
  approach: [
    {
      title: "Sort once",
      detail: "Keep every value in ascending order.",
      at: "ctor",
    },
    {
      title: "Insert in place",
      detail: "Find the position and splice: O(n).",
      at: "insert",
    },
    {
      title: "Read k from the end",
      detail: "sorted[n − k] is the kth largest.",
      at: "ret",
    },
  ],
  code: code(`
    class KthLargest {
      sorted: number[];
      constructor(private k: number, nums: number[]) {
        this.sorted = [...nums].sort((a, b) => a - b); //@ctor
      }
      add(val: number): number {
        let position = 0;
        while (position < this.sorted.length && this.sorted[position] < val) position++;
        this.sorted.splice(position, 0, val); //@insert
        return this.sorted[this.sorted.length - this.k]; //@ret
      }
    }
  `),
  run({ ops, args }, t) {
    let k = 0;
    let vals: number[] = [];
    const out: (number | null)[] = [];
    const view = (op: string, ins?: number) => [
      vars({ op, k }),
      arr("sorted values", vals, { tones: tones([ins, "compare"], [vals.length - k, "success"]), pointers: { kth: vals.length - k } }),
      arr("output", out.map((o) => (o === null ? "null" : o)), { indexLabels: false }),
    ];
    ops.forEach((op, i) => {
      if (op === "KthLargest") {
        k = args[i][0] as number;
        vals = [...(args[i][1] as number[])].sort((a, b) => a - b);
        out.push(null);
        t.step("ctor", `Sort the initial values. k = ${k}.`, view(`KthLargest(${k})`));
      } else {
        const v = args[i][0] as number;
        const at = insertSorted(vals, v);
        t.step("insert", `Insert ${v} at index ${at}.`, view(`add(${v})`, at));
        out.push(vals[vals.length - k]);
        t.step("ret", `The ${k}th largest is ${out.at(-1)}.`, view(`add(${v})`, at));
      }
    });
    return out;
  },
});

const minHeap = defineSolution<Input>({
  id: "min-heap",
  name: "Min-heap of Size k",
  time: "O(log k) per add",
  space: "O(k)",
  idea: "Keep only the k largest values in a min-heap. Its smallest element is exactly the kth largest overall; anything smaller can be thrown away.",
  approach: [
    {
      title: "Keep only the top k",
      detail: "Values smaller than the current kth largest can never matter again.",
      at: "ctor",
    },
    {
      title: "Push",
      detail: "Add the new value.",
      at: "push",
    },
    {
      title: "Evict the smallest beyond k",
      detail: "The heap shrinks back to k values.",
      at: "evict",
    },
    {
      title: "Top is the answer",
      detail: "The smallest of the k largest is the kth largest. O(log k) per add.",
      at: "ret",
    },
  ],
  code: code(`
    class KthLargest {
      // Min-heap holding the k largest values. Its top is the k-th largest.
      heap = new MinPriorityQueue<number>();
      constructor(private k: number, nums: number[]) {
        for (const num of nums) this.add(num); //@ctor
      }
      add(val: number): number {
        this.heap.enqueue(val); //@push
        if (this.heap.size() > this.k) this.heap.dequeue(); // drop the smallest //@evict
        return this.heap.front()!; //@ret
      }
    }
  `),
  run({ ops, args }, t) {
    // An ascending array stands in for the heap; index 0 is the heap's top.
    let k = 0;
    const heap: number[] = [];
    const out: (number | null)[] = [];
    const view = (op: string, hi?: number) => [
      vars({ op, k }),
      arr("min-heap (smallest first)", heap, { indexLabels: false, tones: tones([hi, "compare"], [0, "success"]) }),
      arr("output", out.map((o) => (o === null ? "null" : o)), { indexLabels: false }),
    ];
    const add = (op: string, v: number, record: boolean) => {
      const at = insertSorted(heap, v);
      t.step("push", `Push ${v}.`, view(op, at));
      if (heap.length > k) {
        const gone = heap.shift();
        t.step("evict", `More than ${k} values: pop the smallest, ${gone}.`, view(op));
      }
      if (record) {
        out.push(heap[0]);
        t.step("ret", `Heap top ${heap[0]} is the ${k}th largest.`, view(op));
      }
    };
    ops.forEach((op, i) => {
      if (op === "KthLargest") {
        k = args[i][0] as number;
        out.push(null);
        t.step("ctor", `k = ${k}. Add the initial values.`, view(`KthLargest(${k})`));
        for (const x of args[i][1] as number[]) add(`KthLargest(${k})`, x, false);
      } else add(`add(${args[i][0]})`, args[i][0] as number, true);
    });
    return out;
  },
});

export default defineProblem<Input>({
  description: "Design a class that returns the kth largest value of a growing stream. KthLargest(k, nums) starts the stream; add(val) appends val and returns the current kth largest. Input is a LeetCode-style list of operations.",
  input: {
    default: 'ops = ["KthLargest","add","add","add","add","add"], args = [[3,[4,5,8,2]],[3],[5],[10],[9],[4]]',
    parse: (a) => {
      const ops = a.strs("ops");
      const args = a.matrix<number | number[]>("args");
      if (ops.length !== args.length) throw new Error("ops and args must have the same length");
      return { ops, args };
    },
  },
  examples: [
    { input: 'ops = ["KthLargest","add","add","add","add","add"], args = [[3,[4,5,8,2]],[3],[5],[10],[9],[4]]', output: [null, 4, 5, 5, 8, 8] },
    { input: 'ops = ["KthLargest","add","add","add"], args = [[1,[]],[-3],[-2],[-4]]', output: [null, -3, -2, -2] },
  ],
  solutions: [sorted, minHeap],
});

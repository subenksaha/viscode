import { arr, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  stones: number[];
}

const resort = defineSolution<Input>({
  id: "sort-each-round",
  name: "Sort Every Round",
  time: "O(n² log n)",
  space: "O(1)",
  idea: "Each round, sort the stones and smash the two heaviest. Put the difference back if it is not zero.",
  code: code(`
    function lastStoneWeight(stones: number[]): number {
      while (stones.length > 1) {
        stones.sort((a, b) => a - b); //@sort
        const heaviest = stones.pop()!; //@smash
        const secondHeaviest = stones.pop()!;
        if (heaviest !== secondHeaviest) stones.push(heaviest - secondHeaviest); //@rest
      }
      return stones[0] ?? 0; //@ret
    }
  `),
  run({ stones }, t) {
    while (stones.length > 1) {
      stones.sort((a, b) => a - b);
      const n = stones.length;
      t.step("sort", "Sort; the two heaviest are at the end.", [arr("stones", stones, { tones: tones([n - 1, "active"], [n - 2, "compare"]) })]);
      const y = stones.pop()!,
        x = stones.pop()!;
      t.step("smash", `Smash ${y} and ${x}.`, [vars({ heaviest: y, secondHeaviest: x }), arr("stones", stones)]);
      if (y !== x) {
        stones.push(y - x);
        t.step("rest", `${y} − ${x} = ${y - x} survives.`, [vars({ heaviest: y, secondHeaviest: x }), arr("stones", stones, { tones: tones([stones.length - 1, "success"]) })]);
      }
    }
    const res = stones[0] ?? 0;
    t.step("ret", `Return ${res}.`, [arr("stones", stones)]);
    return res;
  },
});

const maxHeap = defineSolution<Input>({
  id: "max-heap",
  name: "Max-heap",
  time: "O(n log n)",
  space: "O(n)",
  idea: "A max-heap hands out the two heaviest stones in O(log n) each round and takes back the leftover just as fast.",
  code: code(`
    function lastStoneWeight(stones: number[]): number {
      const heap = new MaxPriorityQueue<number>();
      for (const stone of stones) heap.enqueue(stone); //@build
      while (heap.size() > 1) {
        const heaviest = heap.dequeue(); //@smash
        const secondHeaviest = heap.dequeue();
        if (heaviest !== secondHeaviest) heap.enqueue(heaviest - secondHeaviest); //@rest
      }
      return heap.size() > 0 ? heap.front() : 0; //@ret
    }
  `),
  run({ stones }, t) {
    // A descending array stands in for the heap; index 0 is the top.
    const heap = [...stones].sort((a, b) => b - a);
    const view = (extra: Record<string, unknown> = {}, hi?: number) => [vars(extra), arr("max-heap (largest first)", heap, { indexLabels: false, tones: tones([hi, "success"]) })];
    t.step("build", "Heapify all stones.", view());
    while (heap.length > 1) {
      const y = heap.shift()!,
        x = heap.shift()!;
      t.step("smash", `Pop ${y} and ${x}.`, view({ heaviest: y, secondHeaviest: x }));
      if (y !== x) {
        let i = 0;
        while (i < heap.length && heap[i] > y - x) i++;
        heap.splice(i, 0, y - x);
        t.step("rest", `Push the leftover ${y - x}.`, view({ heaviest: y, secondHeaviest: x }, i));
      } else t.step("rest", "Equal weights: both destroyed.", view({ heaviest: y, secondHeaviest: x }));
    }
    const res = heap[0] ?? 0;
    t.step("ret", `Return ${res}.`, view());
    return res;
  },
});

export default defineProblem<Input>({
  description: "Each turn, smash the two heaviest stones x ≤ y together: equal stones are both destroyed, otherwise a stone of weight y − x remains. Return the weight of the last stone, or 0 if none remain.",
  input: { default: "stones = [2,7,4,1,8,1]", parse: (a) => ({ stones: a.ints("stones") }) },
  examples: [
    { input: "stones = [2,7,4,1,8,1]", output: 1 },
    { input: "stones = [1]", output: 1 },
    { input: "stones = [3,3]", output: 0 },
  ],
  solutions: [resort, maxHeap],
});

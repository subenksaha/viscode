import { list, vars } from "@/core/panels";
import { buildList, listNodes, listToArray, type ListNode } from "@/core/structures";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  head: ListNode | null;
}

const countTwice = defineSolution<Input>({
  id: "count-then-walk",
  name: "Count, Then Walk",
  time: "O(n)",
  space: "O(1)",
  idea: "First pass counts the nodes. Second pass walks ⌊n / 2⌋ steps from the head.",
  approach: [
    {
      title: "Count",
      detail: "The first pass finds the length n.",
      at: "count",
      nth: -1,
    },
    {
      title: "Walk ⌊n/2⌋ steps",
      detail: "For even n this lands on the second middle, as required.",
      at: "walk",
      nth: -1,
    },
    {
      title: "Return",
      detail: "Two passes, O(1) space.",
      at: "ret",
    },
  ],
  code: code(`
    function middleNode(head: ListNode | null): ListNode | null {
      let length = 0;
      for (let node = head; node !== null; node = node.next) length++; //@count
      let middle = head;
      const steps = Math.floor(length / 2);
      for (let step = 0; step < steps; step++) middle = middle!.next; //@walk
      return middle; //@ret
    }
  `),
  run({ head }, t) {
    const nodes = listNodes(head);
    let n = 0;
    for (let p = head; p; p = p.next) {
      n++;
      t.step("count", `Count ${p.val}: length = ${n}.`, [vars({ length: n }), list("list", nodes, { tones: [[p, "active"]], pointers: { node: p } })]);
    }
    let mid = head;
    for (let k = 0; k < n >> 1; k++) {
      mid = mid!.next;
      t.step("walk", `Step ${k + 1} of ${n >> 1}.`, [vars({ length: n, step: k + 1 }), list("list", nodes, { tones: [[mid, "active"]], pointers: { middle: mid } })]);
    }
    t.step("ret", `Middle is ${mid?.val ?? "null"}.`, [list("list", nodes, { tones: [[mid, "success"]], pointers: { middle: mid } })]);
    return listToArray(mid);
  },
});

const fastSlow = defineSolution<Input>({
  id: "fast-slow",
  name: "Fast & Slow Pointers",
  time: "O(n)",
  space: "O(1)",
  idea: "Move slow one step and fast two steps at a time. When fast runs off the end, slow is in the middle.",
  approach: [
    {
      title: "Two pointers at head",
      detail: "fast moves twice as fast as slow.",
      at: "init",
    },
    {
      title: "Advance",
      detail: "Each loop moves slow 1 step and fast 2 steps.",
      at: "fast",
      nth: 2,
    },
    {
      title: "slow is in the middle",
      detail: "When fast can't move two more steps, slow has covered half the list. One pass.",
      at: "ret",
    },
  ],
  code: code(`
    function middleNode(head: ListNode | null): ListNode | null {
      // fast moves two steps for each step of slow, so slow ends in the middle.
      let slow = head; //@init
      let fast = head;
      while (fast !== null && fast.next !== null) { //@loop
        slow = slow!.next; //@slow
        fast = fast.next.next; //@fast
      }
      return slow; //@ret
    }
  `),
  run({ head }, t) {
    const nodes = listNodes(head);
    let slow = head,
      fast = head;
    const view = (done = false) => [list("list", nodes, { tones: [[fast, "compare"], [slow, done ? "success" : "active"]], pointers: { slow, fast } })];
    t.step("init", "Both pointers start at the head.", view());
    while (fast && fast.next) {
      t.step("loop", "fast can take two more steps.", view());
      slow = slow!.next;
      t.step("slow", `slow → ${slow?.val}.`, view());
      fast = fast.next.next;
      t.step("fast", `fast → ${fast?.val ?? "null"}.`, view());
    }
    t.step("ret", `fast reached the end. slow (${slow?.val ?? "null"}) is the middle.`, view(true));
    return listToArray(slow);
  },
});

export default defineProblem<Input>({
  description: "Given the head of a singly linked list, return the middle node. If there are two middle nodes, return the second one.",
  input: { default: "head = [1,2,3,4,5,6]", parse: (a) => ({ head: buildList(a.ints("head")) }) },
  examples: [
    { input: "head = [1,2,3,4,5]", output: [3, 4, 5] },
    { input: "head = [1,2,3,4,5,6]", output: [4, 5, 6] },
  ],
  solutions: [countTwice, fastSlow],
});

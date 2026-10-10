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
  code: code(`
    function middleNode(head: ListNode | null): ListNode | null {
      let n = 0;
      for (let p = head; p; p = p.next) n++; //@count
      let mid = head;
      for (let k = 0; k < n >> 1; k++) mid = mid!.next; //@walk
      return mid; //@ret
    }
  `),
  run({ head }, t) {
    const nodes = listNodes(head);
    let n = 0;
    for (let p = head; p; p = p.next) {
      n++;
      t.step("count", `Count ${p.val}: n = ${n}.`, [vars({ n }), list("list", nodes, { tones: [[p, "active"]], pointers: { p } })]);
    }
    let mid = head;
    for (let k = 0; k < n >> 1; k++) {
      mid = mid!.next;
      t.step("walk", `Step ${k + 1} of ${n >> 1}.`, [vars({ n, steps: k + 1 }), list("list", nodes, { tones: [[mid, "active"]], pointers: { mid } })]);
    }
    t.step("ret", `Middle is ${mid?.val ?? "null"}.`, [list("list", nodes, { tones: [[mid, "success"]], pointers: { mid } })]);
    return listToArray(mid);
  },
});

const fastSlow = defineSolution<Input>({
  id: "fast-slow",
  name: "Fast & Slow Pointers",
  time: "O(n)",
  space: "O(1)",
  idea: "Move slow one step and fast two steps at a time. When fast runs off the end, slow is in the middle.",
  code: code(`
    function middleNode(head: ListNode | null): ListNode | null {
      let slow = head, fast = head; //@init
      while (fast && fast.next) { //@loop
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

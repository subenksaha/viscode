import { arr, list } from "@/core/panels";
import { buildList, listNodes, listToArray, type ListNode } from "@/core/structures";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  head: ListNode | null;
}

const array = defineSolution<Input>({
  id: "array",
  name: "Array of Nodes + Two Pointers",
  time: "O(n)",
  space: "O(n)",
  idea: "Copy the nodes into an array, then relink them by alternating from the front and the back.",
  code: code(`
    function reorderList(head: ListNode | null): void {
      const nodes: ListNode[] = [];
      for (let node = head; node !== null; node = node.next) nodes.push(node); //@collect
      let front = 0;
      let back = nodes.length - 1;
      while (front < back) { //@loop
        nodes[front].next = nodes[back]; //@front
        front++;
        if (front === back) break;
        nodes[back].next = nodes[front]; //@back
        back--;
      }
      nodes[front].next = null; //@end
    }
  `),
  run({ head }, t) {
    const nodes = listNodes(head);
    if (!nodes.length) return [];
    t.step("collect", "Store the nodes in an array.", [arr("nodes", nodes.map((n) => n.val)), list("list", nodes)]);
    let i = 0,
      j = nodes.length - 1;
    const view = () => [arr("nodes", nodes.map((n) => n.val), { pointers: { front: i, back: j } }), list("links", nodes, { tones: [[nodes[i], "active"], [nodes[j], "compare"]] })];
    while (i < j) {
      t.step("loop", `i = ${i}, j = ${j}.`, view());
      nodes[i].next = nodes[j];
      i++;
      t.step("front", `${nodes[i - 1].val} → ${nodes[j].val}.`, view());
      if (i === j) break;
      nodes[j].next = nodes[i];
      j--;
      t.step("back", `${nodes[j + 1].val} → ${nodes[i].val}.`, view());
    }
    nodes[i].next = null;
    t.step("end", `${nodes[i].val} is the new tail.`, [list("result", listNodes(head))]);
    return listToArray(head);
  },
});

const inPlace = defineSolution<Input>({
  id: "split-reverse-merge",
  name: "Split, Reverse, Merge",
  time: "O(n)",
  space: "O(1)",
  idea: "Find the middle with slow/fast pointers, reverse the second half, then weave the two halves together.",
  code: code(`
    function reorderList(head: ListNode | null): void {
      if (head === null) return;
      // 1. Find the middle: fast moves two steps for each step of slow.
      let slow = head;
      let fast = head;
      while (fast.next !== null && fast.next.next !== null) { //@mid
        slow = slow.next!;
        fast = fast.next.next;
      }
      // 2. Cut the list in two and reverse the second half.
      let prev: ListNode | null = null;
      let curr = slow.next;
      slow.next = null; //@split
      while (curr !== null) { //@reverse
        const next = curr.next;
        curr.next = prev;
        prev = curr;
        curr = next;
      }
      // 3. Weave: first, last, second, second-to-last, ...
      let first: ListNode | null = head;
      let second = prev;
      while (second !== null) { //@merge
        const firstNext: ListNode | null = first!.next;
        const secondNext: ListNode | null = second.next;
        first!.next = second; //@weave
        second.next = firstNext;
        first = firstNext;
        second = secondNext;
      }
    }
  `),
  run({ head }, t) {
    if (!head) return [];
    let slow = head,
      fast = head;
    const all = listNodes(head);
    while (fast.next && fast.next.next) {
      slow = slow.next!;
      fast = fast.next.next;
      t.step("mid", "Move slow by 1 and fast by 2.", [list("list", all, { tones: [[slow, "active"], [fast, "compare"]], pointers: { slow, fast } })]);
    }
    t.step("mid", `Middle found at ${slow.val}.`, [list("list", all, { tones: [[slow, "active"]], pointers: { slow } })]);
    let prev: ListNode | null = null,
      curr = slow.next;
    slow.next = null;
    const first = listNodes(head);
    t.step("split", "Cut the list after the middle.", [list("first half", first), list("second half", listNodes(curr))]);
    const second = listNodes(curr);
    while (curr) {
      const nx: ListNode | null = curr.next;
      curr.next = prev;
      prev = curr;
      curr = nx;
      t.step("reverse", `Reverse: ${prev.val} now points back.`, [list("first half", first), list("second half", second, { tones: [[prev, "active"]], pointers: { prev, curr } })]);
    }
    let a: ListNode | null = head,
      b = prev;
    t.step("merge", "Weave the halves together.", [list("first half", first, { pointers: { first: a } }), list("second half (reversed)", listNodes(b), { pointers: { second: b } })]);
    while (b) {
      const an: ListNode | null = a!.next,
        bn: ListNode | null = b.next;
      a!.next = b;
      b.next = an;
      t.step("weave", `${a!.val} → ${b.val} → ${an?.val ?? "null"}.`, [list("result so far", listNodes(head), { tones: [[a, "active"], [b, "compare"]] })]);
      a = an;
      b = bn;
    }
    return listToArray(head);
  },
});

export default defineProblem<Input>({
  description: "Reorder L0 → L1 → … → Ln into L0 → Ln → L1 → Ln−1 → L2 → … in place.",
  input: { default: "head = [1,2,3,4,5]", parse: (a) => ({ head: buildList(a.ints("head")) }) },
  examples: [
    { input: "head = [1,2,3,4]", output: [1, 4, 2, 3] },
    { input: "head = [1,2,3,4,5]", output: [1, 5, 2, 4, 3] },
    { input: "head = [1]", output: [1] },
  ],
  solutions: [array, inPlace],
});

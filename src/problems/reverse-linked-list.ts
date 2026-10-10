import { arr, list } from "@/core/panels";
import { buildList, listNodes, listToArray, type ListNode } from "@/core/structures";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  head: ListNode | null;
}

const iterative = defineSolution<Input>({
  id: "iterative",
  name: "Iterative Pointer Reversal",
  time: "O(n)",
  space: "O(1)",
  idea: "Walk the list with prev and curr. Save curr.next, point curr back at prev, then move both one step forward.",
  code: code(`
    function reverseList(head: ListNode | null): ListNode | null {
      let prev: ListNode | null = null, curr = head; //@init
      while (curr) { //@loop
        const next = curr.next; //@save
        curr.next = prev; //@flip
        prev = curr; //@advance
        curr = next;
      }
      return prev; //@ret
    }
  `),
  run({ head }, t) {
    const nodes = listNodes(head);
    let prev: ListNode | null = null,
      curr = head;
    const view = (next?: ListNode | null) => [
      list("list", nodes, { tones: [[prev, "success"], [curr, "active"], [next, "compare"]], pointers: { prev, curr, next } }),
    ];
    t.step("init", "prev = null, curr = head.", view());
    while (curr) {
      t.step("loop", `curr = ${curr.val}.`, view());
      const next: ListNode | null = curr.next;
      t.step("save", `Remember next = ${next?.val ?? "null"}.`, view(next));
      curr.next = prev;
      t.step("flip", `Point ${curr.val} back at ${prev?.val ?? "null"}.`, view(next));
      prev = curr;
      curr = next;
      t.step("advance", "Move prev and curr forward.", view());
    }
    t.step("ret", `New head is ${prev?.val ?? "null"}.`, view());
    return listToArray(prev);
  },
});

const recursive = defineSolution<Input>({
  id: "recursive",
  name: "Recursive",
  time: "O(n)",
  space: "O(n)",
  idea: "Reverse the rest of the list first. The old next node is now the tail of the reversed part, so attach the current node after it.",
  code: code(`
    function reverseList(head: ListNode | null): ListNode | null {
      if (!head || !head.next) return head; //@base
      const newHead = reverseList(head.next); //@recurse
      head.next.next = head; //@link
      head.next = null; //@cut
      return newHead; //@ret
    }
  `),
  run({ head }, t) {
    const nodes = listNodes(head);
    const stack: string[] = [];
    const view = (h: ListNode | null, newHead?: ListNode | null) => [
      list("list", nodes, { tones: [[h, "active"], [newHead, "success"]], pointers: { head: h, newHead } }),
      arr("call stack", stack, { indexLabels: false }),
    ];
    const rev = (h: ListNode | null): ListNode | null => {
      if (!h || !h.next) {
        t.step("base", `Base case at ${h?.val ?? "null"}: it is the new head.`, view(h, h));
        return h;
      }
      stack.push(`reverse(${h.val})`);
      t.step("recurse", `Reverse everything after ${h.val} first.`, view(h));
      const newHead = rev(h.next);
      const nxt = h.next;
      nxt.next = h;
      t.step("link", `${nxt.val}.next = ${h.val}.`, view(h, newHead));
      h.next = null;
      t.step("cut", `${h.val}.next = null (it is the new tail for now).`, view(h, newHead));
      stack.pop();
      t.step("ret", `Return new head ${newHead?.val}.`, view(h, newHead));
      return newHead;
    };
    return listToArray(rev(head));
  },
});

const stackBased = defineSolution<Input>({
  id: "stack",
  name: "Stack",
  time: "O(n)",
  space: "O(n)",
  idea: "Push every node onto a stack, then pop them off and relink them in reverse order.",
  code: code(`
    function reverseList(head: ListNode | null): ListNode | null {
      const stack: ListNode[] = [];
      for (let n = head; n; n = n.next) stack.push(n); //@push
      const dummy = new ListNode(0);
      let tail = dummy; //@init
      while (stack.length) { //@loop
        tail.next = stack.pop()!; //@pop
        tail = tail.next;
      }
      tail.next = null; //@end
      return dummy.next; //@ret
    }
  `),
  run({ head }, t) {
    const nodes = listNodes(head);
    const stack: ListNode[] = [];
    for (let n = head; n; n = n.next) {
      stack.push(n);
      t.step("push", `Push ${n.val}.`, [list("list", nodes, { tones: [[n, "active"]] }), arr("stack", stack.map((s) => s.val), { indexLabels: false })]);
    }
    const order: ListNode[] = [];
    let tail: ListNode | null = null;
    const view = () => [list("rebuilt", order, { tones: [[tail, "active"]], pointers: { tail } }), arr("stack", stack.map((s) => s.val), { indexLabels: false })];
    t.step("init", "Build a new chain behind a dummy node.", view());
    while (stack.length) {
      t.step("loop", `Stack top is ${stack.at(-1)!.val}.`, view());
      const n = stack.pop()!;
      if (tail) tail.next = n;
      tail = n;
      order.push(n);
      t.step("pop", `Append ${n.val}.`, view());
    }
    if (tail) tail.next = null;
    t.step("end", "Terminate the new tail.", view());
    t.step("ret", "Return the new head.", view());
    return listToArray(order[0] ?? null);
  },
});

export default defineProblem<Input>({
  description: "Reverse a singly linked list and return the new head.",
  input: { default: "head = [1,2,3,4,5]", parse: (a) => ({ head: buildList(a.ints("head")) }) },
  examples: [
    { input: "head = [1,2,3,4,5]", output: [5, 4, 3, 2, 1] },
    { input: "head = [1,2]", output: [2, 1] },
    { input: "head = []", output: [] },
  ],
  solutions: [stackBased, recursive, iterative],
});

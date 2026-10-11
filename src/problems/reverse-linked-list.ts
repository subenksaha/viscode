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
  approach: [
    {
      title: "Two pointers",
      detail: "prev is the reversed part (initially empty) and curr is the rest of the list.",
      at: "init",
    },
    {
      title: "Save next",
      detail: "Remember curr.next before it gets overwritten.",
      at: "save",
    },
    {
      title: "Flip the pointer",
      detail: "Point curr back at prev.",
      at: "flip",
    },
    {
      title: "Advance",
      detail: "prev = curr and curr = next. Repeat until curr is null.",
      at: "advance",
    },
    {
      title: "New head",
      detail: "prev now points at the old tail. O(n) time, O(1) space.",
      at: "ret",
    },
  ],
  code: code(`
    function reverseList(head: ListNode | null): ListNode | null {
      let prev: ListNode | null = null; //@init
      let curr = head;
      while (curr !== null) { //@loop
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
  approach: [
    {
      title: "Recurse to the end",
      detail: "Reverse everything after head first.",
      at: "recurse",
    },
    {
      title: "Base case",
      detail: "A single node (the old tail) is already reversed. It becomes the new head.",
      at: "base",
    },
    {
      title: "Hang head after its old next",
      detail: "After the recursion, head.next is the tail of the reversed rest, so point it back at head.",
      at: "link",
    },
    {
      title: "Cut the forward link",
      detail: "Clear head.next so head is the new tail. The recursion stack uses O(n) space.",
      at: "cut",
    },
  ],
  code: code(`
    function reverseList(head: ListNode | null): ListNode | null {
      if (head === null || head.next === null) return head; //@base
      const newHead = reverseList(head.next); //@recurse
      // head.next is now the last node of the reversed rest; hang head after it.
      const nextNode = head.next;
      nextNode.next = head; //@link
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
  approach: [
    {
      title: "Push every node",
      detail: "The stack holds the nodes in last-in-first-out order, which is the reverse of the list.",
      at: "push",
      nth: -1,
    },
    {
      title: "Pop to rebuild",
      detail: "Append nodes as they come off the stack behind a dummy head.",
      at: "pop",
    },
    {
      title: "Terminate the tail",
      detail: "The old head is now last. Set its next to null to cut the old link, or the list would contain a cycle.",
      at: "end",
    },
    {
      title: "Return",
      detail: "O(n) extra space for the stack.",
      at: "ret",
    },
  ],
  code: code(`
    function reverseList(head: ListNode | null): ListNode | null {
      const stack: ListNode[] = [];
      for (let node = head; node !== null; node = node.next) stack.push(node); //@push
      const dummyHead = new ListNode(0);
      let tail = dummyHead; //@init
      while (stack.length > 0) { //@loop
        tail.next = stack.pop()!; //@pop
        tail = tail.next;
      }
      tail.next = null; //@end
      return dummyHead.next; //@ret
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

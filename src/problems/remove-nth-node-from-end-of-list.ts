import { list, vars } from "@/core/panels";
import { buildList, listNodes, listToArray, ListNode } from "@/core/structures";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  head: ListNode | null;
  n: number;
}

const twoPass = defineSolution<Input>({
  id: "two-pass",
  name: "Two Passes (Count Length)",
  time: "O(L)",
  space: "O(1)",
  idea: "Count the length L, then walk L − n steps from a dummy head to the node just before the target and unlink it.",
  code: code(`
    function removeNthFromEnd(head: ListNode | null, n: number): ListNode | null {
      let len = 0;
      for (let p = head; p; p = p.next) len++; //@count
      const dummy = new ListNode(0, head);
      let prev = dummy; //@init
      for (let i = 0; i < len - n; i++) prev = prev.next!; //@walk
      prev.next = prev.next!.next; //@unlink
      return dummy.next; //@ret
    }
  `),
  run({ head, n }, t) {
    const dummy = new ListNode(0, head);
    const nodes = [dummy, ...listNodes(head)];
    const names: [ListNode, string][] = [[dummy, "D"]];
    let len = 0;
    for (let p = head; p; p = p.next) {
      len++;
      t.step("count", `len = ${len}.`, [vars({ len }), list("list", nodes, { names, tones: [[p, "active"]] })]);
    }
    let prev = dummy;
    const view = (target?: ListNode | null) => [vars({ len, n, steps: len - n }), list("list", nodes, { names, tones: [[prev, "active"], [target, "danger"]], pointers: { prev } })];
    t.step("init", "Start prev at the dummy node.", view());
    for (let i = 0; i < len - n; i++) {
      prev = prev.next!;
      t.step("walk", `Step ${i + 1} of ${len - n}.`, view());
    }
    const target = prev.next!;
    t.step("unlink", `Remove ${target.val}: link ${prev === dummy ? "dummy" : prev.val} to ${target.next?.val ?? "null"}.`, view(target));
    prev.next = target.next;
    t.step("ret", "Return dummy.next.", [list("result", listNodes(dummy.next))]);
    return listToArray(dummy.next);
  },
});

const onePass = defineSolution<Input>({
  id: "two-pointers",
  name: "One Pass, Two Pointers",
  time: "O(L)",
  space: "O(1)",
  idea: "Move fast n + 1 steps ahead of slow (both starting at a dummy). Then move both until fast falls off the end; slow is right before the target.",
  code: code(`
    function removeNthFromEnd(head: ListNode | null, n: number): ListNode | null {
      const dummy = new ListNode(0, head);
      let slow: ListNode = dummy, fast: ListNode | null = dummy; //@init
      for (let i = 0; i <= n; i++) fast = fast!.next; //@gap
      while (fast) { slow = slow.next!; fast = fast.next; } //@move
      slow.next = slow.next!.next; //@unlink
      return dummy.next; //@ret
    }
  `),
  run({ head, n }, t) {
    const dummy = new ListNode(0, head);
    const nodes = [dummy, ...listNodes(head)];
    const names: [ListNode, string][] = [[dummy, "D"]];
    let slow: ListNode = dummy,
      fast: ListNode | null = dummy;
    const view = (target?: ListNode | null) => [list("list", nodes, { names, tones: [[slow, "active"], [fast, "compare"], [target, "danger"]], pointers: { slow, fast } })];
    t.step("init", "Both pointers start at the dummy.", view());
    for (let i = 0; i <= n; i++) {
      fast = fast!.next;
      t.step("gap", `Move fast ahead (${i + 1} of ${n + 1}).`, view());
    }
    while (fast) {
      slow = slow.next!;
      fast = fast.next;
      t.step("move", "Move both pointers.", view());
    }
    const target = slow.next!;
    t.step("unlink", `fast is past the end, so slow is just before the target (${target.val}). Unlink it.`, view(target));
    slow.next = target.next;
    t.step("ret", "Return dummy.next.", [list("result", listNodes(dummy.next))]);
    return listToArray(dummy.next);
  },
});

export default defineProblem<Input>({
  description: "Remove the nth node from the end of a linked list and return its head.",
  input: { default: "head = [1,2,3,4,5], n = 2", parse: (a) => ({ head: buildList(a.ints("head")), n: a.int("n") }) },
  examples: [
    { input: "head = [1,2,3,4,5], n = 2", output: [1, 2, 3, 5] },
    { input: "head = [1], n = 1", output: [] },
    { input: "head = [1,2], n = 1", output: [1] },
  ],
  solutions: [twoPass, onePass],
});

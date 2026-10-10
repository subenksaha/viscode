import { arr, list } from "@/core/panels";
import { buildList, listNodes, listToArray, type ListNode } from "@/core/structures";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  list1: ListNode | null;
  list2: ListNode | null;
}

const iterative = defineSolution<Input>({
  id: "iterative",
  name: "Iterative with Dummy Head",
  time: "O(n + m)",
  space: "O(1)",
  idea: "Keep a tail pointer behind a dummy node. Repeatedly attach the smaller of the two front nodes, then attach whatever is left.",
  code: code(`
    function mergeTwoLists(a: ListNode | null, b: ListNode | null): ListNode | null {
      const dummy = new ListNode(0);
      let tail = dummy; //@init
      while (a && b) { //@loop
        if (a.val <= b.val) { tail.next = a; a = a.next; } //@takeA
        else { tail.next = b; b = b.next; } //@takeB
        tail = tail.next; //@advance
      }
      tail.next = a ?? b; //@rest
      return dummy.next; //@ret
    }
  `),
  run({ list1, list2 }, t) {
    let a = list1,
      b = list2;
    const merged: ListNode[] = [];
    const restA = () => listNodes(a),
      restB = () => listNodes(b);
    const view = () => [
      list("list1 (remaining)", restA(), { tones: [[a, "active"]], pointers: { a } }),
      list("list2 (remaining)", restB(), { tones: [[b, "compare"]], pointers: { b } }),
      list("merged", merged, { tones: [[merged.at(-1), "success"]], pointers: { tail: merged.at(-1) } }),
    ];
    t.step("init", "dummy → (empty); tail = dummy.", view());
    while (a && b) {
      t.step("loop", `Compare ${a.val} and ${b.val}.`, view());
      if (a.val <= b.val) {
        if (merged.length) merged.at(-1)!.next = a;
        merged.push(a);
        a = a.next;
        t.step("takeA", `Take ${merged.at(-1)!.val} from list1.`, view());
      } else {
        if (merged.length) merged.at(-1)!.next = b;
        merged.push(b);
        b = b.next;
        t.step("takeB", `Take ${merged.at(-1)!.val} from list2.`, view());
      }
      t.step("advance", "Move tail forward.", view());
    }
    const rest = a ?? b;
    if (merged.length) merged.at(-1)!.next = rest;
    merged.push(...listNodes(rest));
    a = b = null;
    t.step("rest", "One list is empty. Attach the rest of the other.", view());
    t.step("ret", "Return dummy.next.", view());
    return listToArray(merged[0] ?? null);
  },
});

const recursive = defineSolution<Input>({
  id: "recursive",
  name: "Recursive",
  time: "O(n + m)",
  space: "O(n + m)",
  idea: "The smaller head goes first; its next is the merge of the remaining nodes.",
  code: code(`
    function mergeTwoLists(a: ListNode | null, b: ListNode | null): ListNode | null {
      if (!a) return b; //@baseA
      if (!b) return a; //@baseB
      if (a.val <= b.val) { a.next = mergeTwoLists(a.next, b); return a; } //@pickA
      b.next = mergeTwoLists(a, b.next); //@pickB
      return b;
    }
  `),
  run({ list1, list2 }, t) {
    const stack: string[] = [];
    const view = (a: ListNode | null, b: ListNode | null) => [
      list("list1 (from a)", listNodes(a), { tones: [[a, "active"]], pointers: { a } }),
      list("list2 (from b)", listNodes(b), { tones: [[b, "compare"]], pointers: { b } }),
      arr("call stack", stack, { indexLabels: false }),
    ];
    const merge = (a: ListNode | null, b: ListNode | null): ListNode | null => {
      if (!a) {
        t.step("baseA", "list1 is empty: return list2.", view(a, b));
        return b;
      }
      if (!b) {
        t.step("baseB", "list2 is empty: return list1.", view(a, b));
        return a;
      }
      if (a.val <= b.val) {
        stack.push(`${a.val} → merge(…)`);
        t.step("pickA", `${a.val} ≤ ${b.val}: ${a.val} goes first.`, view(a, b));
        a.next = merge(a.next, b);
        stack.pop();
        return a;
      }
      stack.push(`${b.val} → merge(…)`);
      t.step("pickB", `${b.val} < ${a.val}: ${b.val} goes first.`, view(a, b));
      b.next = merge(a, b.next);
      stack.pop();
      return b;
    };
    const res = merge(list1, list2);
    t.step("baseA", `Merged: [${listToArray(res)}].`, [list("merged", listNodes(res))]);
    return listToArray(res);
  },
});

export default defineProblem<Input>({
  description: "Merge two sorted linked lists into one sorted list by splicing their nodes together. Return the merged head.",
  input: {
    default: "list1 = [1,2,4], list2 = [1,3,4]",
    parse: (a) => ({ list1: buildList(a.ints("list1")), list2: buildList(a.ints("list2")) }),
  },
  examples: [
    { input: "list1 = [1,2,4], list2 = [1,3,4]", output: [1, 1, 2, 3, 4, 4] },
    { input: "list1 = [], list2 = []", output: [] },
    { input: "list1 = [], list2 = [0]", output: [0] },
  ],
  solutions: [iterative, recursive],
});


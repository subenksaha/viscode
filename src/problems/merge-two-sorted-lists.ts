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
  approach: [
    {
      title: "Dummy head and tail",
      detail: "A dummy node avoids special-casing the first append. tail always points at the last node of the merged list.",
      at: "init",
    },
    {
      title: "Take the smaller front",
      detail: "Compare the two front nodes and splice the smaller one after tail. Taking list1 on ties keeps the merge stable.",
      at: "takeA",
    },
    {
      title: "Advance tail",
      detail: "Move tail onto the node just attached.",
      at: "advance",
    },
    {
      title: "Append the leftover",
      detail: "When one list runs out, the rest of the other is already sorted. Attach it in one step.",
      at: "rest",
    },
    {
      title: "Return dummy.next",
      detail: "No new nodes are created. O(n + m) time, O(1) space.",
      at: "ret",
    },
  ],
  code: code(`
    function mergeTwoLists(list1: ListNode | null, list2: ListNode | null): ListNode | null {
      const dummyHead = new ListNode(0);
      let tail = dummyHead; //@init
      while (list1 !== null && list2 !== null) { //@loop
        if (list1.val <= list2.val) {
          tail.next = list1; //@takeA
          list1 = list1.next;
        } else {
          tail.next = list2; //@takeB
          list2 = list2.next;
        }
        tail = tail.next; //@advance
      }
      // One list is empty; attach whatever is left of the other.
      tail.next = list1 !== null ? list1 : list2; //@rest
      return dummyHead.next; //@ret
    }
  `),
  run({ list1, list2 }, t) {
    let a = list1,
      b = list2;
    const merged: ListNode[] = [];
    const restA = () => listNodes(a),
      restB = () => listNodes(b);
    const view = () => [
      list("list1 (remaining)", restA(), { tones: [[a, "active"]], pointers: { list1: a } }),
      list("list2 (remaining)", restB(), { tones: [[b, "compare"]], pointers: { list2: b } }),
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
  approach: [
    {
      title: "Smaller head goes first",
      detail: "Whichever head is smaller is the head of the merged list.",
      at: "pickA",
    },
    {
      title: "Its next is a smaller merge",
      detail: "Recurse on the remaining nodes and link the result after the chosen head.",
      at: "pickB",
    },
    {
      title: "Empty list base case",
      detail: "If one list is empty, the merge is just the other list. The recursion depth is O(n + m).",
      at: "baseA",
    },
  ],
  code: code(`
    function mergeTwoLists(list1: ListNode | null, list2: ListNode | null): ListNode | null {
      if (list1 === null) return list2; //@baseA
      if (list2 === null) return list1; //@baseB
      if (list1.val <= list2.val) {
        list1.next = mergeTwoLists(list1.next, list2); //@pickA
        return list1;
      }
      list2.next = mergeTwoLists(list1, list2.next); //@pickB
      return list2;
    }
  `),
  run({ list1, list2 }, t) {
    const stack: string[] = [];
    const view = (a: ListNode | null, b: ListNode | null) => [
      list("list1 (from a)", listNodes(a), { tones: [[a, "active"]], pointers: { list1: a } }),
      list("list2 (from b)", listNodes(b), { tones: [[b, "compare"]], pointers: { list2: b } }),
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


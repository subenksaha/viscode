import { arr, list, vars } from "@/core/panels";
import { buildList, ListNode, listNodes, listToArray } from "@/core/structures";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  head: ListNode | null;
  k: number;
}

const withArray = defineSolution<Input>({
  id: "collect-relink",
  name: "Collect Nodes, Relink in Groups",
  time: "O(n)",
  space: "O(n)",
  idea: "Put the nodes in an array, reverse every full block of k entries in the array, then relink the nodes in the new order.",
  code: code(`
    function reverseKGroup(head: ListNode | null, k: number): ListNode | null {
      const nodes: ListNode[] = [];
      for (let n = head; n; n = n.next) nodes.push(n); //@collect
      for (let i = 0; i + k <= nodes.length; i += k) //@block
        nodes.splice(i, k, ...nodes.slice(i, i + k).reverse()); //@reverse
      nodes.forEach((n, i) => (n.next = nodes[i + 1] ?? null)); //@relink
      return nodes[0] ?? null; //@ret
    }
  `),
  run({ head, k }, t) {
    const nodes = listNodes(head);
    t.step("collect", "Collect the nodes into an array.", [arr("nodes", nodes.map((n) => n.val))]);
    for (let i = 0; i + k <= nodes.length; i += k) {
      t.step("block", `Block [${i}, ${i + k - 1}].`, [arr("nodes", nodes.map((n) => n.val), { window: [i, i + k - 1] })]);
      nodes.splice(i, k, ...nodes.slice(i, i + k).reverse());
      t.step("reverse", "Reverse it.", [arr("nodes", nodes.map((n) => n.val), { window: [i, i + k - 1] })]);
    }
    nodes.forEach((n, i) => (n.next = nodes[i + 1] ?? null));
    t.step("relink", "Relink the nodes in array order.", [list("list", nodes)]);
    t.step("ret", "Return the new head.", [list("list", nodes, { tones: [[nodes[0], "success"]] })]);
    return listToArray(nodes[0] ?? null);
  },
});

const inPlace = defineSolution<Input>({
  id: "in-place",
  name: "In-place Group Reversal",
  time: "O(n)",
  space: "O(1)",
  idea: "Keep a pointer to the node before the current group. Check that k nodes remain, reverse them with the usual prev/curr loop, then splice the reversed group back between its neighbours.",
  code: code(`
    function reverseKGroup(head: ListNode | null, k: number): ListNode | null {
      const dummy = new ListNode(0, head);
      let before = dummy; //@init
      while (true) {
        let kth: ListNode | null = before;
        for (let i = 0; i < k && kth; i++) kth = kth.next; //@kth
        if (!kth) break; //@short
        const after = kth.next, first = before.next!;
        let prev = after, curr: ListNode | null = first;
        while (curr !== after) { const nx: ListNode | null = curr!.next; curr!.next = prev; prev = curr; curr = nx; } //@flip
        before.next = kth; //@splice
        before = first;
      }
      return dummy.next; //@ret
    }
  `),
  run({ head, k }, t) {
    const dummy = new ListNode(0, head);
    let before: ListNode = dummy;
    const view = (ptrs: Record<string, ListNode | null | undefined> = {}) => [
      vars({ k }),
      list("list", listNodes(dummy), {
        names: [[dummy, "D"]],
        tones: [[before, "compare"], ...Object.values(ptrs).map((n) => [n, "active"] as [ListNode | null | undefined, "active"])],
        pointers: { before, ...ptrs },
      }),
    ];
    t.step("init", "A dummy head makes the first group like any other.", view());
    while (true) {
      let kth: ListNode | null = before;
      for (let i = 0; i < k && kth; i++) kth = kth.next;
      if (!kth) {
        t.step("short", `Fewer than ${k} nodes remain. Leave them as they are.`, view());
        break;
      }
      t.step("kth", `The group ends at ${kth.val}.`, view({ kth }));
      const after = kth.next,
        first = before.next!;
      const group = listNodes(first).slice(0, k);
      let prev: ListNode | null = after,
        curr: ListNode | null = first;
      while (curr !== after) {
        const nx: ListNode | null = curr!.next;
        curr!.next = prev;
        prev = curr;
        curr = nx;
        const p = prev,
          c = curr === after ? null : curr;
        t.step("flip", `Point ${p!.val} at ${p!.next?.val ?? "null"}.`, () => [
          vars({ k }),
          list("group (arrows show current next)", group, { tones: [[p, "success"], [c, "active"]], pointers: { prev: p, curr: c } }),
        ]);
      }
      before.next = kth;
      t.step("splice", `Attach the reversed group: ${kth.val} … ${first.val}.`, view({ first }));
      before = first;
    }
    t.step("ret", "Return dummy.next.", view());
    return listToArray(dummy.next);
  },
});

export default defineProblem<Input>({
  description: "Reverse the nodes of a linked list k at a time. If the number of remaining nodes is less than k, leave them as is. Only node links may change, not values.",
  input: { default: "head = [1,2,3,4,5,6,7,8], k = 3", parse: (a) => ({ head: buildList(a.ints("head")), k: a.int("k") }) },
  examples: [
    { input: "head = [1,2,3,4,5], k = 2", output: [2, 1, 4, 3, 5] },
    { input: "head = [1,2,3,4,5], k = 3", output: [3, 2, 1, 4, 5] },
    { input: "head = [1,2,3,4,5,6], k = 3", output: [3, 2, 1, 6, 5, 4] },
  ],
  solutions: [withArray, inPlace],
});

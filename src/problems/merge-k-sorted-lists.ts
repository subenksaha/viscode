import { arr, list, vars } from "@/core/panels";
import { buildList, listNodes, listToArray, ListNode } from "@/core/structures";
import { code, defineProblem, defineSolution, type Tracer } from "@/core/trace";
import type { Panel } from "@/core/types";

interface Input {
  lists: (ListNode | null)[];
}

/** Merge two lists, tracing each pick under `label`. */
function mergeTwo(a: ListNode | null, b: ListNode | null, t: Tracer, label: string, context: () => Panel[]) {
  const dummy = new ListNode(0);
  let tail = dummy;
  while (a && b) {
    const pick: ListNode = a.val <= b.val ? a : b;
    t.step(label, `Compare ${a.val} and ${b.val}: take ${pick.val}.`, () => [
      ...context(),
      list("first", listNodes(a), { tones: [[a, pick === a ? "success" : "compare"]] }),
      list("second", listNodes(b), { tones: [[b, pick === b ? "success" : "compare"]] }),
      list("merged so far", listNodes(dummy.next)),
    ]);
    tail.next = pick;
    if (pick === a) a = a.next;
    else b = b.next;
    tail = tail.next;
  }
  tail.next = a ?? b;
  return dummy.next;
}

const sortAll = defineSolution<Input>({
  id: "collect-sort",
  name: "Collect & Sort",
  time: "O(N log N)",
  space: "O(N)",
  idea: "Pour every value into one array, sort it and build a new list.",
  code: code(`
    function mergeKLists(lists: (ListNode | null)[]): ListNode | null {
      const values: number[] = [];
      for (const head of lists) { //@collect
        for (let node = head; node !== null; node = node.next) values.push(node.val);
      }
      values.sort((a, b) => a - b); //@sort
      const dummyHead = new ListNode(0);
      let tail = dummyHead;
      for (const value of values) { //@build
        tail.next = new ListNode(value);
        tail = tail.next;
      }
      return dummyHead.next; //@ret
    }
  `),
  run({ lists }, t) {
    const vals: number[] = [];
    lists.forEach((h, i) => {
      for (let n = h; n; n = n.next) vals.push(n.val);
      t.step("collect", `Collect list ${i}.`, [list(`list ${i}`, listNodes(h)), arr("values", vals)]);
    });
    vals.sort((a, b) => a - b);
    t.step("sort", "Sort all values.", [arr("values", vals)]);
    const head = buildList(vals);
    t.step("build", "Build the result list.", [list("result", listNodes(head))]);
    t.step("ret", "Return it.", [list("result", listNodes(head))]);
    return listToArray(head);
  },
});

const oneByOne = defineSolution<Input>({
  id: "one-by-one",
  name: "Merge One by One",
  time: "O(k · N)",
  space: "O(1)",
  idea: "Fold the lists: merge list 0 with list 1, then the result with list 2, and so on.",
  code: code(`
    function mergeTwo(first: ListNode | null, second: ListNode | null): ListNode | null {
      const dummyHead = new ListNode(0);
      let tail = dummyHead;
      while (first !== null && second !== null) {
        if (first.val <= second.val) { //@pick
          tail.next = first;
          first = first.next;
        } else {
          tail.next = second;
          second = second.next;
        }
        tail = tail.next;
      }
      tail.next = first !== null ? first : second;
      return dummyHead.next;
    }

    function mergeKLists(lists: (ListNode | null)[]): ListNode | null {
      let result: ListNode | null = null; //@init
      for (const list of lists) { //@fold
        result = mergeTwo(result, list);
      }
      return result; //@ret
    }
  `),
  run({ lists }, t) {
    let res: ListNode | null = null;
    t.step("init", "result = empty.", [list("result", [])]);
    lists.forEach((l, i) => {
      const ctx = () => [vars({ merging: `result + list ${i}` })];
      t.step("fold", `Merge list ${i} into the result.`, () => [list("result", listNodes(res)), list(`list ${i}`, listNodes(l))]);
      res = mergeTwo(res, l, t, "pick", ctx);
    });
    t.step("ret", "Return result.", [list("result", listNodes(res))]);
    return listToArray(res);
  },
});

const divide = defineSolution<Input>({
  id: "divide-conquer",
  name: "Divide & Conquer",
  time: "O(N log k)",
  space: "O(1)",
  idea: "Merge lists in pairs: k lists become k/2, then k/4, … Every node takes part in log k merges.",
  code: code(`
    function mergeTwo(first: ListNode | null, second: ListNode | null): ListNode | null {
      const dummyHead = new ListNode(0);
      let tail = dummyHead;
      while (first !== null && second !== null) {
        if (first.val <= second.val) { //@pick
          tail.next = first;
          first = first.next;
        } else {
          tail.next = second;
          second = second.next;
        }
        tail = tail.next;
      }
      tail.next = first !== null ? first : second;
      return dummyHead.next;
    }

    function mergeKLists(lists: (ListNode | null)[]): ListNode | null {
      if (lists.length === 0) return null;
      // Merge lists in pairs, halving their number each round.
      while (lists.length > 1) { //@round
        const merged: (ListNode | null)[] = [];
        for (let i = 0; i < lists.length; i += 2) { //@pair
          const second = i + 1 < lists.length ? lists[i + 1] : null;
          merged.push(mergeTwo(lists[i], second));
        }
        lists = merged;
      }
      return lists[0]; //@ret
    }
  `),
  run({ lists }, t) {
    if (!lists.length) {
      t.step("ret", "No lists.");
      return [];
    }
    let round = 0;
    while (lists.length > 1) {
      round++;
      const cur = lists;
      t.step("round", `Round ${round}: ${cur.length} lists.`, () => cur.map((l, i) => list(`list ${i}`, listNodes(l))));
      const next: (ListNode | null)[] = [];
      for (let i = 0; i < cur.length; i += 2) {
        t.step("pair", `Merge list ${i} with ${i + 1 < cur.length ? `list ${i + 1}` : "nothing"}.`, () => [list(`list ${i}`, listNodes(cur[i])), list(`list ${i + 1}`, listNodes(cur[i + 1] ?? null))]);
        next.push(mergeTwo(cur[i], cur[i + 1] ?? null, t, "pick", () => [vars({ round, pair: `${i} + ${i + 1}` })]));
      }
      lists = next;
    }
    t.step("ret", "One list left. Return it.", [list("result", listNodes(lists[0]))]);
    return listToArray(lists[0]);
  },
});

const heap = defineSolution<Input>({
  id: "min-heap",
  name: "Min-heap of List Heads",
  time: "O(N log k)",
  space: "O(k)",
  idea: "Keep the current head of every list in a min-heap. Pop the smallest, append it, and push its successor.",
  code: code(`
    function mergeKLists(lists: (ListNode | null)[]): ListNode | null {
      // Min-heap of the current head of each list.
      const heap = new PriorityQueue<ListNode>((a, b) => a.val - b.val);
      for (const head of lists) { //@init
        if (head !== null) heap.enqueue(head);
      }
      const dummyHead = new ListNode(0);
      let tail = dummyHead;
      while (!heap.isEmpty()) { //@loop
        const smallest = heap.dequeue()!; //@pop
        tail.next = smallest;
        tail = smallest;
        if (smallest.next !== null) heap.enqueue(smallest.next); //@push
      }
      return dummyHead.next; //@ret
    }
  `),
  run({ lists }, t) {
    // A sorted array stands in for the heap.
    const pq: ListNode[] = [];
    const push = (n: ListNode) => {
      let i = 0;
      while (i < pq.length && pq[i].val <= n.val) i++;
      pq.splice(i, 0, n);
    };
    lists.forEach((l) => l && push(l));
    const merged: ListNode[] = [];
    const view = () => [arr("heap (min first)", pq.map((n) => n.val), { indexLabels: false }), list("merged", merged, { tones: [[merged.at(-1), "success"]] })];
    t.step("init", "Push the head of each list.", view());
    while (pq.length) {
      t.step("loop", `Heap has ${pq.length} node(s).`, view());
      const node = pq.shift()!;
      if (merged.length) merged.at(-1)!.next = node;
      merged.push(node);
      t.step("pop", `Pop the smallest (${node.val}) and append it.`, view());
      if (node.next) {
        push(node.next);
        t.step("push", `Push its successor ${node.next.val}.`, view());
      }
    }
    t.step("ret", "Heap empty. Return the merged list.", view());
    return listToArray(merged[0] ?? null);
  },
});

export default defineProblem<Input>({
  description: "Merge k sorted linked lists into one sorted linked list and return it.",
  input: {
    default: "lists = [[1,4,5],[1,3,4],[2,6]]",
    parse: (a) => ({ lists: a.matrix<number>("lists").map((l) => buildList(l)) }),
  },
  examples: [
    { input: "lists = [[1,4,5],[1,3,4],[2,6]]", output: [1, 1, 2, 3, 4, 4, 5, 6] },
    { input: "lists = []", output: [] },
    { input: "lists = [[]]", output: [] },
  ],
  solutions: [sortAll, oneByOne, divide, heap],
});

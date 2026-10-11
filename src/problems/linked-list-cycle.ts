import { list, map, vars } from "@/core/panels";
import { buildList, listNodes, type ListNode } from "@/core/structures";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  head: ListNode | null;
}

const hashSet = defineSolution<Input>({
  id: "hash-set",
  name: "Hash Set of Visited Nodes",
  time: "O(n)",
  space: "O(n)",
  idea: "Walk the list and remember each node. Meeting a node twice means there is a cycle; reaching null means there is not.",
  code: code(`
    function hasCycle(head: ListNode | null): boolean {
      const seen = new Set<ListNode>(); //@init
      for (let node = head; node !== null; node = node.next) { //@loop
        if (seen.has(node)) return true; //@found
        seen.add(node); //@add
      }
      return false; //@ret
    }
  `),
  run({ head }, t) {
    const nodes = listNodes(head);
    const seen = new Set<ListNode>();
    const view = (n?: ListNode | null, hit = false) => [
      list("list", nodes, { tones: [...[...seen].map((s) => [s, "visited"] as [ListNode, "visited"]), [n, hit ? "danger" : "active"]], pointers: { node: n } }),
      map("seen", [...seen].map((s) => [`#${nodes.indexOf(s)} (${s.val})`, ""])),
    ];
    t.step("init", "Empty set.", view());
    for (let n = head; n; n = n.next) {
      if (seen.has(n)) {
        t.step("found", `Node ${n.val} was seen before. Cycle!`, view(n, true));
        return true;
      }
      t.step("loop", `Visit ${n.val}.`, view(n));
      seen.add(n);
      t.step("add", "Remember it.", view(n));
    }
    t.step("ret", "Reached null. No cycle.", view());
    return false;
  },
});

const floyd = defineSolution<Input>({
  id: "floyd",
  name: "Floyd's Tortoise and Hare",
  time: "O(n)",
  space: "O(1)",
  idea: "Move slow one step and fast two steps at a time. In a cycle, fast gains one step per move and must land on slow; otherwise fast falls off the end.",
  code: code(`
    function hasCycle(head: ListNode | null): boolean {
      let slow = head; //@init
      let fast = head;
      while (fast !== null && fast.next !== null) { //@loop
        slow = slow!.next; //@slow
        fast = fast.next.next; //@fast
        if (slow === fast) return true; //@meet
      }
      return false; //@ret
    }
  `),
  run({ head }, t) {
    const nodes = listNodes(head);
    let slow = head,
      fast = head,
      moves = 0;
    const view = (met = false) => [
      vars({ moves }),
      list("list", nodes, { tones: [[slow, met ? "success" : "compare"], [fast, met ? "success" : "active"]], pointers: { slow, fast } }),
    ];
    t.step("init", "Both start at head.", view());
    while (fast && fast.next) {
      t.step("loop", "fast can still move two steps.", view());
      slow = slow!.next;
      t.step("slow", `slow → ${slow?.val}.`, view());
      fast = fast.next.next;
      moves++;
      t.step("fast", `fast → ${fast?.val ?? "null"}.`, view());
      if (slow === fast) {
        t.step("meet", "They meet: there is a cycle.", view(true));
        return true;
      }
    }
    t.step("ret", "fast reached the end. No cycle.", view());
    return false;
  },
});

export default defineProblem<Input>({
  description: "Return true if the linked list has a cycle. In the input, pos is the index the tail links back to (-1 means no cycle).",
  input: {
    default: "head = [3,2,0,-4], pos = 1",
    parse: (a) => ({ head: buildList(a.ints("head"), a.int("pos")) }),
  },
  examples: [
    { input: "head = [3,2,0,-4], pos = 1", output: true },
    { input: "head = [1,2], pos = 0", output: true },
    { input: "head = [1], pos = -1", output: false },
  ],
  solutions: [hashSet, floyd],
});

import { arr, list, map } from "@/core/panels";
import { ListNode, listNodes } from "@/core/structures";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  head: ListNode | null;
  random: Map<ListNode, ListNode | null>;
}

/** Builds the list from LeetCode's [[val, randomIndex], ...] encoding. */
function parse(pairs: (number | null)[][]): Input {
  const nodes = pairs.map(([v]) => new ListNode(v as number));
  nodes.forEach((n, i) => (n.next = nodes[i + 1] ?? null));
  const random = new Map<ListNode, ListNode | null>();
  pairs.forEach(([, r], i) => random.set(nodes[i], r === null ? null : nodes[r]));
  return { head: nodes[0] ?? null, random };
}

/** Encodes a copied list back to [[val, randomIndex], ...]. */
function encode(head: ListNode | null, random: Map<ListNode, ListNode | null>) {
  const nodes = listNodes(head);
  const at = new Map(nodes.map((n, i) => [n, i]));
  return nodes.map((n) => [n.val, random.get(n) ? at.get(random.get(n)!)! : null]);
}

const randomLabels = (nodes: ListNode[], random: Map<ListNode, ListNode | null>, name: (n: ListNode) => string) =>
  nodes.map((n) => {
    const r = random.get(n);
    return r ? `${name(n)} → ${name(r)}` : `${name(n)} → null`;
  });

const hashMap = defineSolution<Input>({
  id: "hash-map",
  name: "Old → New Hash Map",
  time: "O(n)",
  space: "O(n)",
  idea: "First pass: create a copy of every node and remember old → new. Second pass: wire each copy's next and random through the map.",
  code: code(`
    function copyRandomList(head: Node | null): Node | null {
      const copy = new Map<Node | null, Node | null>([[null, null]]);
      for (let n = head; n; n = n.next) copy.set(n, new Node(n.val)); //@clone
      for (let n = head; n; n = n.next) {
        copy.get(n)!.next = copy.get(n.next)!; //@next
        copy.get(n)!.random = copy.get(n.random)!; //@random
      }
      return copy.get(head)!; //@ret
    }
  `),
  run({ head, random }, t) {
    const olds = listNodes(head);
    const name = new Map<ListNode, string>(olds.map((n, i) => [n, `#${i}`]));
    const copy = new Map<ListNode, ListNode>();
    const newRandom = new Map<ListNode, ListNode | null>();
    const label = (n: ListNode) => name.get(n) ?? `#${olds.findIndex((o) => copy.get(o) === n)}'`;
    const view = (n?: ListNode) => [
      list("original", olds, { tones: [[n, "active"]], pointers: { n } }),
      arr("original random", randomLabels(olds, random, label), { indexLabels: false }),
      list("copy", [...copy.values()], { tones: [[n && copy.get(n), "success"]] }),
      map("old → new", [...copy].map(([o, c]) => [label(o), label(c)] as [string, string])),
    ];
    for (const n of olds) {
      copy.set(n, new ListNode(n.val));
      t.step("clone", `Copy ${label(n)} (val ${n.val}).`, view(n));
    }
    for (const n of olds) {
      const c = copy.get(n)!;
      c.next = n.next ? copy.get(n.next)! : null;
      t.step("next", `${label(c)}.next = copy of ${n.next ? label(n.next) : "null"}.`, view(n));
      const r = random.get(n);
      newRandom.set(c, r ? copy.get(r)! : null);
      t.step("random", `${label(c)}.random = copy of ${r ? label(r) : "null"}.`, () => [...view(n), arr("copy random", randomLabels([...copy.values()].filter((x) => newRandom.has(x)), newRandom, label), { indexLabels: false })]);
    }
    const newHead = head ? copy.get(head)! : null;
    t.step("ret", "Return the copied head.", view());
    return encode(newHead, newRandom);
  },
});

const interleave = defineSolution<Input>({
  id: "interleave",
  name: "Interleave Copies (O(1) Extra Space)",
  time: "O(n)",
  space: "O(1)",
  idea: "Insert each copy right after its original (A → A' → B → B'). Then A'.random = A.random.next. Finally unzip the two lists.",
  code: code(`
    function copyRandomList(head: Node | null): Node | null {
      for (let n = head; n; n = n.next.next) n.next = new Node(n.val, n.next); //@weave
      for (let n = head; n; n = n.next.next) n.next.random = n.random ? n.random.next : null; //@random
      const dummy = new Node(0);
      for (let n = head, tail = dummy; n; n = n.next) { //@unzip
        tail = tail.next = n.next;
        n.next = n.next.next;
      }
      return dummy.next; //@ret
    }
  `),
  run({ head, random }, t) {
    const olds = listNodes(head);
    const names = new Map<ListNode, string>(olds.map((n, i) => [n, `#${i}`]));
    const label = (n: ListNode) => names.get(n)!;
    const view = (n?: ListNode | null, c?: ListNode | null) => [
      list("list", listNodes(head), { names: [...names].map(([k, v]) => [k, `${k.val}${v.endsWith("'") ? "'" : ""}`] as [ListNode, string]), tones: [[n, "active"], [c, "success"]] }),
      arr("random pointers", randomLabels(listNodes(head), random, label), { indexLabels: false }),
    ];
    for (let n = head; n; n = n.next!.next) {
      const c = new ListNode(n.val, n.next);
      names.set(c, `${label(n)}'`);
      n.next = c;
      t.step("weave", `Insert ${label(c)} right after ${label(n)}.`, view(n, c));
    }
    for (let n = head; n; n = n.next!.next) {
      const r = random.get(n);
      random.set(n.next!, r ? r.next : null);
      t.step("random", `${label(n.next!)}.random = ${r ? `${label(r)}.next = ${label(r.next!)}` : "null"}.`, view(n, n.next));
    }
    const dummy = new ListNode(0);
    let tail = dummy;
    const copies: ListNode[] = [];
    for (let n = head; n; n = n.next) {
      tail = tail.next = n.next!;
      copies.push(tail);
      n.next = n.next!.next;
      t.step("unzip", `Detach ${label(tail)} into the copy list; restore ${label(n)}.next.`, () => [
        list("original", olds, { tones: [[n, "active"]] }),
        list("copy", copies, { names: copies.map((c) => [c, `${c.val}'`] as [ListNode, string]), tones: [[tail, "success"]] }),
      ]);
    }
    t.step("ret", "Return the copied head.", () => [list("copy", copies, { names: copies.map((c) => [c, `${c.val}'`] as [ListNode, string]) }), arr("copy random", randomLabels(copies, random, label), { indexLabels: false })]);
    return encode(dummy.next, random);
  },
});

export default defineProblem<Input>({
  description: "Each node of a linked list has a next pointer and a random pointer to any node or null. Return a deep copy of the list. Input encodes each node as [val, random index].",
  input: { default: "head = [[7,null],[13,0],[11,4],[10,2],[1,0]]", parse: (a) => parse(a.matrix<number | null>("head")) },
  examples: [
    { input: "head = [[7,null],[13,0],[11,4],[10,2],[1,0]]", output: [[7, null], [13, 0], [11, 4], [10, 2], [1, 0]] },
    { input: "head = [[1,1],[2,1]]", output: [[1, 1], [2, 1]] },
    { input: "head = [[3,null],[3,0],[3,null]]", output: [[3, null], [3, 0], [3, null]] },
    { input: "head = []", output: [] },
  ],
  solutions: [hashMap, interleave],
});

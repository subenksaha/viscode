import { list, vars } from "@/core/panels";
import { buildList, ListNode, listNodes, listToArray } from "@/core/structures";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  l1: ListNode | null;
  l2: ListNode | null;
}

const iterative = defineSolution<Input>({
  id: "iterative",
  name: "Digit-by-digit with Carry",
  time: "O(max(m, n))",
  space: "O(1) extra",
  idea: "The digits are stored least-significant first, so add them like on paper: sum the two digits plus the carry, write sum mod 10, carry ⌊sum / 10⌋.",
  approach: [
    {
      title: "Dummy head, carry 0",
      detail: "Digits come least significant first, the same order we add in.",
      at: "init",
    },
    {
      title: "Column sum",
      detail: "digit1 + digit2 + carry. A missing digit counts as 0.",
      at: "sum",
    },
    {
      title: "Write the digit, keep the carry",
      detail: "Append sum % 10 and carry ⌊sum / 10⌋.",
      at: "write",
    },
    {
      title: "Final carry",
      detail: "Keep going while there are digits or a carry left.",
      at: "ret",
    },
  ],
  code: code(`
    function addTwoNumbers(l1: ListNode | null, l2: ListNode | null): ListNode | null {
      const dummyHead = new ListNode(0);
      let tail = dummyHead; //@init
      let carry = 0;
      while (l1 !== null || l2 !== null || carry > 0) { //@loop
        const digit1 = l1 !== null ? l1.val : 0;
        const digit2 = l2 !== null ? l2.val : 0;
        const sum = digit1 + digit2 + carry; //@sum
        carry = Math.floor(sum / 10);
        tail.next = new ListNode(sum % 10); //@write
        tail = tail.next;
        if (l1 !== null) l1 = l1.next;
        if (l2 !== null) l2 = l2.next;
      }
      return dummyHead.next; //@ret
    }
  `),
  run({ l1, l2 }, t) {
    const a = listNodes(l1),
      b = listNodes(l2);
    const out: ListNode[] = [];
    let carry = 0;
    const view = (p?: ListNode | null, q?: ListNode | null, sum?: number) => [
      vars({ carry, sum }),
      list("l1", a, { tones: [[p, "active"]], pointers: { l1: p } }),
      list("l2", b, { tones: [[q, "active"]], pointers: { l2: q } }),
      list("result", out, { tones: [[out.at(-1), "success"]] }),
    ];
    t.step("init", "Start with an empty result and carry 0.", view(l1, l2));
    while (l1 || l2 || carry) {
      t.step("loop", "Digits or carry remain.", view(l1, l2));
      const sum = (l1?.val ?? 0) + (l2?.val ?? 0) + carry;
      t.step("sum", `${l1?.val ?? 0} + ${l2?.val ?? 0} + carry ${carry} = ${sum}.`, view(l1, l2, sum));
      carry = Math.floor(sum / 10);
      const node = new ListNode(sum % 10);
      if (out.length) out.at(-1)!.next = node;
      out.push(node);
      t.step("write", `Write ${sum % 10}, carry ${carry}.`, view(l1, l2, sum));
      l1 = l1?.next ?? null;
      l2 = l2?.next ?? null;
    }
    t.step("ret", "Done.", view());
    return listToArray(out[0] ?? null);
  },
});

const recursive = defineSolution<Input>({
  id: "recursive",
  name: "Recursive",
  time: "O(max(m, n))",
  space: "O(max(m, n))",
  idea: "add(a, b, carry) builds one digit node and recursively adds the rest of both lists with the new carry.",
  approach: [
    {
      title: "Sum this position",
      detail: "Add the two digits and the carry.",
      at: "sum",
    },
    {
      title: "Recurse on the rest",
      detail: "Pass the new carry along and link the returned list after this digit.",
      at: "link",
    },
    {
      title: "Base case",
      detail: "No digits and no carry: null.",
      at: "base",
    },
  ],
  code: code(`
    function addTwoNumbers(l1: ListNode | null, l2: ListNode | null, carry = 0): ListNode | null {
      if (l1 === null && l2 === null && carry === 0) return null; //@base
      const digit1 = l1 !== null ? l1.val : 0;
      const digit2 = l2 !== null ? l2.val : 0;
      const sum = digit1 + digit2 + carry; //@sum
      const node = new ListNode(sum % 10);
      const next1 = l1 !== null ? l1.next : null;
      const next2 = l2 !== null ? l2.next : null;
      node.next = addTwoNumbers(next1, next2, Math.floor(sum / 10)); //@link
      return node; //@ret
    }
  `),
  run({ l1, l2 }, t) {
    const a = listNodes(l1),
      b = listNodes(l2);
    const built: ListNode[] = [];
    const view = (p: ListNode | null, q: ListNode | null, carry: number, sum?: number) => [
      vars({ carry, sum }),
      list("l1", a, { tones: [[p, "active"]] }),
      list("l2", b, { tones: [[q, "active"]] }),
      list("result", built, { tones: [[built.at(-1), "success"]] }),
    ];
    const add = (p: ListNode | null, q: ListNode | null, carry: number): ListNode | null => {
      if (!p && !q && !carry) {
        t.step("base", "Nothing left: null.", () => view(p, q, carry));
        return null;
      }
      const sum = (p?.val ?? 0) + (q?.val ?? 0) + carry;
      const node = new ListNode(sum % 10);
      if (built.length) built.at(-1)!.next = node;
      built.push(node);
      t.step("sum", `${p?.val ?? 0} + ${q?.val ?? 0} + ${carry} = ${sum}: digit ${sum % 10}.`, () => view(p, q, carry, sum));
      node.next = add(p?.next ?? null, q?.next ?? null, Math.floor(sum / 10));
      t.step("link", `Digit ${node.val} links to the rest.`, () => view(p, q, carry, sum));
      return node;
    };
    const res = add(l1, l2, 0);
    t.step("ret", "Done.", view(null, null, 0));
    return listToArray(res);
  },
});

export default defineProblem<Input>({
  description: "Two non-negative integers are stored as linked lists of digits in reverse order (ones digit first). Return their sum as a linked list in the same format.",
  input: { default: "l1 = [2,4,3], l2 = [5,6,4]", parse: (a) => ({ l1: buildList(a.ints("l1")), l2: buildList(a.ints("l2")) }) },
  examples: [
    { input: "l1 = [2,4,3], l2 = [5,6,4]", output: [7, 0, 8] },
    { input: "l1 = [0], l2 = [0]", output: [0] },
    { input: "l1 = [9,9,9,9,9,9,9], l2 = [9,9,9,9]", output: [8, 9, 9, 9, 0, 0, 0, 1] },
  ],
  solutions: [iterative, recursive],
});

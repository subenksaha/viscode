import { arr, tree } from "@/core/panels";
import { buildTree, type TreeNode } from "@/core/structures";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  p: TreeNode | null;
  q: TreeNode | null;
}

const recursive = defineSolution<Input>({
  id: "recursive",
  name: "Recursive",
  time: "O(n)",
  space: "O(h)",
  idea: "Two trees are equal if both are empty, or both roots have the same value and their left and right subtrees are equal.",
  code: code(`
    function isSameTree(p: TreeNode | null, q: TreeNode | null): boolean {
      if (p === null && q === null) return true; //@both-null
      if (p === null || q === null || p.val !== q.val) return false; //@differ
      return isSameTree(p.left, q.left) && isSameTree(p.right, q.right); //@recurse
    }
  `),
  run({ p: P, q: Q }, t) {
    const okP: [TreeNode, Tone][] = [],
      okQ: [TreeNode, Tone][] = [];
    const view = (a: TreeNode | null, b: TreeNode | null, bad = false) => [
      tree("p", P, { tones: [...okP, [a, bad ? "danger" : "active"]] }),
      tree("q", Q, { tones: [...okQ, [b, bad ? "danger" : "active"]] }),
    ];
    const same = (a: TreeNode | null, b: TreeNode | null): boolean => {
      if (!a && !b) {
        t.step("both-null", "Both are null: equal.", () => view(a, b));
        return true;
      }
      if (!a || !b || a.val !== b.val) {
        t.step("differ", !a || !b ? "One side is null and the other is not." : `${a.val} ≠ ${b.val}.`, () => view(a, b, true));
        return false;
      }
      okP.push([a, "success"]);
      okQ.push([b, "success"]);
      t.step("recurse", `Both are ${a.val}. Compare the children.`, () => view(a, b));
      return same(a.left, b.left) && same(a.right, b.right);
    };
    const res = same(P, Q);
    t.step("recurse", res ? "The trees are identical." : "The trees differ.", () => view(null, null));
    return res;
  },
});

const bfs = defineSolution<Input>({
  id: "bfs",
  name: "Iterative BFS on Pairs",
  time: "O(n)",
  space: "O(w)",
  idea: "Walk both trees in lockstep with a queue of node pairs, comparing each pair.",
  code: code(`
    function isSameTree(p: TreeNode | null, q: TreeNode | null): boolean {
      const queue: [TreeNode | null, TreeNode | null][] = [[p, q]]; // pairs to compare //@init
      while (queue.length > 0) { //@loop
        const [first, second] = queue.shift()!; //@pop
        if (first === null && second === null) continue;
        if (first === null || second === null || first.val !== second.val) return false; //@differ
        queue.push([first.left, second.left]); //@push
        queue.push([first.right, second.right]);
      }
      return true; //@ret
    }
  `),
  run({ p: P, q: Q }, t) {
    const queue: [TreeNode | null, TreeNode | null][] = [[P, Q]];
    const okP: [TreeNode, Tone][] = [],
      okQ: [TreeNode, Tone][] = [];
    const view = (a?: TreeNode | null, b?: TreeNode | null, bad = false) => [
      tree("p", P, { tones: [...okP, [a, bad ? "danger" : "active"]] }),
      tree("q", Q, { tones: [...okQ, [b, bad ? "danger" : "active"]] }),
      arr("queue of pairs", queue.map(([x, y]) => `${x?.val ?? "∅"}|${y?.val ?? "∅"}`), { indexLabels: false }),
    ];
    t.step("init", "Queue the root pair.", view());
    while (queue.length) {
      const [a, b] = queue.shift()!;
      if (!a && !b) continue;
      t.step("pop", `Compare ${a?.val ?? "null"} and ${b?.val ?? "null"}.`, () => view(a, b));
      if (!a || !b || a.val !== b.val) {
        t.step("differ", "Mismatch. Return false.", () => view(a, b, true));
        return false;
      }
      okP.push([a, "success"]);
      okQ.push([b, "success"]);
      queue.push([a.left, b.left], [a.right, b.right]);
      t.step("push", "Equal. Queue the child pairs.", () => view(a, b));
    }
    t.step("ret", "Every pair matched. Return true.", view());
    return true;
  },
});

export default defineProblem<Input>({
  description: "Return true if two binary trees have the same structure and the same node values.",
  input: {
    default: "p = [1,2,3,4], q = [1,2,3,4]",
    parse: (a) => ({ p: buildTree(a.nullableInts("p")), q: buildTree(a.nullableInts("q")) }),
  },
  examples: [
    { input: "p = [1,2,3], q = [1,2,3]", output: true },
    { input: "p = [1,2], q = [1,null,2]", output: false },
    { input: "p = [1,2,1], q = [1,1,2]", output: false },
  ],
  solutions: [recursive, bfs],
});

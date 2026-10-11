import { arr, tones, tree, vars } from "@/core/panels";
import { buildTree, type TreeNode } from "@/core/structures";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  root: TreeNode | null;
  k: number;
}

const collectAll = defineSolution<Input>({
  id: "inorder-array",
  name: "Full In-order Traversal",
  time: "O(n)",
  space: "O(n)",
  idea: "In-order traversal of a BST lists values in sorted order. Collect them all and take index k − 1.",
  code: code(`
    function kthSmallest(root: TreeNode | null, k: number): number {
      const sortedValues: number[] = [];
      // In-order traversal of a BST visits values in increasing order.
      function inorder(node: TreeNode | null) {
        if (node === null) return;
        inorder(node.left);
        sortedValues.push(node.val); //@visit
        inorder(node.right);
      }
      inorder(root);
      return sortedValues[k - 1]; //@ret
    }
  `),
  run({ root, k }, t) {
    const vals: number[] = [];
    const done: [TreeNode, Tone][] = [];
    const walk = (n: TreeNode | null) => {
      if (!n) return;
      walk(n.left);
      vals.push(n.val);
      done.push([n, "success"]);
      t.step("visit", `Visit ${n.val}.`, () => [tree("tree", root, { tones: [...done, [n, "active"]] }), arr("sorted values", vals)]);
      walk(n.right);
    };
    walk(root);
    t.step("ret", `vals[${k - 1}] = ${vals[k - 1]}.`, [arr("sorted values", vals, { tones: tones([k - 1, "success"]) })]);
    return vals[k - 1];
  },
});

const iterative = defineSolution<Input>({
  id: "iterative-early-stop",
  name: "Iterative In-order, Stop at k",
  time: "O(h + k)",
  space: "O(h)",
  idea: "Walk in-order with an explicit stack and stop as soon as the k-th node is popped. There is no need to visit the rest of the tree.",
  code: code(`
    function kthSmallest(root: TreeNode | null, k: number): number {
      const stack: TreeNode[] = [];
      let node = root; //@init
      let visited = 0;
      while (true) {
        while (node !== null) { //@left
          stack.push(node);
          node = node.left;
        }
        node = stack.pop()!; //@pop
        visited++;
        if (visited === k) return node.val; //@found
        node = node.right; //@right
      }
    }
  `),
  run({ root, k }, t) {
    const stack: TreeNode[] = [];
    let n = root,
      count = 0;
    const done: [TreeNode, Tone][] = [];
    const view = (cur?: TreeNode | null, hit = false) => [
      vars({ k, visited: count }),
      tree("tree", root, { tones: [...done, ...stack.map((s) => [s, "compare"] as [TreeNode, Tone]), [cur, hit ? "success" : "active"]] }),
      arr("stack", stack.map((s) => s.val), { indexLabels: false }),
    ];
    t.step("init", "Start at the root.", view());
    for (;;) {
      while (n) {
        stack.push(n);
        n = n.left;
      }
      t.step("left", "Push the left spine.", view());
      const cur = stack.pop()!;
      count++;
      t.step("pop", `Pop ${cur.val}: number ${count} in sorted order.`, () => view(cur));
      if (count === k) {
        t.step("found", `That is the ${k}-th smallest. Return ${cur.val}.`, () => view(cur, true));
        return cur.val;
      }
      done.push([cur, "visited"]);
      n = cur.right;
      t.step("right", "Move into the right subtree.", () => view(cur));
    }
  },
});

export default defineProblem<Input>({
  description: "Return the k-th smallest value (1-indexed) in a binary search tree.",
  input: {
    default: "root = [5,3,6,2,4,null,null,1], k = 3",
    parse: (a) => ({ root: buildTree(a.nullableInts("root")), k: a.int("k") }),
  },
  examples: [
    { input: "root = [3,1,4,null,2], k = 1", output: 1 },
    { input: "root = [5,3,6,2,4,null,null,1], k = 3", output: 3 },
  ],
  solutions: [collectAll, iterative],
});

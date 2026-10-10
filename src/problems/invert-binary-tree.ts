import { arr, tree } from "@/core/panels";
import { buildTree, treeToArray, type TreeNode } from "@/core/structures";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  root: TreeNode | null;
}

const recursive = defineSolution<Input>({
  id: "recursive",
  name: "Recursive",
  time: "O(n)",
  space: "O(h)",
  idea: "Swap the left and right child of the root, then invert both subtrees.",
  code: code(`
    function invertTree(root: TreeNode | null): TreeNode | null {
      if (!root) return null; //@base
      [root.left, root.right] = [root.right, root.left]; //@swap
      invertTree(root.left); //@left
      invertTree(root.right); //@right
      return root; //@ret
    }
  `),
  run({ root }, t) {
    const done: [TreeNode, Tone][] = [];
    const view = (n: TreeNode | null) => [tree("tree", root, { tones: [...done, [n, "active"], [n?.left, "compare"], [n?.right, "compare"]] })];
    const inv = (n: TreeNode | null) => {
      if (!n) return;
      [n.left, n.right] = [n.right, n.left];
      done.push([n, "success"]);
      t.step("swap", `Swap the children of ${n.val}.`, () => view(n));
      if (n.left) t.step("left", `Invert the subtree at ${n.left.val}.`, () => view(n));
      inv(n.left);
      if (n.right) t.step("right", `Invert the subtree at ${n.right.val}.`, () => view(n));
      inv(n.right);
    };
    if (!root) t.step("base", "Empty tree.");
    inv(root);
    t.step("ret", "Every node has been swapped.", view(null));
    return treeToArray(root);
  },
});

const bfs = defineSolution<Input>({
  id: "bfs",
  name: "Iterative BFS",
  time: "O(n)",
  space: "O(w)",
  idea: "Visit nodes level by level and swap each node's children.",
  code: code(`
    function invertTree(root: TreeNode | null): TreeNode | null {
      const queue = root ? [root] : []; //@init
      while (queue.length) { //@loop
        const n = queue.shift()!; //@pop
        [n.left, n.right] = [n.right, n.left]; //@swap
        if (n.left) queue.push(n.left);
        if (n.right) queue.push(n.right); //@push
      }
      return root; //@ret
    }
  `),
  run({ root }, t) {
    const queue = root ? [root] : [];
    const done: [TreeNode, Tone][] = [];
    const view = (n?: TreeNode) => [tree("tree", root, { tones: [...done, ...queue.map((q) => [q, "compare"] as [TreeNode, Tone]), [n, "active"]] }), arr("queue", queue.map((q) => q.val), { indexLabels: false })];
    t.step("init", "Queue the root.", view());
    while (queue.length) {
      const n = queue.shift()!;
      t.step("pop", `Visit ${n.val}.`, () => view(n));
      [n.left, n.right] = [n.right, n.left];
      done.push([n, "success"]);
      t.step("swap", `Swap its children.`, () => view(n));
      if (n.left) queue.push(n.left);
      if (n.right) queue.push(n.right);
      t.step("push", "Queue the children.", () => view(n));
    }
    t.step("ret", "Done.", view());
    return treeToArray(root);
  },
});

export default defineProblem<Input>({
  description: "Invert a binary tree (mirror it left to right) and return its root.",
  input: { default: "root = [4,2,7,1,3,6,9]", parse: (a) => ({ root: buildTree(a.nullableInts("root")) }) },
  examples: [
    { input: "root = [4,2,7,1,3,6,9]", output: [4, 7, 2, 9, 6, 3, 1] },
    { input: "root = [2,1,3]", output: [2, 3, 1] },
    { input: "root = []", output: [] },
  ],
  solutions: [recursive, bfs],
});

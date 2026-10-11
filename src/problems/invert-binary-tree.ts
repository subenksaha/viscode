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
  approach: [
    {
      title: "Swap at the root",
      detail: "Exchange the left and right children.",
      at: "swap",
    },
    {
      title: "Invert the new left subtree",
      detail: "Recurse into each subtree to mirror it too.",
      at: "left",
    },
    {
      title: "Invert the new right subtree",
      detail: "After both returns the whole subtree is mirrored.",
      at: "right",
    },
    {
      title: "Done",
      detail: "Each node is swapped once: O(n).",
      at: "ret",
    },
  ],
  code: code(`
    function invertTree(root: TreeNode | null): TreeNode | null {
      if (root === null) return null; //@base
      const oldLeft = root.left; //@swap
      root.left = root.right;
      root.right = oldLeft;
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
  approach: [
    {
      title: "Queue the root",
      detail: "Any visiting order works, since each node's swap is independent.",
      at: "init",
    },
    {
      title: "Visit a node",
      detail: "Take the next node.",
      at: "pop",
    },
    {
      title: "Swap its children",
      detail: "Mirror this node.",
      at: "swap",
    },
    {
      title: "Queue the children",
      detail: "They are swapped when their turn comes.",
      at: "push",
    },
  ],
  code: code(`
    function invertTree(root: TreeNode | null): TreeNode | null {
      const queue: TreeNode[] = []; //@init
      if (root !== null) queue.push(root);
      while (queue.length > 0) { //@loop
        const node = queue.shift()!; //@pop
        const oldLeft = node.left; //@swap
        node.left = node.right;
        node.right = oldLeft;
        if (node.left !== null) queue.push(node.left);
        if (node.right !== null) queue.push(node.right); //@push
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

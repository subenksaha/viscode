import { tree, vars } from "@/core/panels";
import { buildTree, type TreeNode } from "@/core/structures";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  root: TreeNode | null;
}

const depth = (n: TreeNode | null): number => (n ? 1 + Math.max(depth(n.left), depth(n.right)) : 0);

const naive = defineSolution<Input>({
  id: "depth-per-node",
  name: "Depth at Every Node",
  time: "O(n²)",
  space: "O(h)",
  idea: "The longest path through a node is depth(left) + depth(right). Compute that from scratch for every node and keep the max.",
  approach: [
    {
      title: "Longest path through a node",
      detail: "It goes down the deepest left branch and the deepest right branch: depth(left) + depth(right) edges.",
      at: "through",
    },
    {
      title: "Try every node",
      detail: "The longest path might not pass through the root, so check each node.",
      at: "through",
      nth: 3,
    },
    {
      title: "Max of all",
      detail: "Depths are recomputed from scratch at every node: O(n²) on skewed trees.",
      at: "max",
    },
  ],
  code: code(`
    function depth(node: TreeNode | null): number {
      if (node === null) return 0;
      return 1 + Math.max(depth(node.left), depth(node.right));
    }
    function diameterOfBinaryTree(root: TreeNode | null): number {
      if (root === null) return 0; //@base
      const throughRoot = depth(root.left) + depth(root.right); //@through
      const bestInLeft = diameterOfBinaryTree(root.left);
      const bestInRight = diameterOfBinaryTree(root.right);
      return Math.max(throughRoot, bestInLeft, bestInRight); //@max
    }
  `),
  run({ root }, t) {
    let best = 0;
    const seen: [TreeNode, Tone][] = [];
    const go = (n: TreeNode | null): number => {
      if (!n) return 0;
      const l = depth(n.left),
        r = depth(n.right);
      best = Math.max(best, l + r);
      seen.push([n, "success"]);
      t.step("through", `Through ${n.val}: ${l} + ${r} = ${l + r}. best = ${best}.`, () => [
        vars({ "depth(left)": l, "depth(right)": r, best }),
        tree("tree", root, { tones: [...seen, [n, "active"]] }),
      ]);
      return Math.max(l + r, go(n.left), go(n.right));
    };
    if (!root) t.step("base", "Empty tree: 0.");
    const res = go(root);
    t.step("max", `Return ${res}.`, () => [vars({ best: res }), tree("tree", root, { tones: seen })]);
    return res;
  },
});

const onePass = defineSolution<Input>({
  id: "one-pass-dfs",
  name: "One-pass DFS",
  time: "O(n)",
  space: "O(h)",
  idea: "A post-order DFS returns each subtree's depth. On the way up, update the best diameter with left + right at that node.",
  approach: [
    {
      title: "Post-order",
      detail: "Compute both children's depths first.",
      at: "children",
    },
    {
      title: "Update the diameter here",
      detail: "leftDepth + rightDepth is the longest path that bends at this node.",
      at: "best",
      nth: -1,
    },
    {
      title: "Return the depth",
      detail: "Pass up 1 + max(left, right). The parent can extend only one branch.",
      at: "ret",
      nth: -1,
    },
    {
      title: "Answer",
      detail: "best is the diameter. Each node is visited once.",
      at: "answer",
    },
  ],
  code: code(`
    function diameterOfBinaryTree(root: TreeNode | null): number {
      let best = 0; //@init
      // Returns the depth of node's subtree and updates best along the way.
      function depth(node: TreeNode | null): number {
        if (node === null) return 0; //@base
        const leftDepth = depth(node.left); //@children
        const rightDepth = depth(node.right);
        best = Math.max(best, leftDepth + rightDepth); //@best
        return 1 + Math.max(leftDepth, rightDepth); //@ret
      }
      depth(root);
      return best; //@answer
    }
  `),
  run({ root }, t) {
    let best = 0;
    let bestAt: TreeNode | null = null;
    const done: [TreeNode, Tone][] = [];
    const notes: [TreeNode, string][] = [];
    const view = (n: TreeNode | null) => [vars({ best }), tree("tree (d = depth)", root, { tones: [...done, [bestAt, "compare"], [n, "active"]], notes })];
    t.step("init", "best = 0.", view(null));
    const dfs = (n: TreeNode | null): number => {
      if (!n) return 0;
      t.step("children", `At ${n.val}: get both subtree depths.`, () => view(n));
      const l = dfs(n.left),
        r = dfs(n.right);
      if (l + r > best) {
        best = l + r;
        bestAt = n;
        t.step("best", `Path through ${n.val} has ${l} + ${r} = ${best} edges. New best.`, () => view(n));
      } else t.step("best", `Path through ${n.val} has ${l + r} edges. best stays ${best}.`, () => view(n));
      const d = 1 + Math.max(l, r);
      done.push([n, "success"]);
      notes.push([n, `d=${d}`]);
      t.step("ret", `Depth of ${n.val} = ${d}.`, () => view(n));
      return d;
    };
    if (!root) t.step("base", "Empty tree.", view(null));
    dfs(root);
    t.step("answer", `Return ${best}.`, view(null));
    return best;
  },
});

export default defineProblem<Input>({
  description: "Return the diameter of a binary tree: the number of edges on the longest path between any two nodes. The path may or may not pass through the root.",
  input: { default: "root = [1,2,3,4,5,null,null,6,null,null,7]", parse: (a) => ({ root: buildTree(a.nullableInts("root")) }) },
  examples: [
    { input: "root = [1,2,3,4,5]", output: 3 },
    { input: "root = [1,2]", output: 1 },
  ],
  solutions: [naive, onePass],
});

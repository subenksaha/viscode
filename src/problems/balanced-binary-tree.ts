import { tree, vars } from "@/core/panels";
import { buildTree, type TreeNode } from "@/core/structures";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  root: TreeNode | null;
}

const height = (n: TreeNode | null): number => (n ? 1 + Math.max(height(n.left), height(n.right)) : 0);

const topDown = defineSolution<Input>({
  id: "top-down",
  name: "Top-down Height Check",
  time: "O(n²)",
  space: "O(h)",
  idea: "At every node, compute the height of both subtrees from scratch and compare them, then recurse into both children.",
  approach: [
    {
      title: "Measure both subtrees",
      detail: "At each node, compute the left and right heights from scratch.",
      at: "heights",
    },
    {
      title: "Compare",
      detail: "A difference greater than 1 means the tree is not balanced.",
      at: "bad",
    },
    {
      title: "Recurse",
      detail: "Otherwise check both children the same way. Heights are recomputed at every level, so this is O(n²) on skewed trees.",
    },
  ],
  code: code(`
    function height(node: TreeNode | null): number {
      if (node === null) return 0;
      return 1 + Math.max(height(node.left), height(node.right));
    }
    function isBalanced(root: TreeNode | null): boolean {
      if (root === null) return true; //@base
      const leftHeight = height(root.left); //@heights
      const rightHeight = height(root.right);
      if (Math.abs(leftHeight - rightHeight) > 1) return false; //@bad
      return isBalanced(root.left) && isBalanced(root.right); //@recurse
    }
  `),
  run({ root }, t) {
    const ok: [TreeNode, Tone][] = [];
    const view = (n: TreeNode | null, tone: Tone = "active", l?: number, r?: number) => [
      vars({ "height(left)": l, "height(right)": r }),
      tree("tree", root, { tones: [...ok, [n, tone], [n?.left, l !== undefined ? "compare" : "muted"], [n?.right, r !== undefined ? "compare" : "muted"]] }),
    ];
    const go = (n: TreeNode | null): boolean => {
      if (!n) return true;
      const l = height(n.left),
        r = height(n.right);
      t.step("heights", `At ${n.val}: left height ${l}, right height ${r}.`, () => view(n, "active", l, r));
      if (Math.abs(l - r) > 1) {
        t.step("bad", `|${l} − ${r}| > 1. Not balanced.`, () => view(n, "danger", l, r));
        return false;
      }
      ok.push([n, "success"]);
      t.step("recurse", `${n.val} is balanced locally. Check both children.`, () => view(n, "success"));
      return go(n.left) && go(n.right);
    };
    if (!root) {
      t.step("base", "Empty tree is balanced.");
      return true;
    }
    const res = go(root);
    if (res) t.step("recurse", "Every node passed. Return true.", () => view(null));
    return res;
  },
});

const bottomUp = defineSolution<Input>({
  id: "bottom-up",
  name: "Bottom-up DFS (−1 Sentinel)",
  time: "O(n)",
  space: "O(h)",
  idea: "Return each subtree's height from a post-order DFS, or −1 as soon as any subtree is unbalanced. Each node is visited once.",
  approach: [
    {
      title: "Post-order",
      detail: "Get the children's results before deciding about a node.",
      at: "left",
    },
    {
      title: "Return the height when balanced",
      detail: "1 + max(left, right).",
      at: "ret",
    },
    {
      title: "−1 propagates failure",
      detail: "If either child returned −1, or the heights differ by more than 1, return −1 at once.",
      at: "bad",
    },
    {
      title: "Answer",
      detail: "The root's result is −1 exactly when some subtree is unbalanced. Each node is visited once.",
      at: "answer",
    },
  ],
  code: code(`
    function isBalanced(root: TreeNode | null): boolean {
      // Returns the height of the subtree, or -1 if it is not balanced.
      function checkHeight(node: TreeNode | null): number {
        if (node === null) return 0; //@base
        const leftHeight = checkHeight(node.left); //@left
        const rightHeight = checkHeight(node.right); //@right
        const childIsUnbalanced = leftHeight === -1 || rightHeight === -1;
        if (childIsUnbalanced || Math.abs(leftHeight - rightHeight) > 1) return -1; //@bad
        return 1 + Math.max(leftHeight, rightHeight); //@ret
      }
      return checkHeight(root) !== -1; //@answer
    }
  `),
  run({ root }, t) {
    const done: [TreeNode, Tone][] = [];
    const notes: [TreeNode, string][] = [];
    const view = (n: TreeNode | null, tone: Tone = "active") => [tree("tree", root, { tones: [...done, [n, tone]], notes })];
    const check = (n: TreeNode | null): number => {
      if (!n) return 0;
      t.step("left", `At ${n.val}: check the left subtree.`, () => view(n));
      const l = check(n.left);
      if (l === -1) return -1;
      t.step("right", `At ${n.val}: left height ${l}. Check the right subtree.`, () => view(n));
      const r = check(n.right);
      if (r === -1 || Math.abs(l - r) > 1) {
        done.push([n, "danger"]);
        t.step("bad", r === -1 ? "Right subtree is unbalanced. Return −1." : `|${l} − ${r}| > 1 at ${n.val}. Return −1.`, () => view(n, "danger"));
        return -1;
      }
      const h = 1 + Math.max(l, r);
      done.push([n, "success"]);
      notes.push([n, `h=${h}`]);
      t.step("ret", `Height at ${n.val} = 1 + max(${l}, ${r}) = ${h}.`, () => view(n, "success"));
      return h;
    };
    if (!root) t.step("base", "Empty tree has height 0.");
    const res = check(root) !== -1;
    t.step("answer", res ? "No −1 reached the root. Balanced." : "Got −1. Not balanced.", () => view(null));
    return res;
  },
});

export default defineProblem<Input>({
  description: "Given a binary tree, determine if it is height-balanced: for every node, the heights of its two subtrees differ by at most one.",
  input: { default: "root = [1,2,2,3,3,null,null,4,4]", parse: (a) => ({ root: buildTree(a.nullableInts("root")) }) },
  examples: [
    { input: "root = [3,9,20,null,null,15,7]", output: true },
    { input: "root = [1,2,2,3,3,null,null,4,4]", output: false },
    { input: "root = []", output: true },
  ],
  solutions: [topDown, bottomUp],
});

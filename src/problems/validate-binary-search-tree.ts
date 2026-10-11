import { arr, tree, vars } from "@/core/panels";
import { buildTree, type TreeNode } from "@/core/structures";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  root: TreeNode | null;
}

const fmtBound = (b: number) => (b === Infinity ? "∞" : b === -Infinity ? "-∞" : b);

const bounds = defineSolution<Input>({
  id: "bounds",
  name: "Recursive Bounds",
  time: "O(n)",
  space: "O(h)",
  idea: "Each node must lie strictly inside an open interval (low, high). Going left caps high at the node's value; going right raises low.",
  approach: [
    {
      title: "The root may be anything",
      detail: "Start with the bounds (−∞, ∞).",
      at: "check",
    },
    {
      title: "Pass tighter bounds down",
      detail: "The left child must be less than the node and the right child greater. Every ancestor's limit is inherited too, so checking only the parent is not enough.",
      at: "recurse",
    },
    {
      title: "Fail on a violation",
      detail: "Any value at or outside its (low, high) bounds breaks the BST rule.",
      at: "ret",
    },
  ],
  code: code(`
    function isValidBST(root: TreeNode | null): boolean {
      // Every value in this subtree must be strictly between low and high.
      function isValid(node: TreeNode | null, low: number, high: number): boolean {
        if (node === null) return true; //@null
        if (node.val <= low || node.val >= high) return false; //@check
        // Left subtree must stay below node.val; right subtree must stay above it.
        return isValid(node.left, low, node.val) && isValid(node.right, node.val, high); //@recurse
      }
      return isValid(root, -Infinity, Infinity); //@ret
    }
  `),
  run({ root }, t) {
    const good: [TreeNode, Tone][] = [];
    const go = (n: TreeNode | null, lo: number, hi: number): boolean => {
      if (!n) return true;
      const bad = n.val <= lo || n.val >= hi;
      t.step("check", `${n.val} must be in (${fmtBound(lo)}, ${fmtBound(hi)}): ${bad ? "it is not" : "ok"}.`, () => [vars({ low: fmtBound(lo), high: fmtBound(hi) }), tree("tree", root, { tones: [...good, [n, bad ? "danger" : "active"]] })]);
      if (bad) return false;
      good.push([n, "success"]);
      t.step("recurse", `Left gets (${fmtBound(lo)}, ${n.val}); right gets (${n.val}, ${fmtBound(hi)}).`, () => [tree("tree", root, { tones: [...good, [n, "active"]] })]);
      return go(n.left, lo, n.val) && go(n.right, n.val, hi);
    };
    const res = go(root, -Infinity, Infinity);
    t.step("ret", res ? "Every node respects its bounds." : "A node broke its bounds.", [tree("tree", root, { tones: good })]);
    return res;
  },
});

const inorder = defineSolution<Input>({
  id: "inorder",
  name: "In-order Traversal Must Increase",
  time: "O(n)",
  space: "O(h)",
  idea: "An in-order walk of a BST visits values in strictly increasing order. Walk iteratively with a stack and compare each value with the previous one.",
  approach: [
    {
      title: "In-order is sorted for a BST",
      detail: "Visiting left subtree, node, right subtree yields strictly increasing values exactly when the tree is a valid BST.",
      at: "init",
    },
    {
      title: "Push the left spine",
      detail: "Go as far left as possible, stacking nodes.",
      at: "left",
    },
    {
      title: "Visit and compare",
      detail: "The popped node must be greater than the previous value visited.",
      at: "visit",
    },
    {
      title: "Move right",
      detail: "Then process the right subtree the same way. O(n) time, O(h) space.",
      at: "right",
    },
  ],
  code: code(`
    function isValidBST(root: TreeNode | null): boolean {
      // An in-order walk of a valid BST visits values in strictly increasing order.
      const stack: TreeNode[] = [];
      let node = root; //@init
      let previous = -Infinity;
      while (node !== null || stack.length > 0) { //@loop
        while (node !== null) { //@left
          stack.push(node);
          node = node.left;
        }
        node = stack.pop()!; //@visit
        if (node.val <= previous) return false; //@cmp
        previous = node.val;
        node = node.right; //@right
      }
      return true; //@ret
    }
  `),
  run({ root }, t) {
    const stack: TreeNode[] = [];
    let n = root,
      prev = -Infinity;
    const order: number[] = [];
    const done: [TreeNode, Tone][] = [];
    const view = (cur?: TreeNode | null, bad = false) => [
      vars({ previous: fmtBound(prev) }),
      tree("tree", root, { tones: [...done, ...stack.map((s) => [s, "compare"] as [TreeNode, Tone]), [cur, bad ? "danger" : "active"]] }),
      arr("in-order so far", order),
      arr("stack", stack.map((s) => s.val), { indexLabels: false }),
    ];
    t.step("init", "Start at the root.", view());
    while (n || stack.length) {
      while (n) {
        stack.push(n);
        n = n.left;
      }
      t.step("left", "Go as far left as possible, pushing nodes.", view());
      n = stack.pop()!;
      const cur = n;
      t.step("visit", `Visit ${cur.val}.`, () => view(cur));
      if (cur.val <= prev) {
        t.step("cmp", `${cur.val} ≤ previous ${prev}: not increasing. Return false.`, () => view(cur, true));
        return false;
      }
      prev = cur.val;
      order.push(cur.val);
      done.push([cur, "success"]);
      n = cur.right;
      t.step("right", "Continue with the right subtree.", () => view(cur));
    }
    t.step("ret", "Strictly increasing. Return true.", view());
    return true;
  },
});

export default defineProblem<Input>({
  description: "Return true if the binary tree is a valid binary search tree: every left subtree holds smaller values, every right subtree holds larger values, recursively.",
  input: { default: "root = [5,3,7,2,4,6,8]", parse: (a) => ({ root: buildTree(a.nullableInts("root")) }) },
  examples: [
    { input: "root = [2,1,3]", output: true },
    { input: "root = [5,1,4,null,null,3,6]", output: false },
    { input: "root = [5,4,6,null,null,3,7]", output: false },
  ],
  solutions: [bounds, inorder],
});

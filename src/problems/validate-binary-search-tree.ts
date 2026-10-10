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
  idea: "Each node must lie strictly inside an open interval (lo, hi). Going left caps hi at the node's value; going right raises lo.",
  code: code(`
    function isValidBST(root: TreeNode | null): boolean {
      function ok(n: TreeNode | null, lo: number, hi: number): boolean {
        if (!n) return true; //@null
        if (n.val <= lo || n.val >= hi) return false; //@check
        return ok(n.left, lo, n.val) && ok(n.right, n.val, hi); //@recurse
      }
      return ok(root, -Infinity, Infinity); //@ret
    }
  `),
  run({ root }, t) {
    const good: [TreeNode, Tone][] = [];
    const go = (n: TreeNode | null, lo: number, hi: number): boolean => {
      if (!n) return true;
      const bad = n.val <= lo || n.val >= hi;
      t.step("check", `${n.val} must be in (${fmtBound(lo)}, ${fmtBound(hi)}): ${bad ? "it is not" : "ok"}.`, () => [vars({ lo: fmtBound(lo), hi: fmtBound(hi) }), tree("tree", root, { tones: [...good, [n, bad ? "danger" : "active"]] })]);
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
  code: code(`
    function isValidBST(root: TreeNode | null): boolean {
      const stack: TreeNode[] = [];
      let n = root, prev = -Infinity; //@init
      while (n || stack.length) { //@loop
        while (n) { stack.push(n); n = n.left; } //@left
        n = stack.pop()!; //@visit
        if (n.val <= prev) return false; //@cmp
        prev = n.val;
        n = n.right; //@right
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
      vars({ prev: fmtBound(prev) }),
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

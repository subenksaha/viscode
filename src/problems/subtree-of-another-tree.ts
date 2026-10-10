import { text, tree } from "@/core/panels";
import { buildTree, type TreeNode } from "@/core/structures";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  root: TreeNode | null;
  subRoot: TreeNode | null;
}

const sameTree = (a: TreeNode | null, b: TreeNode | null): boolean =>
  !a && !b ? true : !a || !b || a.val !== b.val ? false : sameTree(a.left, b.left) && sameTree(a.right, b.right);

const collect = (n: TreeNode | null, out: TreeNode[] = []) => {
  if (n) {
    out.push(n);
    collect(n.left, out);
    collect(n.right, out);
  }
  return out;
};

const recursive = defineSolution<Input>({
  id: "same-tree-at-every-node",
  name: "Same-tree Check at Every Node",
  time: "O(m·n)",
  space: "O(h)",
  idea: "Walk root's tree. At every node, run Same Tree against subRoot.",
  code: code(`
    function isSubtree(root: TreeNode | null, subRoot: TreeNode | null): boolean {
      const same = (a: TreeNode | null, b: TreeNode | null): boolean =>
        !a && !b ? true : !a || !b || a.val !== b.val ? false : same(a.left, b.left) && same(a.right, b.right);
      if (!root) return false; //@empty
      if (same(root, subRoot)) return true; //@check
      return isSubtree(root.left, subRoot) || isSubtree(root.right, subRoot); //@recurse
    }
  `),
  run({ root, subRoot }, t) {
    const tried: [TreeNode, Tone][] = [];
    const go = (n: TreeNode | null): boolean => {
      if (!n) return false;
      const ok = sameTree(n, subRoot);
      const region = collect(n).map((x) => [x, ok ? "success" : "compare"] as [TreeNode, Tone]);
      t.step("check", ok ? `The subtree at ${n.val} matches subRoot.` : `The subtree at ${n.val} does not match.`, () => [tree("root", root, { tones: [...tried, ...region, [n, ok ? "success" : "active"]] }), tree("subRoot", subRoot)]);
      if (ok) return true;
      tried.push([n, "muted"]);
      t.step("recurse", "Try the left and right children.", () => [tree("root", root, { tones: tried }), tree("subRoot", subRoot)]);
      return go(n.left) || go(n.right);
    };
    if (!root) t.step("empty", "root is empty.");
    const res = go(root);
    t.step("recurse", res ? "Found it. Return true." : "No match anywhere. Return false.", [tree("subRoot", subRoot)]);
    return res;
  },
});

const serialize = defineSolution<Input>({
  id: "serialize-search",
  name: "Serialize + Substring Search",
  time: "O(m + n)",
  space: "O(m + n)",
  idea: "Serialize both trees in pre-order with null markers and a separator before every value. subRoot is a subtree exactly when its string occurs inside root's string. (Use KMP for guaranteed linear time.)",
  code: code(`
    function isSubtree(root: TreeNode | null, subRoot: TreeNode | null): boolean {
      const ser = (n: TreeNode | null): string =>
        n ? "^" + n.val + ser(n.left) + ser(n.right) : "#"; //@ser
      const a = ser(root), b = ser(subRoot); //@both
      return a.includes(b); //@search
    }
  `),
  run({ root, subRoot }, t) {
    const ser = (n: TreeNode | null): string => (n ? "^" + n.val + ser(n.left) + ser(n.right) : "#");
    const a = ser(root),
      b = ser(subRoot);
    t.step("ser", "Serialize in pre-order. '^' marks the start of each value and '#' marks a null child.", [tree("root", root), tree("subRoot", subRoot)]);
    t.step("both", "Both strings.", [text("root", a), text("subRoot", b)]);
    const at = a.indexOf(b);
    t.step("search", at >= 0 ? `Found at position ${at}.` : "Not a substring.", [text("root", at >= 0 ? `${a.slice(0, at)}[${b}]${a.slice(at + b.length)}` : a), text("subRoot", b)]);
    return at >= 0;
  },
});

export default defineProblem<Input>({
  description: "Return true if some node of root has a subtree identical (in structure and values) to subRoot.",
  input: {
    default: "root = [3,4,5,1,2], subRoot = [4,1,2]",
    parse: (a) => ({ root: buildTree(a.nullableInts("root")), subRoot: buildTree(a.nullableInts("subRoot")) }),
  },
  examples: [
    { input: "root = [3,4,5,1,2], subRoot = [4,1,2]", output: true },
    { input: "root = [3,4,5,1,2,null,null,null,null,0], subRoot = [4,1,2]", output: false },
    { input: "root = [12], subRoot = [2]", output: false },
  ],
  solutions: [recursive, serialize],
});

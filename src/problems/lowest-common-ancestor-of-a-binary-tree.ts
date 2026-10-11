import { map, tree } from "@/core/panels";
import { buildTree, findNode, type TreeNode } from "@/core/structures";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  root: TreeNode | null;
  p: TreeNode;
  q: TreeNode;
}

const parents = defineSolution<Input>({
  id: "parent-pointers",
  name: "Parent Pointers + Ancestor Set",
  time: "O(n)",
  space: "O(n)",
  idea: "Record every node's parent with a traversal. Collect all ancestors of p, then walk up from q until you hit one of them.",
  code: code(`
    function lowestCommonAncestor(root: TreeNode, p: TreeNode, q: TreeNode): TreeNode {
      // Record each node's parent until we have found both p and q.
      const parent = new Map<TreeNode, TreeNode | null>();
      parent.set(root, null);
      const stack = [root];
      while (!parent.has(p) || !parent.has(q)) { //@map
        const node = stack.pop()!;
        for (const child of [node.left, node.right]) {
          if (child !== null) {
            parent.set(child, node);
            stack.push(child);
          }
        }
      }
      // Collect every ancestor of p (including p itself).
      const ancestorsOfP = new Set<TreeNode>();
      let node: TreeNode | null = p;
      while (node !== null) { //@up-p
        ancestorsOfP.add(node);
        node = parent.get(node)!;
      }
      // Walk up from q until we hit one of them.
      let ancestor = q;
      while (!ancestorsOfP.has(ancestor)) ancestor = parent.get(ancestor)!; //@up-q
      return ancestor; //@ret
    }
  `),
  run({ root, p, q }, t) {
    const parent = new Map<TreeNode, TreeNode | null>([[root!, null]]);
    const stack = [root!];
    const ancestors = new Set<TreeNode>();
    const view = (cur?: TreeNode | null, tone: Tone = "active") => [
      tree("tree", root, { tones: [...[...ancestors].map((a) => [a, "visited"] as [TreeNode, Tone]), [p, "compare"], [q, "compare"], [cur, tone]], pointers: { p, q } }),
      map("parent", [...parent].map(([c, par]) => [c.val, par?.val ?? "–"])),
    ];
    while (!parent.has(p) || !parent.has(q)) {
      const n = stack.pop()!;
      for (const c of [n.left, n.right])
        if (c) {
          parent.set(c, n);
          stack.push(c);
        }
      t.step("map", `Record the parent of ${n.val}'s children.`, () => view(n));
    }
    for (let a: TreeNode | null = p; a; a = parent.get(a)!) {
      ancestors.add(a);
      t.step("up-p", `${a.val} is an ancestor of p (or p itself).`, () => view(a));
    }
    let b = q;
    while (!ancestors.has(b)) {
      t.step("up-q", `${b.val} is not an ancestor of p. Go up.`, () => view(b, "danger"));
      b = parent.get(b)!;
    }
    t.step("ret", `${b.val} is the first shared ancestor.`, () => view(b, "success"));
    return b.val;
  },
});

const recursive = defineSolution<Input>({
  id: "recursive",
  name: "Recursive DFS",
  time: "O(n)",
  space: "O(h)",
  idea: "Return p or q if found in a subtree, else null. If both subtrees return something, this node is the split point: the LCA. Otherwise pass up whichever side found something.",
  code: code(`
    function lowestCommonAncestor(root: TreeNode | null, p: TreeNode, q: TreeNode): TreeNode | null {
      if (root === null || root === p || root === q) return root; //@base
      const fromLeft = lowestCommonAncestor(root.left, p, q); //@left
      const fromRight = lowestCommonAncestor(root.right, p, q); //@right
      // p and q were found on different sides, so root is where they meet.
      if (fromLeft !== null && fromRight !== null) return root; //@split
      return fromLeft !== null ? fromLeft : fromRight; //@pass
    }
  `),
  run({ root, p, q }, t) {
    const notes: [TreeNode, string][] = [];
    const done: [TreeNode, Tone][] = [];
    const view = (n?: TreeNode | null, tone: Tone = "active") => [tree("tree", root, { tones: [...done, [p, "compare"], [q, "compare"], [n, tone]], pointers: { p, q }, notes })];
    const go = (n: TreeNode | null): TreeNode | null => {
      if (!n) return null;
      if (n === p || n === q) {
        notes.push([n, "found"]);
        t.step("base", `${n.val} is ${n === p ? "p" : "q"}. Return it.`, () => view(n, "success"));
        return n;
      }
      t.step("left", `At ${n.val}: search the left subtree.`, () => view(n));
      const l = go(n.left);
      t.step("right", `At ${n.val}: left returned ${l?.val ?? "null"}. Search the right subtree.`, () => view(n));
      const r = go(n.right);
      if (l && r) {
        notes.push([n, "LCA"]);
        t.step("split", `p and q are on different sides of ${n.val}. It is the LCA.`, () => view(n, "success"));
        return n;
      }
      const res = l ?? r;
      done.push([n, "muted"]);
      if (res) notes.push([n, `↑${res.val}`]);
      t.step("pass", `Pass up ${res?.val ?? "null"} from ${n.val}.`, () => view(n));
      return res;
    };
    const res = go(root)!;
    return res.val;
  },
});

export default defineProblem<Input>({
  description: "Given a binary tree and two of its nodes p and q, return their lowest common ancestor: the deepest node that has both p and q as descendants (a node counts as its own descendant).",
  input: {
    default: "root = [3,5,1,6,2,0,8,null,null,7,4], p = 7, q = 0",
    parse: (a) => {
      const root = buildTree(a.nullableInts("root"));
      const p = findNode(root, a.int("p")),
        q = findNode(root, a.int("q"));
      if (!p || !q) throw new Error("p and q must be values in the tree");
      return { root, p, q };
    },
  },
  examples: [
    { input: "root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 1", output: 3 },
    { input: "root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 4", output: 5 },
    { input: "root = [1,2], p = 1, q = 2", output: 1 },
  ],
  solutions: [parents, recursive],
});

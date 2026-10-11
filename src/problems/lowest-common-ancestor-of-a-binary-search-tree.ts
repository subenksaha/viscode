import { arr, tree, vars } from "@/core/panels";
import { buildTree, findNode, type TreeNode } from "@/core/structures";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  root: TreeNode | null;
  p: TreeNode;
  q: TreeNode;
}

const markPQ = (p: TreeNode, q: TreeNode): [TreeNode, Tone][] => [
  [p, "compare"],
  [q, "compare"],
];

const recursive = defineSolution<Input>({
  id: "recursive",
  name: "Recursive BST Descent",
  time: "O(h)",
  space: "O(h)",
  idea: "If p and q are both smaller than the node, the answer is in the left subtree; both larger, the right. Otherwise they split here, so this node is the LCA.",
  approach: [
    {
      title: "Both smaller: go left",
      detail: "If p and q are both less than the node, they are both in the left subtree, and so is their LCA.",
      at: "left",
    },
    {
      title: "Both larger: go right",
      detail: "The mirror case moves to the right subtree.",
    },
    {
      title: "Split point is the LCA",
      detail: "When p and q fall on different sides, or one of them is the node itself, this node is the deepest common ancestor.",
      at: "found",
    },
  ],
  code: code(`
    function lowestCommonAncestor(root: TreeNode, p: TreeNode, q: TreeNode): TreeNode {
      if (p.val < root.val && q.val < root.val) return lowestCommonAncestor(root.left!, p, q); //@left
      if (p.val > root.val && q.val > root.val) return lowestCommonAncestor(root.right!, p, q); //@right
      return root; //@found
    }
  `),
  run({ root, p, q }, t) {
    const path: [TreeNode, Tone][] = [];
    const view = (n: TreeNode, hit = false) => [vars({ p: p.val, q: q.val }), tree("tree", root, { tones: [...markPQ(p, q), ...path, [n, hit ? "success" : "active"]] })];
    const go = (n: TreeNode): TreeNode => {
      if (p.val < n.val && q.val < n.val) {
        t.step("left", `${p.val} and ${q.val} are both < ${n.val}: go left.`, () => view(n));
        path.push([n, "visited"]);
        return go(n.left!);
      }
      if (p.val > n.val && q.val > n.val) {
        t.step("right", `${p.val} and ${q.val} are both > ${n.val}: go right.`, () => view(n));
        path.push([n, "visited"]);
        return go(n.right!);
      }
      t.step("found", `${p.val} and ${q.val} split at ${n.val} (or one of them is ${n.val}). LCA = ${n.val}.`, () => view(n, true));
      return n;
    };
    return go(root!).val;
  },
});

const iterative = defineSolution<Input>({
  id: "iterative",
  name: "Iterative BST Descent",
  time: "O(h)",
  space: "O(1)",
  idea: "The same decision as the recursive version, written as a loop, so it needs no stack space.",
  approach: [
    {
      title: "Start at the root",
      detail: "The BST ordering tells us where p and q are without searching.",
      at: "init",
    },
    {
      title: "Descend while both are on one side",
      detail: "Move left or right while p and q agree on a direction.",
      at: "left",
    },
    {
      title: "Return at the split",
      detail: "O(h) time with O(1) space.",
      at: "found",
    },
  ],
  code: code(`
    function lowestCommonAncestor(root: TreeNode, p: TreeNode, q: TreeNode): TreeNode {
      let node = root; //@init
      while (true) {
        if (p.val < node.val && q.val < node.val) {
          node = node.left!; // both are on the left //@left
        } else if (p.val > node.val && q.val > node.val) {
          node = node.right!; // both are on the right //@right
        } else {
          return node; // they split here (or one of them is node) //@found
        }
      }
    }
  `),
  run({ root, p, q }, t) {
    let n = root!;
    const path: [TreeNode, Tone][] = [];
    const view = (hit = false) => [vars({ p: p.val, q: q.val }), tree("tree", root, { tones: [...markPQ(p, q), ...path, [n, hit ? "success" : "active"]], pointers: { node: n } })];
    t.step("init", "Start at the root.", view());
    for (;;) {
      if (p.val < n.val && q.val < n.val) {
        path.push([n, "visited"]);
        n = n.left!;
        t.step("left", "Both are smaller: move left.", view());
      } else if (p.val > n.val && q.val > n.val) {
        path.push([n, "visited"]);
        n = n.right!;
        t.step("right", "Both are larger: move right.", view());
      } else {
        t.step("found", `Split point: LCA = ${n.val}.`, view(true));
        return n.val;
      }
    }
  },
});

const generic = defineSolution<Input>({
  id: "root-paths",
  name: "Compare Root-to-Node Paths",
  time: "O(h)",
  space: "O(h)",
  idea: "Record the search path from the root to p and to q. The LCA is the last node the two paths share. This works for any tree if you swap the BST search for a DFS.",
  approach: [
    {
      title: "Record both search paths",
      detail: "Walk from the root to p and to q, storing every node visited.",
      at: "paths",
    },
    {
      title: "Walk the common prefix",
      detail: "The paths match from the root until they diverge.",
      at: "common",
    },
    {
      title: "Last shared node",
      detail: "The deepest node on both paths is the LCA. Replace the BST search with a DFS and this works for any tree.",
      at: "ret",
    },
  ],
  code: code(`
    function lowestCommonAncestor(root: TreeNode, p: TreeNode, q: TreeNode): TreeNode {
      // Nodes visited going from the root down to target.
      function pathTo(target: TreeNode): TreeNode[] {
        const path: TreeNode[] = [];
        let node: TreeNode | null = root;
        while (node !== null) {
          path.push(node);
          if (node === target) break;
          node = target.val < node.val ? node.left : node.right;
        }
        return path;
      }
      const pathP = pathTo(p); //@paths
      const pathQ = pathTo(q);
      let i = 0;
      while (i < pathP.length && i < pathQ.length && pathP[i] === pathQ[i]) i++; //@common
      return pathP[i - 1]; // last node the two paths share //@ret
    }
  `),
  run({ root, p, q }, t) {
    const path = (target: TreeNode) => {
      const out: TreeNode[] = [];
      for (let n: TreeNode | null = root; n; n = target.val < n.val ? n.left : n.right) {
        out.push(n);
        if (n === target) break;
      }
      return out;
    };
    const a = path(p),
      b = path(q);
    t.step("paths", "Record the root-to-node path for p and for q.", [tree("tree", root, { tones: [...a.map((x) => [x, "compare"] as [TreeNode, Tone]), ...b.map((x) => [x, "visited"] as [TreeNode, Tone])] }), arr("path to p", a.map((x) => x.val)), arr("path to q", b.map((x) => x.val))]);
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) {
      i++;
      const k = i;
      t.step("common", `Both paths share ${a[k - 1].val}.`, () => [arr("path to p", a.map((x) => x.val), { window: [0, k - 1] }), arr("path to q", b.map((x) => x.val), { window: [0, k - 1] })]);
    }
    t.step("ret", `The last shared node is ${a[i - 1].val}.`, [tree("tree", root, { tones: [[a[i - 1], "success"]] })]);
    return a[i - 1].val;
  },
});

export default defineProblem<Input>({
  description: "Given a binary search tree and two of its nodes p and q, return their lowest common ancestor: the deepest node that has both as descendants (a node counts as its own descendant).",
  input: {
    default: "root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 4",
    parse: (a) => {
      const root = buildTree(a.nullableInts("root"));
      const p = findNode(root, a.int("p")),
        q = findNode(root, a.int("q"));
      if (!p || !q) throw new Error("p and q must be values in the tree");
      return { root, p, q };
    },
  },
  examples: [
    { input: "root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 8", output: 6 },
    { input: "root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 4", output: 2 },
    { input: "root = [2,1], p = 2, q = 1", output: 2 },
  ],
  solutions: [recursive, iterative, generic],
});

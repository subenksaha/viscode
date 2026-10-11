import { arr, tree, vars } from "@/core/panels";
import { buildTree, type TreeNode } from "@/core/structures";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  root: TreeNode | null;
}

const recursive = defineSolution<Input>({
  id: "recursive-dfs",
  name: "Recursive DFS",
  time: "O(n)",
  space: "O(h)",
  idea: "The depth of a tree is 1 + the deeper of its two subtrees. An empty tree has depth 0.",
  code: code(`
    function maxDepth(root: TreeNode | null): number {
      if (root === null) return 0; //@base
      const leftDepth = maxDepth(root.left); //@left
      const rightDepth = maxDepth(root.right); //@right
      return 1 + Math.max(leftDepth, rightDepth); //@ret
    }
  `),
  run({ root }, t) {
    const done: [TreeNode, Tone][] = [];
    const depthOf = new Map<TreeNode, number>();
    const view = (n: TreeNode | null) => [
      tree("tree", root, { tones: [...done, [n, "active"]], notes: [...depthOf].map(([node, d]) => [node, `d=${d}`]) }),
    ];
    const go = (n: TreeNode | null): number => {
      if (!n) return 0;
      t.step("left", `At ${n.val}: get the depth of the left subtree.`, () => view(n));
      const l = n.left ? go(n.left) : (t.step("base", "Left child is null: depth 0.", () => view(n)), 0);
      t.step("right", `At ${n.val}: left depth ${l}. Now the right subtree.`, () => view(n));
      const r = n.right ? go(n.right) : (t.step("base", "Right child is null: depth 0.", () => view(n)), 0);
      const d = 1 + Math.max(l, r);
      depthOf.set(n, d);
      done.push([n, "success"]);
      t.step("ret", `Depth at ${n.val} = 1 + max(${l}, ${r}) = ${d}.`, () => view(n));
      return d;
    };
    if (!root) {
      t.step("base", "Empty tree: 0.");
      return 0;
    }
    return go(root);
  },
});

const bfs = defineSolution<Input>({
  id: "bfs",
  name: "BFS Level Count",
  time: "O(n)",
  space: "O(w)",
  idea: "Process the tree level by level with a queue. The number of levels is the depth.",
  code: code(`
    function maxDepth(root: TreeNode | null): number {
      if (root === null) return 0;
      let level = [root]; //@init
      let depth = 0;
      while (level.length > 0) { //@level
        depth++;
        const nextLevel: TreeNode[] = [];
        for (const node of level) { //@node
          if (node.left !== null) nextLevel.push(node.left);
          if (node.right !== null) nextLevel.push(node.right);
        }
        level = nextLevel;
      }
      return depth; //@ret
    }
  `),
  run({ root }, t) {
    if (!root) {
      t.step("ret", "Empty tree: 0.");
      return 0;
    }
    let queue = [root],
      depth = 0;
    const seen: [TreeNode, Tone][] = [];
    const view = (cur?: TreeNode) => [vars({ depth }), tree("tree", root, { tones: [...seen, ...queue.map((q) => [q, "compare"] as [TreeNode, Tone]), [cur, "active"]] }), arr("queue (this level)", queue.map((q) => q.val), { indexLabels: false })];
    t.step("init", "Start with the root.", view());
    while (queue.length) {
      depth++;
      t.step("level", `Level ${depth} has ${queue.length} node(s).`, view());
      const next: TreeNode[] = [];
      for (const n of queue) {
        if (n.left) next.push(n.left);
        if (n.right) next.push(n.right);
        seen.push([n, "success"]);
        t.step("node", `Visit ${n.val}; queue its children.`, () => view(n));
      }
      queue = next;
    }
    t.step("ret", `Return ${depth}.`, view());
    return depth;
  },
});

const iterativeDfs = defineSolution<Input>({
  id: "iterative-dfs",
  name: "Iterative DFS with Stack",
  time: "O(n)",
  space: "O(h)",
  idea: "Push (node, depth) pairs onto a stack and track the largest depth seen.",
  code: code(`
    function maxDepth(root: TreeNode | null): number {
      const stack: [TreeNode | null, number][] = [[root, 1]]; // [node, its depth]
      let best = 0; //@init
      while (stack.length > 0) { //@loop
        const [node, depth] = stack.pop()!; //@pop
        if (node === null) continue;
        best = Math.max(best, depth); //@best
        stack.push([node.left, depth + 1]); //@push
        stack.push([node.right, depth + 1]);
      }
      return best; //@ret
    }
  `),
  run({ root }, t) {
    const stack: [TreeNode | null, number][] = [[root, 1]];
    let best = 0;
    const done: [TreeNode, Tone][] = [];
    const view = (cur?: TreeNode | null) => [vars({ best }), tree("tree", root, { tones: [...done, [cur, "active"]] }), arr("stack (node:depth)", stack.filter(([n]) => n).map(([n, d]) => `${n!.val}:${d}`), { indexLabels: false })];
    t.step("init", "Push (root, 1).", view());
    while (stack.length) {
      const [n, d] = stack.pop()!;
      if (!n) continue;
      t.step("pop", `Pop ${n.val} at depth ${d}.`, () => view(n));
      best = Math.max(best, d);
      done.push([n, "success"]);
      t.step("best", `best = ${best}.`, () => view(n));
      stack.push([n.left, d + 1], [n.right, d + 1]);
      t.step("push", "Push its children at depth + 1.", () => view(n));
    }
    t.step("ret", `Return ${best}.`, view());
    return best;
  },
});

export default defineProblem<Input>({
  description: "Return the maximum depth of a binary tree: the number of nodes on the longest root-to-leaf path.",
  input: { default: "root = [3,9,20,null,null,15,7]", parse: (a) => ({ root: buildTree(a.nullableInts("root")) }) },
  examples: [
    { input: "root = [3,9,20,null,null,15,7]", output: 3 },
    { input: "root = [1,null,2]", output: 2 },
    { input: "root = []", output: 0 },
  ],
  solutions: [recursive, bfs, iterativeDfs],
});

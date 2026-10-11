import { arr, tree, vars } from "@/core/panels";
import { buildTree, type TreeNode } from "@/core/structures";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  root: TreeNode | null;
}

const bfs = defineSolution<Input>({
  id: "bfs",
  name: "BFS: Last Node per Level",
  time: "O(n)",
  space: "O(w)",
  idea: "Traverse level by level. The last node of each level is the one you see from the right.",
  code: code(`
    function rightSideView(root: TreeNode | null): number[] {
      const result: number[] = [];
      let level: TreeNode[] = root !== null ? [root] : []; //@init
      while (level.length > 0) { //@level
        const rightmost = level[level.length - 1];
        result.push(rightmost.val); //@take
        const nextLevel: TreeNode[] = [];
        for (const node of level) { //@next
          if (node.left !== null) nextLevel.push(node.left);
          if (node.right !== null) nextLevel.push(node.right);
        }
        level = nextLevel;
      }
      return result; //@ret
    }
  `),
  run({ root }, t) {
    const res: number[] = [];
    let level = root ? [root] : [];
    const seen: [TreeNode, Tone][] = [];
    const view = () => [
      tree("tree", root, { tones: [...seen, ...level.map((n) => [n, "compare"] as [TreeNode, Tone]), [level.at(-1), "active"]] }),
      arr("level", level.map((n) => n.val), { indexLabels: false }),
      arr("view", res, { indexLabels: false }),
    ];
    t.step("init", root ? "First level is the root." : "Empty tree.", view());
    while (level.length) {
      t.step("level", `Level with ${level.length} node(s).`, view());
      const last = level.at(-1)!;
      res.push(last.val);
      seen.push([last, "success"]);
      t.step("take", `Rightmost is ${last.val}.`, view());
      level = level.flatMap((n) => [n.left, n.right].filter((c): c is TreeNode => !!c));
      t.step("next", "Move to the next level.", view());
    }
    t.step("ret", `Return [${res}].`, view());
    return res;
  },
});

const dfs = defineSolution<Input>({
  id: "dfs-right-first",
  name: "DFS, Right Child First",
  time: "O(n)",
  space: "O(h)",
  idea: "Visit right before left and track depth. The first node you meet at each depth is the visible one.",
  code: code(`
    function rightSideView(root: TreeNode | null): number[] {
      const result: number[] = [];
      function visit(node: TreeNode | null, depth: number) {
        if (node === null) return;
        // The first node we reach at a new depth is the rightmost one.
        if (depth === result.length) result.push(node.val); //@first
        visit(node.right, depth + 1); //@right
        visit(node.left, depth + 1); //@left
      }
      visit(root, 0);
      return result; //@ret
    }
  `),
  run({ root }, t) {
    const res: number[] = [];
    const seen: [TreeNode, Tone][] = [];
    const view = (n: TreeNode | null, depth?: number) => [vars({ depth }), tree("tree", root, { tones: [...seen, [n, "active"]] }), arr("view", res)];
    const go = (n: TreeNode | null, depth: number) => {
      if (!n) return;
      if (depth === res.length) {
        res.push(n.val);
        seen.push([n, "success"]);
        t.step("first", `First node at depth ${depth}: ${n.val} is visible.`, () => view(n, depth));
      } else {
        seen.push([n, "muted"]);
        t.step("first", `Depth ${depth} already has a visible node. ${n.val} is hidden.`, () => view(n, depth));
      }
      if (n.right) t.step("right", `Go right from ${n.val}.`, () => view(n, depth));
      go(n.right, depth + 1);
      if (n.left) t.step("left", `Go left from ${n.val}.`, () => view(n, depth));
      go(n.left, depth + 1);
    };
    go(root, 0);
    t.step("ret", `Return [${res}].`, view(null));
    return res;
  },
});

export default defineProblem<Input>({
  description: "Imagine standing on the right side of a binary tree. Return the values of the nodes you can see, from top to bottom.",
  input: { default: "root = [1,2,3,null,5,null,4,7]", parse: (a) => ({ root: buildTree(a.nullableInts("root")) }) },
  examples: [
    { input: "root = [1,2,3,null,5,null,4]", output: [1, 3, 4] },
    { input: "root = [1,2,3,4,null,null,null,5]", output: [1, 3, 4, 5] },
    { input: "root = [1,null,3]", output: [1, 3] },
    { input: "root = []", output: [] },
  ],
  solutions: [dfs, bfs],
});

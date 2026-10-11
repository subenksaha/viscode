import { arr, text, tree } from "@/core/panels";
import { buildTree, type TreeNode } from "@/core/structures";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  root: TreeNode | null;
}

const show = (levels: number[][]) => levels.map((l) => `[${l}]`).join(" ");

const bfs = defineSolution<Input>({
  id: "bfs",
  name: "BFS Queue",
  time: "O(n)",
  space: "O(w)",
  idea: "Process the queue one level at a time: its size at the start of a round is exactly the number of nodes on that level.",
  code: code(`
    function levelOrder(root: TreeNode | null): number[][] {
      const result: number[][] = [];
      const queue: TreeNode[] = []; //@init
      if (root !== null) queue.push(root);
      while (queue.length > 0) { //@level
        const levelValues: number[] = [];
        const levelSize = queue.length;
        for (let count = 0; count < levelSize; count++) { //@node
          const node = queue.shift()!;
          levelValues.push(node.val);
          if (node.left !== null) queue.push(node.left);
          if (node.right !== null) queue.push(node.right);
        }
        result.push(levelValues); //@push
      }
      return result; //@ret
    }
  `),
  run({ root }, t) {
    const res: number[][] = [],
      queue = root ? [root] : [];
    const done: [TreeNode, Tone][] = [];
    const view = (cur?: TreeNode, level: number[] = []) => [
      tree("tree", root, { tones: [...done, ...queue.map((q) => [q, "compare"] as [TreeNode, Tone]), [cur, "active"]] }),
      arr("queue", queue.map((q) => q.val), { indexLabels: false }),
      arr("current level", level),
      text("result", show(res)),
    ];
    t.step("init", "Queue the root.", view());
    while (queue.length) {
      const level: number[] = [];
      t.step("level", `New level with ${queue.length} node(s).`, view(undefined, level));
      for (let k = queue.length; k > 0; k--) {
        const n = queue.shift()!;
        level.push(n.val);
        if (n.left) queue.push(n.left);
        if (n.right) queue.push(n.right);
        done.push([n, "success"]);
        t.step("node", `Take ${n.val}; queue its children.`, () => view(n, level));
      }
      res.push(level);
      t.step("push", `Level done: [${level}].`, view());
    }
    t.step("ret", `Return ${show(res)}.`, view());
    return res;
  },
});

const dfs = defineSolution<Input>({
  id: "dfs",
  name: "DFS with Depth",
  time: "O(n)",
  space: "O(h)",
  idea: "Pre-order DFS carrying the depth. Append each value to result[depth], creating that level the first time it is reached.",
  code: code(`
    function levelOrder(root: TreeNode | null): number[][] {
      const result: number[][] = [];
      function visit(node: TreeNode | null, depth: number) {
        if (node === null) return;
        if (result.length === depth) result.push([]); //@new
        result[depth].push(node.val); //@add
        visit(node.left, depth + 1);
        visit(node.right, depth + 1);
      }
      visit(root, 0);
      return result; //@ret
    }
  `),
  run({ root }, t) {
    const res: number[][] = [];
    const done: [TreeNode, Tone][] = [];
    const view = (n?: TreeNode) => [tree("tree", root, { tones: [...done, [n, "active"]] }), text("result", show(res))];
    const go = (n: TreeNode | null, d: number) => {
      if (!n) return;
      if (res.length === d) {
        res.push([]);
        t.step("new", `First node at depth ${d}: start a new level.`, () => view(n));
      }
      res[d].push(n.val);
      done.push([n, "success"]);
      t.step("add", `Add ${n.val} to level ${d}.`, () => view(n));
      go(n.left, d + 1);
      go(n.right, d + 1);
    };
    go(root, 0);
    t.step("ret", `Return ${show(res)}.`, view());
    return res;
  },
});

export default defineProblem<Input>({
  description: "Return the level-order traversal of a binary tree's values: left to right, one level at a time.",
  input: { default: "root = [3,9,20,null,null,15,7]", parse: (a) => ({ root: buildTree(a.nullableInts("root")) }) },
  examples: [
    { input: "root = [3,9,20,null,null,15,7]", output: [[3], [9, 20], [15, 7]] },
    { input: "root = [1]", output: [[1]] },
    { input: "root = []", output: [] },
  ],
  solutions: [bfs, dfs],
});

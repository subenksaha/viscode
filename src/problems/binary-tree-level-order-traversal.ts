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
      const res: number[][] = [], queue = root ? [root] : []; //@init
      while (queue.length) { //@level
        const level: number[] = [];
        for (let k = queue.length; k > 0; k--) { //@node
          const n = queue.shift()!;
          level.push(n.val);
          if (n.left) queue.push(n.left);
          if (n.right) queue.push(n.right);
        }
        res.push(level); //@push
      }
      return res; //@ret
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
  idea: "Pre-order DFS carrying the depth. Append each value to res[depth], creating that level the first time it is reached.",
  code: code(`
    function levelOrder(root: TreeNode | null): number[][] {
      const res: number[][] = [];
      function dfs(n: TreeNode | null, d: number) {
        if (!n) return;
        if (res.length === d) res.push([]); //@new
        res[d].push(n.val); //@add
        dfs(n.left, d + 1);
        dfs(n.right, d + 1);
      }
      dfs(root, 0);
      return res; //@ret
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

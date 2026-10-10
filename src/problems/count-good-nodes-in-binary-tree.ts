import { arr, tree, vars } from "@/core/panels";
import { buildTree, type TreeNode } from "@/core/structures";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  root: TreeNode | null;
}

const dfs = defineSolution<Input>({
  id: "dfs",
  name: "DFS Carrying the Path Max",
  time: "O(n)",
  space: "O(h)",
  idea: "Pass the largest value seen on the path from the root down. A node is good if it is ≥ that max; its children get max(max, node.val).",
  code: code(`
    function goodNodes(root: TreeNode | null): number {
      function dfs(n: TreeNode | null, max: number): number {
        if (!n) return 0; //@base
        const good = n.val >= max ? 1 : 0; //@check
        max = Math.max(max, n.val);
        return good + dfs(n.left, max) + dfs(n.right, max); //@recurse
      }
      return dfs(root, -Infinity); //@ret
    }
  `),
  run({ root }, t) {
    let count = 0;
    const marks: [TreeNode, Tone][] = [];
    const notes: [TreeNode, string][] = [];
    const view = (n: TreeNode | null, max: number) => [vars({ "path max": max === -Infinity ? "−∞" : max, good: count }), tree("tree", root, { tones: [...marks, [n, "active"]], notes })];
    const go = (n: TreeNode | null, max: number): number => {
      if (!n) return 0;
      const good = n.val >= max;
      if (good) count++;
      marks.push([n, good ? "success" : "muted"]);
      notes.push([n, `max ${max === -Infinity ? "−∞" : max}`]);
      t.step("check", good ? `${n.val} ≥ path max: good.` : `${n.val} < path max ${max}: not good.`, () => view(n, max));
      const m = Math.max(max, n.val);
      return (good ? 1 : 0) + go(n.left, m) + go(n.right, m);
    };
    if (!root) t.step("base", "Empty tree.", view(null, -Infinity));
    const res = go(root, -Infinity);
    t.step("ret", `${res} good nodes.`, view(null, -Infinity));
    return res;
  },
});

const bfs = defineSolution<Input>({
  id: "bfs",
  name: "BFS with (node, path max) Pairs",
  time: "O(n)",
  space: "O(w)",
  idea: "Same rule, iteratively: the queue holds each node together with the max on the path to it.",
  code: code(`
    function goodNodes(root: TreeNode | null): number {
      if (!root) return 0;
      const queue: [TreeNode, number][] = [[root, -Infinity]]; //@init
      let good = 0;
      while (queue.length) {
        const [n, max] = queue.shift()!; //@pop
        if (n.val >= max) good++; //@check
        const m = Math.max(max, n.val);
        if (n.left) queue.push([n.left, m]);
        if (n.right) queue.push([n.right, m]); //@push
      }
      return good; //@ret
    }
  `),
  run({ root }, t) {
    if (!root) {
      t.step("ret", "Empty tree.");
      return 0;
    }
    const queue: [TreeNode, number][] = [[root, -Infinity]];
    const marks: [TreeNode, Tone][] = [];
    let good = 0;
    const fmtM = (m: number) => (m === -Infinity ? "−∞" : String(m));
    const view = (n?: TreeNode) => [
      vars({ good }),
      tree("tree", root, { tones: [...marks, [n, "active"]] }),
      arr("queue (node, max)", queue.map(([q, m]) => `${q.val}, ${fmtM(m)}`), { indexLabels: false }),
    ];
    t.step("init", "Queue the root with max = −∞.", view());
    while (queue.length) {
      const [n, max] = queue.shift()!;
      t.step("pop", `Visit ${n.val} (path max ${fmtM(max)}).`, view(n));
      const ok = n.val >= max;
      if (ok) good++;
      marks.push([n, ok ? "success" : "muted"]);
      t.step("check", ok ? `${n.val} is good.` : `${n.val} is not good.`, view(n));
      const m = Math.max(max, n.val);
      if (n.left) queue.push([n.left, m]);
      if (n.right) queue.push([n.right, m]);
      if (n.left || n.right) t.step("push", `Queue children with max ${m}.`, view(n));
    }
    t.step("ret", `${good} good nodes.`, view());
    return good;
  },
});

export default defineProblem<Input>({
  description: "A node X in a binary tree is good if no node on the path from the root to X has a value greater than X. Return the number of good nodes.",
  input: { default: "root = [3,1,4,3,null,1,5]", parse: (a) => ({ root: buildTree(a.nullableInts("root")) }) },
  examples: [
    { input: "root = [3,1,4,3,null,1,5]", output: 4 },
    { input: "root = [3,3,null,4,2]", output: 3 },
    { input: "root = [1]", output: 1 },
  ],
  solutions: [dfs, bfs],
});

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
  approach: [
    {
      title: "Carry the path maximum",
      detail: "A node is good if it is ≥ the largest value from the root down to it.",
      at: "check",
    },
    {
      title: "Pass the new max down",
      detail: "Children get max(pathMax, node.val).",
      at: "check",
      nth: 3,
    },
    {
      title: "Sum",
      detail: "Total good nodes over the whole tree. O(n).",
      at: "ret",
    },
  ],
  code: code(`
    function goodNodes(root: TreeNode | null): number {
      // Counts good nodes below node; pathMax is the largest value from the root to here.
      function countGood(node: TreeNode | null, pathMax: number): number {
        if (node === null) return 0; //@base
        const isGood = node.val >= pathMax ? 1 : 0; //@check
        const newPathMax = Math.max(pathMax, node.val);
        return isGood + countGood(node.left, newPathMax) + countGood(node.right, newPathMax); //@recurse
      }
      return countGood(root, -Infinity); //@ret
    }
  `),
  run({ root }, t) {
    let count = 0;
    const marks: [TreeNode, Tone][] = [];
    const notes: [TreeNode, string][] = [];
    const view = (n: TreeNode | null, max: number) => [vars({ pathMax: max === -Infinity ? "−∞" : max, good: count }), tree("tree", root, { tones: [...marks, [n, "active"]], notes })];
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
  approach: [
    {
      title: "Pairs of node and max",
      detail: "The queue stores each node with the max on its path.",
      at: "init",
    },
    {
      title: "Check",
      detail: "Good if node.val ≥ pathMax.",
      at: "check",
    },
    {
      title: "Children inherit the updated max",
      detail: "max(pathMax, node.val).",
      at: "push",
    },
    {
      title: "Total",
      detail: "Same answer, iterative.",
      at: "ret",
    },
  ],
  code: code(`
    function goodNodes(root: TreeNode | null): number {
      if (root === null) return 0;
      const queue: [TreeNode, number][] = [[root, -Infinity]]; // [node, path max above it] //@init
      let good = 0;
      while (queue.length > 0) {
        const [node, pathMax] = queue.shift()!; //@pop
        if (node.val >= pathMax) good++; //@check
        const newPathMax = Math.max(pathMax, node.val);
        if (node.left !== null) queue.push([node.left, newPathMax]);
        if (node.right !== null) queue.push([node.right, newPathMax]); //@push
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

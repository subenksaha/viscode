import { tree, vars } from "@/core/panels";
import { buildTree, type TreeNode } from "@/core/structures";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  root: TreeNode | null;
}

const bruteForce = defineSolution<Input>({
  id: "brute-force",
  name: "Brute Force: Every Node as the Peak",
  time: "O(n²)",
  space: "O(h)",
  idea: "For every node, the best path peaking there is node + best downward path on the left + on the right (dropping negative sides). Downward paths are recomputed from scratch for each node.",
  code: code(`
    function maxPathSum(root: TreeNode | null): number {
      // Best sum of a path that starts at node and goes straight down.
      function bestDownwardPath(node: TreeNode | null): number {
        if (node === null) return 0;
        const bestChildPath = Math.max(bestDownwardPath(node.left), bestDownwardPath(node.right));
        return node.val + Math.max(0, bestChildPath);
      }

      let best = -Infinity;
      function visit(node: TreeNode | null) {
        if (node === null) return;
        const leftGain = Math.max(0, bestDownwardPath(node.left));
        const rightGain = Math.max(0, bestDownwardPath(node.right));
        const peak = node.val + leftGain + rightGain; //@peak
        best = Math.max(best, peak); //@best
        visit(node.left);
        visit(node.right);
      }
      visit(root);
      return best; //@ret
    }
  `),
  run({ root }, t) {
    const down = (n: TreeNode | null): number => (n ? n.val + Math.max(0, down(n.left), down(n.right)) : 0);
    let best = -Infinity;
    const visit = (n: TreeNode | null) => {
      if (!n) return;
      const l = Math.max(0, down(n.left)),
        r = Math.max(0, down(n.right));
      const peak = n.val + l + r;
      t.step("peak", `Peak at ${n.val}: ${n.val} + left ${l} + right ${r} = ${peak}.`, () => [vars({ best: best === -Infinity ? "-∞" : best, peak }), tree("tree", root, { tones: [[n, "active"], [n.left, l > 0 ? "compare" : "muted"], [n.right, r > 0 ? "compare" : "muted"]] })]);
      best = Math.max(best, peak);
      t.step("best", `best = ${best}.`, () => [vars({ best }), tree("tree", root, { tones: [[n, "active"]] })]);
      visit(n.left);
      visit(n.right);
    };
    visit(root);
    t.step("ret", `Return ${best}.`, [vars({ best })]);
    return best;
  },
});

const dfs = defineSolution<Input>({
  id: "dfs-gain",
  name: "Single DFS (Max Gain)",
  time: "O(n)",
  space: "O(h)",
  idea: "One post-order DFS returns each node's best downward gain. At each node, update the answer with node + left gain + right gain, but return only node + the better of the two (a path cannot fork when passed upward).",
  code: code(`
    function maxPathSum(root: TreeNode | null): number {
      let best = -Infinity;
      // Best sum of a path that starts at node and goes straight down.
      function gain(node: TreeNode | null): number {
        if (node === null) return 0; //@base
        const leftGain = Math.max(0, gain(node.left)); //@left
        const rightGain = Math.max(0, gain(node.right)); //@right
        const pathThroughNode = node.val + leftGain + rightGain;
        best = Math.max(best, pathThroughNode); //@best
        return node.val + Math.max(leftGain, rightGain); //@ret
      }
      gain(root);
      return best; //@done
    }
  `),
  run({ root }, t) {
    let best = -Infinity;
    const done: [TreeNode, Tone][] = [];
    const notes: [TreeNode, string][] = [];
    const view = (n: TreeNode | null, extra: Record<string, unknown> = {}) => [vars({ best: best === -Infinity ? "-∞" : best, ...extra }), tree("tree", root, { tones: [...done, [n, "active"]], notes })];
    const gain = (n: TreeNode | null): number => {
      if (!n) return 0;
      t.step("left", `At ${n.val}: best gain from the left?`, () => view(n));
      const left = Math.max(0, gain(n.left));
      t.step("right", `Left gain ${left}. Now the right.`, () => view(n, { left }));
      const right = Math.max(0, gain(n.right));
      best = Math.max(best, n.val + left + right);
      t.step("best", `Path through ${n.val}: ${n.val} + ${left} + ${right} = ${n.val + left + right}. best = ${best}.`, () => view(n, { left, right }));
      const g = n.val + Math.max(left, right);
      done.push([n, "success"]);
      notes.push([n, `g=${g}`]);
      t.step("ret", `Return gain ${g} to the parent.`, () => view(n, { left, right }));
      return g;
    };
    gain(root);
    t.step("done", `Return ${best}.`, () => view(null));
    return best;
  },
});

export default defineProblem<Input>({
  description: "A path is any sequence of adjacent nodes, each used at most once, that need not pass through the root. Return the maximum sum of any non-empty path.",
  input: { default: "root = [-10,9,20,null,null,15,7]", parse: (a) => ({ root: buildTree(a.nullableInts("root")) }) },
  examples: [
    { input: "root = [1,2,3]", output: 6 },
    { input: "root = [-10,9,20,null,null,15,7]", output: 42 },
    { input: "root = [-3]", output: -3 },
  ],
  solutions: [bruteForce, dfs],
});

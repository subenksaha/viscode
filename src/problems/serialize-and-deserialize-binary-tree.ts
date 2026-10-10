import { arr, text, tree } from "@/core/panels";
import { buildTree, treeToArray, TreeNode } from "@/core/structures";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  root: TreeNode | null;
}

const preorder = defineSolution<Input>({
  id: "preorder",
  name: "Pre-order DFS with Null Markers",
  time: "O(n)",
  space: "O(n)",
  idea: "Write values in pre-order and write '#' for every null child. The decoder reads tokens in the same order and rebuilds the tree recursively.",
  code: code(`
    function serialize(root: TreeNode | null): string {
      const out: string[] = [];
      const go = (n: TreeNode | null) => {
        if (!n) { out.push("#"); return; } //@null
        out.push(String(n.val)); //@write
        go(n.left); go(n.right);
      };
      go(root);
      return out.join(",");
    }
    function deserialize(data: string): TreeNode | null {
      const tokens = data.split(",");
      let i = 0;
      const build = (): TreeNode | null => {
        const tok = tokens[i++]; //@read
        if (tok === "#") return null;
        const n = new TreeNode(Number(tok)); //@node
        n.left = build(); n.right = build();
        return n;
      };
      return build(); //@ret
    }
  `),
  run({ root }, t) {
    const out: string[] = [];
    const done: [TreeNode, Tone][] = [];
    const go = (n: TreeNode | null) => {
      if (!n) {
        out.push("#");
        t.step("null", "null → '#'.", () => [tree("tree", root, { tones: done }), arr("tokens", out, { indexLabels: false })]);
        return;
      }
      out.push(String(n.val));
      done.push([n, "success"]);
      t.step("write", `Write ${n.val}.`, () => [tree("tree", root, { tones: [...done, [n, "active"]] }), arr("tokens", out, { indexLabels: false, tones: { [out.length - 1]: "active" } })]);
      go(n.left);
      go(n.right);
    };
    go(root);
    const data = out.join(",");
    const tokens = data.split(",");
    let i = 0;
    let rebuilt: TreeNode | null = null;
    const build = (attach: (n: TreeNode | null) => void): TreeNode | null => {
      const tok = tokens[i++];
      const at = i - 1;
      t.step("read", `Read token '${tok}'.`, () => [text("serialized", data), arr("tokens", tokens, { indexLabels: false, tones: { [at]: "active" } }), tree("rebuilt", rebuilt)]);
      if (tok === "#") return null;
      const n = new TreeNode(Number(tok));
      attach(n);
      if (!rebuilt) rebuilt = n;
      t.step("node", `Create ${tok}, then build its left and right subtrees.`, () => [arr("tokens", tokens, { indexLabels: false, tones: { [at]: "success" } }), tree("rebuilt", rebuilt, { tones: [[n, "active"]] })]);
      n.left = build((c) => (n.left = c));
      n.right = build((c) => (n.right = c));
      return n;
    };
    const res = build(() => {});
    t.step("ret", "Tree rebuilt.", [tree("rebuilt", res)]);
    return treeToArray(res);
  },
});

const levelOrder = defineSolution<Input>({
  id: "level-order",
  name: "Level-order BFS",
  time: "O(n)",
  space: "O(n)",
  idea: "Write nodes in BFS order with '#' for null children (the LeetCode format). Decode by handing out children to queued parents two tokens at a time.",
  code: code(`
    function serialize(root: TreeNode | null): string {
      const out: string[] = [], queue = [root];
      while (queue.length) { //@ser
        const n = queue.shift()!;
        out.push(n ? String(n.val) : "#");
        if (n) queue.push(n.left, n.right);
      }
      return out.join(",");
    }
    function deserialize(data: string): TreeNode | null {
      const tokens = data.split(",");
      if (tokens[0] === "#") return null;
      const root = new TreeNode(Number(tokens[0])), queue = [root];
      let i = 1;
      while (queue.length) { //@parent
        const n = queue.shift()!;
        const l = tokens[i++], r = tokens[i++];
        if (l !== "#") queue.push((n.left = new TreeNode(Number(l)))); //@children
        if (r !== "#") queue.push((n.right = new TreeNode(Number(r))));
      }
      return root; //@ret
    }
  `),
  run({ root }, t) {
    const out: string[] = [],
      queue: (TreeNode | null)[] = [root];
    const done: [TreeNode, Tone][] = [];
    while (queue.length) {
      const n = queue.shift()!;
      out.push(n ? String(n.val) : "#");
      if (n) {
        queue.push(n.left, n.right);
        done.push([n, "success"]);
      }
      t.step("ser", n ? `Write ${n.val}; queue its children.` : "Write '#'.", () => [tree("tree", root, { tones: [...done, [n, "active"]] }), arr("tokens", out, { indexLabels: false })]);
    }
    const tokens = out;
    if (tokens[0] === "#") {
      t.step("ret", "Empty tree.");
      return [];
    }
    const res = new TreeNode(Number(tokens[0]));
    const q2 = [res];
    let i = 1;
    while (q2.length) {
      const n = q2.shift()!;
      t.step("parent", `Parent ${n.val} takes the next two tokens.`, () => [arr("tokens", tokens, { indexLabels: false, tones: { [i]: "active", [i + 1]: "active" } }), tree("rebuilt", res, { tones: [[n, "active"]] })]);
      const l = tokens[i++],
        r = tokens[i++];
      if (l !== undefined && l !== "#") q2.push((n.left = new TreeNode(Number(l))));
      if (r !== undefined && r !== "#") q2.push((n.right = new TreeNode(Number(r))));
      t.step("children", `left = ${l ?? "#"}, right = ${r ?? "#"}.`, () => [tree("rebuilt", res, { tones: [[n, "active"], [n.left, "success"], [n.right, "success"]] })]);
    }
    t.step("ret", "Tree rebuilt.", [tree("rebuilt", res)]);
    return treeToArray(res);
  },
});

export default defineProblem<Input>({
  description: "Design an algorithm to serialize a binary tree to a string and deserialize that string back to the original tree.",
  input: { default: "root = [1,2,3,null,null,4,5]", parse: (a) => ({ root: buildTree(a.nullableInts("root")) }) },
  examples: [
    { input: "root = [1,2,3,null,null,4,5]", output: [1, 2, 3, null, null, 4, 5] },
    { input: "root = []", output: [] },
  ],
  solutions: [preorder, levelOrder],
});

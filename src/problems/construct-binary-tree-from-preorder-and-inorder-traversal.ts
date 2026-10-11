import { arr, range, tones, tree } from "@/core/panels";
import { treeToArray, TreeNode } from "@/core/structures";
import { code, defineProblem, defineSolution, type Tracer } from "@/core/trace";

interface Input {
  preorder: number[];
  inorder: number[];
}

function build(preorder: number[], inorder: number[], t: Tracer, find: (v: number, lo: number, hi: number) => number) {
  let root: TreeNode | null = null;
  let p = 0;
  const go = (lo: number, hi: number): TreeNode | null => {
    if (lo > hi) {
      t.step("empty", `Empty inorder range [${lo}..${hi}]: null.`, () => view(lo, hi));
      return null;
    }
    const val = preorder[p++];
    const node = new TreeNode(val);
    if (!root) root = node;
    t.step("root", `Next pre-order value ${val} is the root of inorder[${lo}..${hi}].`, () => view(lo, hi, node));
    const mid = find(val, lo, hi);
    t.step("split", `${val} sits at inorder index ${mid}: left part [${lo}..${mid - 1}], right part [${mid + 1}..${hi}].`, () => view(lo, hi, node, mid));
    node.left = go(lo, mid - 1);
    node.right = go(mid + 1, hi);
    return node;
  };
  const view = (lo: number, hi: number, node?: TreeNode, mid?: number) => [
    arr("preorder", preorder, { tones: tones(...range(0, p - 2, "visited"), [node ? p - 1 : null, "active"]) }),
    arr("inorder", inorder, {
      window: lo <= hi ? [lo, hi] : null,
      tones: mid !== undefined ? tones(...range(lo, mid - 1, "compare"), [mid, "active"], ...range(mid + 1, hi, "success")) : {},
    }),
    tree("tree so far", root, { tones: [[node, "active"]] }),
  ];
  const res = go(0, inorder.length - 1);
  t.step("ret", "Every value is placed.", [tree("tree", res)]);
  return treeToArray(res);
}

const hashMap = defineSolution<Input>({
  id: "hash-map",
  name: "Recursion + Index Map",
  time: "O(n)",
  space: "O(n)",
  idea: "The next pre-order value is always the root of the current subtree. Its position in the inorder array splits the remaining values into left and right subtrees. A value → index map makes that lookup O(1).",
  approach: [
    {
      title: "Index the inorder values",
      detail: "A value → index map turns the root lookup into O(1).",
      at: "root",
    },
    {
      title: "Split in constant time",
      detail: "The root's index splits the inorder range into the left part [start, idx−1] and the right part [idx+1, end].",
      at: "split",
    },
    {
      title: "Empty range is null",
      detail: "The recursion stops when a range is empty.",
      at: "empty",
    },
    {
      title: "Build in preorder",
      detail: "Consume preorder left to right, building the left subtree before the right. O(n) total.",
      at: "ret",
    },
  ],
  code: code(`
    function buildTree(preorder: number[], inorder: number[]): TreeNode | null {
      const inorderIndex = new Map<number, number>();
      inorder.forEach((value, index) => inorderIndex.set(value, index));
      let nextPreorder = 0; // preorder[nextPreorder] is the next subtree root
      // Builds the subtree whose values are inorder[start..end].
      function build(start: number, end: number): TreeNode | null {
        if (start > end) return null; //@empty
        const node = new TreeNode(preorder[nextPreorder]); //@root
        nextPreorder++;
        const rootIndex = inorderIndex.get(node.val)!; //@split
        node.left = build(start, rootIndex - 1);
        node.right = build(rootIndex + 1, end);
        return node;
      }
      return build(0, inorder.length - 1); //@ret
    }
  `),
  run({ preorder, inorder }, t) {
    const idx = new Map(inorder.map((v, i) => [v, i]));
    return build(preorder, inorder, t, (v) => idx.get(v)!);
  },
});

const linearSearch = defineSolution<Input>({
  id: "linear-search",
  name: "Recursion + Linear Search",
  time: "O(n²)",
  space: "O(n)",
  idea: "The same recursion, but find the root in the inorder slice by scanning. Simpler, and quadratic on skewed trees.",
  approach: [
    {
      title: "Preorder gives the root",
      detail: "The next unused preorder value is the root of the current subtree.",
      at: "root",
    },
    {
      title: "Scan inorder for it",
      detail: "Everything left of it in inorder is the left subtree and everything right of it is the right subtree. Finding it takes a linear scan.",
      at: "split",
    },
    {
      title: "Empty ranges are null",
      detail: "A range with start > end means there is no subtree.",
      at: "empty",
    },
    {
      title: "Build left, then right",
      detail: "Build left first because preorder lists the whole left subtree before the right. Scanning can make this O(n²).",
      at: "ret",
    },
  ],
  code: code(`
    function buildTree(preorder: number[], inorder: number[]): TreeNode | null {
      let nextPreorder = 0; // preorder[nextPreorder] is the next subtree root
      // Builds the subtree whose values are inorder[start..end].
      function build(start: number, end: number): TreeNode | null {
        if (start > end) return null; //@empty
        const node = new TreeNode(preorder[nextPreorder]); //@root
        nextPreorder++;
        let rootIndex = start;
        while (inorder[rootIndex] !== node.val) rootIndex++; //@split
        node.left = build(start, rootIndex - 1);
        node.right = build(rootIndex + 1, end);
        return node;
      }
      return build(0, inorder.length - 1); //@ret
    }
  `),
  run({ preorder, inorder }, t) {
    return build(preorder, inorder, t, (v, lo) => {
      let mid = lo;
      while (inorder[mid] !== v) mid++;
      return mid;
    });
  },
});

export default defineProblem<Input>({
  description: "Given the preorder and inorder traversals of a binary tree with unique values, rebuild and return the tree.",
  input: {
    default: "preorder = [3,9,20,15,7], inorder = [9,3,15,20,7]",
    parse: (a) => ({ preorder: a.ints("preorder"), inorder: a.ints("inorder") }),
  },
  examples: [
    { input: "preorder = [3,9,20,15,7], inorder = [9,3,15,20,7]", output: [3, 9, 20, null, null, 15, 7] },
    { input: "preorder = [-1], inorder = [-1]", output: [-1] },
  ],
  solutions: [linearSearch, hashMap],
});

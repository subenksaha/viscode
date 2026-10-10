let nextId = 1;

/** Unique id for visualization; stable for a node's lifetime. */
const newId = () => nextId++;

export class TreeNode {
  readonly id = newId();
  constructor(
    public val: number,
    public left: TreeNode | null = null,
    public right: TreeNode | null = null,
  ) {}
}

export class ListNode {
  readonly id = newId();
  constructor(
    public val: number,
    public next: ListNode | null = null,
  ) {}
}

/** Build a tree from LeetCode's level-order encoding, e.g. [3,9,20,null,null,15,7]. */
export function buildTree(values: (number | null)[]): TreeNode | null {
  if (!values.length || values[0] === null) return null;
  const root = new TreeNode(values[0]);
  const queue = [root];
  let i = 1;
  while (queue.length && i < values.length) {
    const node = queue.shift()!;
    const l = values[i++];
    if (l !== null && l !== undefined) queue.push((node.left = new TreeNode(l)));
    const r = values[i++];
    if (r !== null && r !== undefined) queue.push((node.right = new TreeNode(r)));
  }
  return root;
}

/** Level-order encoding with trailing nulls trimmed. */
export function treeToArray(root: TreeNode | null): (number | null)[] {
  const out: (number | null)[] = [];
  const queue: (TreeNode | null)[] = [root];
  while (queue.length) {
    const node = queue.shift()!;
    out.push(node ? node.val : null);
    if (node) queue.push(node.left, node.right);
  }
  while (out.length && out.at(-1) === null) out.pop();
  return out;
}

export function findNode(root: TreeNode | null, val: number): TreeNode | null {
  if (!root) return null;
  if (root.val === val) return root;
  return findNode(root.left, val) ?? findNode(root.right, val);
}

/** Build a list; `pos` >= 0 links the tail back to that index (cycle). */
export function buildList(values: number[], pos = -1): ListNode | null {
  const nodes = values.map((v) => new ListNode(v));
  nodes.forEach((n, i) => (n.next = nodes[i + 1] ?? null));
  if (pos >= 0 && nodes.length) nodes.at(-1)!.next = nodes[pos];
  return nodes[0] ?? null;
}

/** Nodes reachable from head, stopping at a repeat (cycle-safe). */
export function listNodes(head: ListNode | null): ListNode[] {
  const seen = new Set<ListNode>();
  const out: ListNode[] = [];
  for (let n = head; n && !seen.has(n); n = n.next) {
    seen.add(n);
    out.push(n);
  }
  return out;
}

export const listToArray = (head: ListNode | null) => listNodes(head).map((n) => n.val);

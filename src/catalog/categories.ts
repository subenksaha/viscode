// Topic categories. Lists group problems by these; problems tag themselves with them.
export const categories = {
  array: { name: "Array", description: "Indexing, prefix/suffix tricks, Kadane, binary search on arrays." },
  binary: { name: "Binary", description: "Bit manipulation: masks, shifts, XOR tricks." },
  "dynamic-programming": {
    name: "Dynamic Programming",
    description: "Break a problem into overlapping subproblems and reuse their answers.",
  },
  graph: { name: "Graph", description: "BFS, DFS, topological sort, union-find." },
  interval: { name: "Interval", description: "Sorting and sweeping over ranges." },
  "linked-list": { name: "Linked List", description: "Pointer rewiring, fast/slow pointers, dummy heads." },
  math: { name: "Math & Geometry", description: "Digit manipulation, fast exponentiation, cycles in number sequences, points on a plane." },
  matrix: { name: "Matrix", description: "2D grids: in-place transforms, traversal orders, grid search." },
  string: { name: "String", description: "Sliding windows, counting, palindromes." },
  tree: { name: "Tree", description: "Recursion and traversal on binary trees, BSTs and tries." },
  "two-pointers": { name: "Two Pointers", description: "Move two indices toward or along each other." },
  "sliding-window": { name: "Sliding Window", description: "Grow and shrink a contiguous range." },
  "binary-search": { name: "Binary Search", description: "Halve the search space each step." },
  "hash-table": { name: "Hash Table", description: "Constant-time lookups to trade space for time." },
  stack: { name: "Stack", description: "Last-in first-out bookkeeping." },
  heap: { name: "Heap", description: "Priority queues for repeated min/max." },
  backtracking: { name: "Backtracking", description: "Explore choices, undo, and try the next." },
  greedy: { name: "Greedy", description: "Commit to the locally best choice." },
  trie: { name: "Trie", description: "Prefix trees for string lookups." },
  design: { name: "Design", description: "Build a data structure with a given API." },
} as const;

export type CategoryId = keyof typeof categories;

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
}

export const allCategories: Category[] = Object.entries(categories).map(([id, c]) => ({
  id: id as CategoryId,
  ...c,
}));

export const getCategory = (id: string): Category | undefined =>
  id in categories ? { id: id as CategoryId, ...categories[id as CategoryId] } : undefined;

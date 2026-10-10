// Problem registry: metadata for every problem plus a lazy loader for its module
// (solutions + step generators live in src/problems/<slug>.ts).
import type { AnyProblemModule, Difficulty } from "@/core/types";
import type { CategoryId } from "./categories";

export interface ProblemEntry {
  slug: string;
  /** LeetCode problem number. */
  id: number;
  title: string;
  difficulty: Difficulty;
  categories: CategoryId[];
  premium?: boolean;
  load: () => Promise<{ default: AnyProblemModule }>;
}

/** Serializable part of an entry (safe to pass to Client Components). */
export type ProblemMeta = Omit<ProblemEntry, "load">;

type Meta = ProblemMeta;

const entries: [Meta, ProblemEntry["load"]][] = [
  // Array
  [{ slug: "two-sum", id: 1, title: "Two Sum", difficulty: "Easy", categories: ["array", "hash-table"] }, () => import("@/problems/two-sum")],
  [{ slug: "best-time-to-buy-and-sell-stock", id: 121, title: "Best Time to Buy and Sell Stock", difficulty: "Easy", categories: ["array", "dynamic-programming"] }, () => import("@/problems/best-time-to-buy-and-sell-stock")],
  [{ slug: "contains-duplicate", id: 217, title: "Contains Duplicate", difficulty: "Easy", categories: ["array", "hash-table"] }, () => import("@/problems/contains-duplicate")],
  [{ slug: "product-of-array-except-self", id: 238, title: "Product of Array Except Self", difficulty: "Medium", categories: ["array"] }, () => import("@/problems/product-of-array-except-self")],
  [{ slug: "maximum-subarray", id: 53, title: "Maximum Subarray", difficulty: "Medium", categories: ["array", "dynamic-programming"] }, () => import("@/problems/maximum-subarray")],
  [{ slug: "maximum-product-subarray", id: 152, title: "Maximum Product Subarray", difficulty: "Medium", categories: ["array", "dynamic-programming"] }, () => import("@/problems/maximum-product-subarray")],
  [{ slug: "find-minimum-in-rotated-sorted-array", id: 153, title: "Find Minimum in Rotated Sorted Array", difficulty: "Medium", categories: ["array", "binary-search"] }, () => import("@/problems/find-minimum-in-rotated-sorted-array")],
  [{ slug: "search-in-rotated-sorted-array", id: 33, title: "Search in Rotated Sorted Array", difficulty: "Medium", categories: ["array", "binary-search"] }, () => import("@/problems/search-in-rotated-sorted-array")],
  [{ slug: "3sum", id: 15, title: "3Sum", difficulty: "Medium", categories: ["array", "two-pointers"] }, () => import("@/problems/3sum")],
  [{ slug: "container-with-most-water", id: 11, title: "Container With Most Water", difficulty: "Medium", categories: ["array", "two-pointers", "greedy"] }, () => import("@/problems/container-with-most-water")],
  // Binary
  [{ slug: "sum-of-two-integers", id: 371, title: "Sum of Two Integers", difficulty: "Medium", categories: ["binary"] }, () => import("@/problems/sum-of-two-integers")],
  [{ slug: "number-of-1-bits", id: 191, title: "Number of 1 Bits", difficulty: "Easy", categories: ["binary"] }, () => import("@/problems/number-of-1-bits")],
  [{ slug: "counting-bits", id: 338, title: "Counting Bits", difficulty: "Easy", categories: ["binary", "dynamic-programming"] }, () => import("@/problems/counting-bits")],
  [{ slug: "missing-number", id: 268, title: "Missing Number", difficulty: "Easy", categories: ["binary", "array", "hash-table"] }, () => import("@/problems/missing-number")],
  [{ slug: "reverse-bits", id: 190, title: "Reverse Bits", difficulty: "Easy", categories: ["binary"] }, () => import("@/problems/reverse-bits")],
  // Dynamic Programming
  [{ slug: "climbing-stairs", id: 70, title: "Climbing Stairs", difficulty: "Easy", categories: ["dynamic-programming"] }, () => import("@/problems/climbing-stairs")],
  [{ slug: "coin-change", id: 322, title: "Coin Change", difficulty: "Medium", categories: ["dynamic-programming"] }, () => import("@/problems/coin-change")],
  [{ slug: "longest-increasing-subsequence", id: 300, title: "Longest Increasing Subsequence", difficulty: "Medium", categories: ["dynamic-programming", "binary-search"] }, () => import("@/problems/longest-increasing-subsequence")],
  [{ slug: "longest-common-subsequence", id: 1143, title: "Longest Common Subsequence", difficulty: "Medium", categories: ["dynamic-programming", "string"] }, () => import("@/problems/longest-common-subsequence")],
  [{ slug: "word-break", id: 139, title: "Word Break", difficulty: "Medium", categories: ["dynamic-programming", "string"] }, () => import("@/problems/word-break")],
  [{ slug: "combination-sum-iv", id: 377, title: "Combination Sum IV", difficulty: "Medium", categories: ["dynamic-programming"] }, () => import("@/problems/combination-sum-iv")],
  [{ slug: "house-robber", id: 198, title: "House Robber", difficulty: "Medium", categories: ["dynamic-programming"] }, () => import("@/problems/house-robber")],
  [{ slug: "house-robber-ii", id: 213, title: "House Robber II", difficulty: "Medium", categories: ["dynamic-programming"] }, () => import("@/problems/house-robber-ii")],
  [{ slug: "decode-ways", id: 91, title: "Decode Ways", difficulty: "Medium", categories: ["dynamic-programming", "string"] }, () => import("@/problems/decode-ways")],
  [{ slug: "unique-paths", id: 62, title: "Unique Paths", difficulty: "Medium", categories: ["dynamic-programming", "matrix"] }, () => import("@/problems/unique-paths")],
  [{ slug: "jump-game", id: 55, title: "Jump Game", difficulty: "Medium", categories: ["dynamic-programming", "greedy"] }, () => import("@/problems/jump-game")],
  // Graph
  [{ slug: "clone-graph", id: 133, title: "Clone Graph", difficulty: "Medium", categories: ["graph", "hash-table"] }, () => import("@/problems/clone-graph")],
  [{ slug: "course-schedule", id: 207, title: "Course Schedule", difficulty: "Medium", categories: ["graph"] }, () => import("@/problems/course-schedule")],
  [{ slug: "pacific-atlantic-water-flow", id: 417, title: "Pacific Atlantic Water Flow", difficulty: "Medium", categories: ["graph", "matrix"] }, () => import("@/problems/pacific-atlantic-water-flow")],
  [{ slug: "number-of-islands", id: 200, title: "Number of Islands", difficulty: "Medium", categories: ["graph", "matrix"] }, () => import("@/problems/number-of-islands")],
  [{ slug: "longest-consecutive-sequence", id: 128, title: "Longest Consecutive Sequence", difficulty: "Medium", categories: ["graph", "array", "hash-table"] }, () => import("@/problems/longest-consecutive-sequence")],
  [{ slug: "alien-dictionary", id: 269, title: "Alien Dictionary", difficulty: "Hard", categories: ["graph", "string"], premium: true }, () => import("@/problems/alien-dictionary")],
  [{ slug: "graph-valid-tree", id: 261, title: "Graph Valid Tree", difficulty: "Medium", categories: ["graph"], premium: true }, () => import("@/problems/graph-valid-tree")],
  [{ slug: "number-of-connected-components-in-an-undirected-graph", id: 323, title: "Number of Connected Components in an Undirected Graph", difficulty: "Medium", categories: ["graph"], premium: true }, () => import("@/problems/number-of-connected-components-in-an-undirected-graph")],
  // Interval
  [{ slug: "insert-interval", id: 57, title: "Insert Interval", difficulty: "Medium", categories: ["interval", "array"] }, () => import("@/problems/insert-interval")],
  [{ slug: "merge-intervals", id: 56, title: "Merge Intervals", difficulty: "Medium", categories: ["interval", "array"] }, () => import("@/problems/merge-intervals")],
  [{ slug: "non-overlapping-intervals", id: 435, title: "Non-overlapping Intervals", difficulty: "Medium", categories: ["interval", "greedy", "dynamic-programming"] }, () => import("@/problems/non-overlapping-intervals")],
  [{ slug: "meeting-rooms", id: 252, title: "Meeting Rooms", difficulty: "Easy", categories: ["interval"], premium: true }, () => import("@/problems/meeting-rooms")],
  [{ slug: "meeting-rooms-ii", id: 253, title: "Meeting Rooms II", difficulty: "Medium", categories: ["interval", "heap", "greedy"], premium: true }, () => import("@/problems/meeting-rooms-ii")],
  // Linked List
  [{ slug: "reverse-linked-list", id: 206, title: "Reverse Linked List", difficulty: "Easy", categories: ["linked-list"] }, () => import("@/problems/reverse-linked-list")],
  [{ slug: "linked-list-cycle", id: 141, title: "Linked List Cycle", difficulty: "Easy", categories: ["linked-list", "two-pointers", "hash-table"] }, () => import("@/problems/linked-list-cycle")],
  [{ slug: "merge-two-sorted-lists", id: 21, title: "Merge Two Sorted Lists", difficulty: "Easy", categories: ["linked-list"] }, () => import("@/problems/merge-two-sorted-lists")],
  [{ slug: "merge-k-sorted-lists", id: 23, title: "Merge k Sorted Lists", difficulty: "Hard", categories: ["linked-list", "heap"] }, () => import("@/problems/merge-k-sorted-lists")],
  [{ slug: "remove-nth-node-from-end-of-list", id: 19, title: "Remove Nth Node From End of List", difficulty: "Medium", categories: ["linked-list", "two-pointers"] }, () => import("@/problems/remove-nth-node-from-end-of-list")],
  [{ slug: "reorder-list", id: 143, title: "Reorder List", difficulty: "Medium", categories: ["linked-list", "two-pointers"] }, () => import("@/problems/reorder-list")],
  // Matrix
  [{ slug: "set-matrix-zeroes", id: 73, title: "Set Matrix Zeroes", difficulty: "Medium", categories: ["matrix", "hash-table"] }, () => import("@/problems/set-matrix-zeroes")],
  [{ slug: "spiral-matrix", id: 54, title: "Spiral Matrix", difficulty: "Medium", categories: ["matrix"] }, () => import("@/problems/spiral-matrix")],
  [{ slug: "rotate-image", id: 48, title: "Rotate Image", difficulty: "Medium", categories: ["matrix"] }, () => import("@/problems/rotate-image")],
  [{ slug: "word-search", id: 79, title: "Word Search", difficulty: "Medium", categories: ["matrix", "backtracking"] }, () => import("@/problems/word-search")],
  // String
  [{ slug: "longest-substring-without-repeating-characters", id: 3, title: "Longest Substring Without Repeating Characters", difficulty: "Medium", categories: ["string", "sliding-window", "hash-table"] }, () => import("@/problems/longest-substring-without-repeating-characters")],
  [{ slug: "longest-repeating-character-replacement", id: 424, title: "Longest Repeating Character Replacement", difficulty: "Medium", categories: ["string", "sliding-window"] }, () => import("@/problems/longest-repeating-character-replacement")],
  [{ slug: "minimum-window-substring", id: 76, title: "Minimum Window Substring", difficulty: "Hard", categories: ["string", "sliding-window", "hash-table"] }, () => import("@/problems/minimum-window-substring")],
  [{ slug: "valid-anagram", id: 242, title: "Valid Anagram", difficulty: "Easy", categories: ["string", "hash-table"] }, () => import("@/problems/valid-anagram")],
  [{ slug: "group-anagrams", id: 49, title: "Group Anagrams", difficulty: "Medium", categories: ["string", "hash-table"] }, () => import("@/problems/group-anagrams")],
  [{ slug: "valid-parentheses", id: 20, title: "Valid Parentheses", difficulty: "Easy", categories: ["string", "stack"] }, () => import("@/problems/valid-parentheses")],
  [{ slug: "valid-palindrome", id: 125, title: "Valid Palindrome", difficulty: "Easy", categories: ["string", "two-pointers"] }, () => import("@/problems/valid-palindrome")],
  [{ slug: "longest-palindromic-substring", id: 5, title: "Longest Palindromic Substring", difficulty: "Medium", categories: ["string", "dynamic-programming", "two-pointers"] }, () => import("@/problems/longest-palindromic-substring")],
  [{ slug: "palindromic-substrings", id: 647, title: "Palindromic Substrings", difficulty: "Medium", categories: ["string", "dynamic-programming", "two-pointers"] }, () => import("@/problems/palindromic-substrings")],
  [{ slug: "encode-and-decode-strings", id: 271, title: "Encode and Decode Strings", difficulty: "Medium", categories: ["string", "design"], premium: true }, () => import("@/problems/encode-and-decode-strings")],
  // Tree
  [{ slug: "maximum-depth-of-binary-tree", id: 104, title: "Maximum Depth of Binary Tree", difficulty: "Easy", categories: ["tree"] }, () => import("@/problems/maximum-depth-of-binary-tree")],
  [{ slug: "same-tree", id: 100, title: "Same Tree", difficulty: "Easy", categories: ["tree"] }, () => import("@/problems/same-tree")],
  [{ slug: "invert-binary-tree", id: 226, title: "Invert Binary Tree", difficulty: "Easy", categories: ["tree"] }, () => import("@/problems/invert-binary-tree")],
  [{ slug: "binary-tree-maximum-path-sum", id: 124, title: "Binary Tree Maximum Path Sum", difficulty: "Hard", categories: ["tree", "dynamic-programming"] }, () => import("@/problems/binary-tree-maximum-path-sum")],
  [{ slug: "binary-tree-level-order-traversal", id: 102, title: "Binary Tree Level Order Traversal", difficulty: "Medium", categories: ["tree"] }, () => import("@/problems/binary-tree-level-order-traversal")],
  [{ slug: "serialize-and-deserialize-binary-tree", id: 297, title: "Serialize and Deserialize Binary Tree", difficulty: "Hard", categories: ["tree", "design"] }, () => import("@/problems/serialize-and-deserialize-binary-tree")],
  [{ slug: "subtree-of-another-tree", id: 572, title: "Subtree of Another Tree", difficulty: "Easy", categories: ["tree", "string"] }, () => import("@/problems/subtree-of-another-tree")],
  [{ slug: "construct-binary-tree-from-preorder-and-inorder-traversal", id: 105, title: "Construct Binary Tree from Preorder and Inorder Traversal", difficulty: "Medium", categories: ["tree", "hash-table"] }, () => import("@/problems/construct-binary-tree-from-preorder-and-inorder-traversal")],
  [{ slug: "validate-binary-search-tree", id: 98, title: "Validate Binary Search Tree", difficulty: "Medium", categories: ["tree"] }, () => import("@/problems/validate-binary-search-tree")],
  [{ slug: "kth-smallest-element-in-a-bst", id: 230, title: "Kth Smallest Element in a BST", difficulty: "Medium", categories: ["tree"] }, () => import("@/problems/kth-smallest-element-in-a-bst")],
  [{ slug: "lowest-common-ancestor-of-a-binary-search-tree", id: 235, title: "Lowest Common Ancestor of a Binary Search Tree", difficulty: "Medium", categories: ["tree"] }, () => import("@/problems/lowest-common-ancestor-of-a-binary-search-tree")],
  [{ slug: "implement-trie-prefix-tree", id: 208, title: "Implement Trie (Prefix Tree)", difficulty: "Medium", categories: ["tree", "trie", "design"] }, () => import("@/problems/implement-trie-prefix-tree")],
  // Grind 75 additions
  [{ slug: "balanced-binary-tree", id: 110, title: "Balanced Binary Tree", difficulty: "Easy", categories: ["tree"] }, () => import("@/problems/balanced-binary-tree")],
  [{ slug: "implement-queue-using-stacks", id: 232, title: "Implement Queue using Stacks", difficulty: "Easy", categories: ["stack", "design"] }, () => import("@/problems/implement-queue-using-stacks")],
  [{ slug: "binary-search", id: 704, title: "Binary Search", difficulty: "Easy", categories: ["array", "binary-search"] }, () => import("@/problems/binary-search")],
  [{ slug: "flood-fill", id: 733, title: "Flood Fill", difficulty: "Easy", categories: ["matrix", "graph"] }, () => import("@/problems/flood-fill")],
  [{ slug: "add-binary", id: 67, title: "Add Binary", difficulty: "Easy", categories: ["binary", "string"] }, () => import("@/problems/add-binary")],
  [{ slug: "majority-element", id: 169, title: "Majority Element", difficulty: "Easy", categories: ["array", "hash-table"] }, () => import("@/problems/majority-element")],
  [{ slug: "first-bad-version", id: 278, title: "First Bad Version", difficulty: "Easy", categories: ["binary-search"] }, () => import("@/problems/first-bad-version")],
  [{ slug: "ransom-note", id: 383, title: "Ransom Note", difficulty: "Easy", categories: ["hash-table", "string"] }, () => import("@/problems/ransom-note")],
  [{ slug: "longest-palindrome", id: 409, title: "Longest Palindrome", difficulty: "Easy", categories: ["string", "hash-table", "greedy"] }, () => import("@/problems/longest-palindrome")],
  [{ slug: "diameter-of-binary-tree", id: 543, title: "Diameter of Binary Tree", difficulty: "Easy", categories: ["tree"] }, () => import("@/problems/diameter-of-binary-tree")],
  [{ slug: "middle-of-the-linked-list", id: 876, title: "Middle of the Linked List", difficulty: "Easy", categories: ["linked-list", "two-pointers"] }, () => import("@/problems/middle-of-the-linked-list")],
  [{ slug: "evaluate-reverse-polish-notation", id: 150, title: "Evaluate Reverse Polish Notation", difficulty: "Medium", categories: ["stack", "array"] }, () => import("@/problems/evaluate-reverse-polish-notation")],
  [{ slug: "01-matrix", id: 542, title: "01 Matrix", difficulty: "Medium", categories: ["matrix", "graph", "dynamic-programming"] }, () => import("@/problems/01-matrix")],
  [{ slug: "k-closest-points-to-origin", id: 973, title: "K Closest Points to Origin", difficulty: "Medium", categories: ["array", "heap"] }, () => import("@/problems/k-closest-points-to-origin")],
  [{ slug: "min-stack", id: 155, title: "Min Stack", difficulty: "Medium", categories: ["stack", "design"] }, () => import("@/problems/min-stack")],
  [{ slug: "rotting-oranges", id: 994, title: "Rotting Oranges", difficulty: "Medium", categories: ["matrix", "graph"] }, () => import("@/problems/rotting-oranges")],
  [{ slug: "combination-sum", id: 39, title: "Combination Sum", difficulty: "Medium", categories: ["array", "backtracking"] }, () => import("@/problems/combination-sum")],
  [{ slug: "permutations", id: 46, title: "Permutations", difficulty: "Medium", categories: ["array", "backtracking"] }, () => import("@/problems/permutations")],
  [{ slug: "sort-colors", id: 75, title: "Sort Colors", difficulty: "Medium", categories: ["array", "two-pointers"] }, () => import("@/problems/sort-colors")],
  [{ slug: "lowest-common-ancestor-of-a-binary-tree", id: 236, title: "Lowest Common Ancestor of a Binary Tree", difficulty: "Medium", categories: ["tree"] }, () => import("@/problems/lowest-common-ancestor-of-a-binary-tree")],
  [{ slug: "accounts-merge", id: 721, title: "Accounts Merge", difficulty: "Medium", categories: ["graph", "hash-table", "string"] }, () => import("@/problems/accounts-merge")],
  [{ slug: "time-based-key-value-store", id: 981, title: "Time Based Key-Value Store", difficulty: "Medium", categories: ["binary-search", "hash-table", "design"] }, () => import("@/problems/time-based-key-value-store")],
  [{ slug: "string-to-integer-atoi", id: 8, title: "String to Integer (atoi)", difficulty: "Medium", categories: ["string"] }, () => import("@/problems/string-to-integer-atoi")],
  [{ slug: "subsets", id: 78, title: "Subsets", difficulty: "Medium", categories: ["array", "backtracking", "binary"] }, () => import("@/problems/subsets")],
  [{ slug: "binary-tree-right-side-view", id: 199, title: "Binary Tree Right Side View", difficulty: "Medium", categories: ["tree"] }, () => import("@/problems/binary-tree-right-side-view")],
  [{ slug: "partition-equal-subset-sum", id: 416, title: "Partition Equal Subset Sum", difficulty: "Medium", categories: ["array", "dynamic-programming"] }, () => import("@/problems/partition-equal-subset-sum")],
  [{ slug: "letter-combinations-of-a-phone-number", id: 17, title: "Letter Combinations of a Phone Number", difficulty: "Medium", categories: ["string", "backtracking", "hash-table"] }, () => import("@/problems/letter-combinations-of-a-phone-number")],
  [{ slug: "lru-cache", id: 146, title: "LRU Cache", difficulty: "Medium", categories: ["design", "hash-table", "linked-list"] }, () => import("@/problems/lru-cache")],
  [{ slug: "minimum-height-trees", id: 310, title: "Minimum Height Trees", difficulty: "Medium", categories: ["graph"] }, () => import("@/problems/minimum-height-trees")],
  [{ slug: "find-all-anagrams-in-a-string", id: 438, title: "Find All Anagrams in a String", difficulty: "Medium", categories: ["string", "sliding-window", "hash-table"] }, () => import("@/problems/find-all-anagrams-in-a-string")],
  [{ slug: "task-scheduler", id: 621, title: "Task Scheduler", difficulty: "Medium", categories: ["greedy", "heap", "hash-table"] }, () => import("@/problems/task-scheduler")],
  [{ slug: "trapping-rain-water", id: 42, title: "Trapping Rain Water", difficulty: "Hard", categories: ["array", "two-pointers", "dynamic-programming", "stack"] }, () => import("@/problems/trapping-rain-water")],
  [{ slug: "largest-rectangle-in-histogram", id: 84, title: "Largest Rectangle in Histogram", difficulty: "Hard", categories: ["array", "stack"] }, () => import("@/problems/largest-rectangle-in-histogram")],
  [{ slug: "word-ladder", id: 127, title: "Word Ladder", difficulty: "Hard", categories: ["graph", "string", "hash-table"] }, () => import("@/problems/word-ladder")],
  [{ slug: "basic-calculator", id: 224, title: "Basic Calculator", difficulty: "Hard", categories: ["string", "stack"] }, () => import("@/problems/basic-calculator")],
  [{ slug: "find-median-from-data-stream", id: 295, title: "Find Median from Data Stream", difficulty: "Hard", categories: ["heap", "design"] }, () => import("@/problems/find-median-from-data-stream")],
  [{ slug: "maximum-profit-in-job-scheduling", id: 1235, title: "Maximum Profit in Job Scheduling", difficulty: "Hard", categories: ["array", "dynamic-programming", "binary-search"] }, () => import("@/problems/maximum-profit-in-job-scheduling")],
  // NeetCode 150 additions
  [{ slug: "top-k-frequent-elements", id: 347, title: "Top K Frequent Elements", difficulty: "Medium", categories: ["array", "hash-table", "heap"] }, () => import("@/problems/top-k-frequent-elements")],
  [{ slug: "valid-sudoku", id: 36, title: "Valid Sudoku", difficulty: "Medium", categories: ["matrix", "hash-table"] }, () => import("@/problems/valid-sudoku")],
  [{ slug: "two-sum-ii-input-array-is-sorted", id: 167, title: "Two Sum II - Input Array Is Sorted", difficulty: "Medium", categories: ["array", "two-pointers", "binary-search"] }, () => import("@/problems/two-sum-ii-input-array-is-sorted")],
  [{ slug: "permutation-in-string", id: 567, title: "Permutation in String", difficulty: "Medium", categories: ["string", "sliding-window", "hash-table"] }, () => import("@/problems/permutation-in-string")],
  [{ slug: "sliding-window-maximum", id: 239, title: "Sliding Window Maximum", difficulty: "Hard", categories: ["array", "sliding-window", "heap"] }, () => import("@/problems/sliding-window-maximum")],
  [{ slug: "generate-parentheses", id: 22, title: "Generate Parentheses", difficulty: "Medium", categories: ["string", "backtracking", "dynamic-programming"] }, () => import("@/problems/generate-parentheses")],
  [{ slug: "daily-temperatures", id: 739, title: "Daily Temperatures", difficulty: "Medium", categories: ["array", "stack"] }, () => import("@/problems/daily-temperatures")],
  [{ slug: "car-fleet", id: 853, title: "Car Fleet", difficulty: "Medium", categories: ["array", "stack"] }, () => import("@/problems/car-fleet")],
  [{ slug: "search-a-2d-matrix", id: 74, title: "Search a 2D Matrix", difficulty: "Medium", categories: ["matrix", "binary-search"] }, () => import("@/problems/search-a-2d-matrix")],
  [{ slug: "koko-eating-bananas", id: 875, title: "Koko Eating Bananas", difficulty: "Medium", categories: ["array", "binary-search"] }, () => import("@/problems/koko-eating-bananas")],
  [{ slug: "median-of-two-sorted-arrays", id: 4, title: "Median of Two Sorted Arrays", difficulty: "Hard", categories: ["array", "binary-search"] }, () => import("@/problems/median-of-two-sorted-arrays")],
  [{ slug: "copy-list-with-random-pointer", id: 138, title: "Copy List with Random Pointer", difficulty: "Medium", categories: ["linked-list", "hash-table"] }, () => import("@/problems/copy-list-with-random-pointer")],
  [{ slug: "add-two-numbers", id: 2, title: "Add Two Numbers", difficulty: "Medium", categories: ["linked-list"] }, () => import("@/problems/add-two-numbers")],
  [{ slug: "find-the-duplicate-number", id: 287, title: "Find the Duplicate Number", difficulty: "Medium", categories: ["array", "two-pointers", "binary-search"] }, () => import("@/problems/find-the-duplicate-number")],
  [{ slug: "reverse-nodes-in-k-group", id: 25, title: "Reverse Nodes in k-Group", difficulty: "Hard", categories: ["linked-list"] }, () => import("@/problems/reverse-nodes-in-k-group")],
  [{ slug: "count-good-nodes-in-binary-tree", id: 1448, title: "Count Good Nodes in Binary Tree", difficulty: "Medium", categories: ["tree"] }, () => import("@/problems/count-good-nodes-in-binary-tree")],
  [{ slug: "design-add-and-search-words-data-structure", id: 211, title: "Design Add and Search Words Data Structure", difficulty: "Medium", categories: ["trie", "design", "string"] }, () => import("@/problems/design-add-and-search-words-data-structure")],
  [{ slug: "word-search-ii", id: 212, title: "Word Search II", difficulty: "Hard", categories: ["trie", "matrix", "backtracking"] }, () => import("@/problems/word-search-ii")],
  [{ slug: "kth-largest-element-in-a-stream", id: 703, title: "Kth Largest Element in a Stream", difficulty: "Easy", categories: ["heap", "design"] }, () => import("@/problems/kth-largest-element-in-a-stream")],
  [{ slug: "last-stone-weight", id: 1046, title: "Last Stone Weight", difficulty: "Easy", categories: ["heap", "array"] }, () => import("@/problems/last-stone-weight")],
  [{ slug: "kth-largest-element-in-an-array", id: 215, title: "Kth Largest Element in an Array", difficulty: "Medium", categories: ["array", "heap"] }, () => import("@/problems/kth-largest-element-in-an-array")],
  [{ slug: "design-twitter", id: 355, title: "Design Twitter", difficulty: "Medium", categories: ["design", "heap", "hash-table"] }, () => import("@/problems/design-twitter")],
  [{ slug: "subsets-ii", id: 90, title: "Subsets II", difficulty: "Medium", categories: ["array", "backtracking"] }, () => import("@/problems/subsets-ii")],
  [{ slug: "combination-sum-ii", id: 40, title: "Combination Sum II", difficulty: "Medium", categories: ["array", "backtracking"] }, () => import("@/problems/combination-sum-ii")],
  [{ slug: "palindrome-partitioning", id: 131, title: "Palindrome Partitioning", difficulty: "Medium", categories: ["string", "backtracking", "dynamic-programming"] }, () => import("@/problems/palindrome-partitioning")],
  [{ slug: "n-queens", id: 51, title: "N-Queens", difficulty: "Hard", categories: ["backtracking", "matrix"] }, () => import("@/problems/n-queens")],
  [{ slug: "max-area-of-island", id: 695, title: "Max Area of Island", difficulty: "Medium", categories: ["graph", "matrix"] }, () => import("@/problems/max-area-of-island")],
  [{ slug: "surrounded-regions", id: 130, title: "Surrounded Regions", difficulty: "Medium", categories: ["graph", "matrix"] }, () => import("@/problems/surrounded-regions")],
  [{ slug: "walls-and-gates", id: 286, title: "Walls and Gates", difficulty: "Medium", categories: ["graph", "matrix"], premium: true }, () => import("@/problems/walls-and-gates")],
  [{ slug: "course-schedule-ii", id: 210, title: "Course Schedule II", difficulty: "Medium", categories: ["graph"] }, () => import("@/problems/course-schedule-ii")],
  [{ slug: "redundant-connection", id: 684, title: "Redundant Connection", difficulty: "Medium", categories: ["graph"] }, () => import("@/problems/redundant-connection")],
  [{ slug: "reconstruct-itinerary", id: 332, title: "Reconstruct Itinerary", difficulty: "Hard", categories: ["graph", "backtracking"] }, () => import("@/problems/reconstruct-itinerary")],
  [{ slug: "min-cost-to-connect-all-points", id: 1584, title: "Min Cost to Connect All Points", difficulty: "Medium", categories: ["graph", "array"] }, () => import("@/problems/min-cost-to-connect-all-points")],
  [{ slug: "network-delay-time", id: 743, title: "Network Delay Time", difficulty: "Medium", categories: ["graph", "heap"] }, () => import("@/problems/network-delay-time")],
  [{ slug: "swim-in-rising-water", id: 778, title: "Swim in Rising Water", difficulty: "Hard", categories: ["graph", "matrix", "heap", "binary-search"] }, () => import("@/problems/swim-in-rising-water")],
  [{ slug: "cheapest-flights-within-k-stops", id: 787, title: "Cheapest Flights Within K Stops", difficulty: "Medium", categories: ["graph", "dynamic-programming"] }, () => import("@/problems/cheapest-flights-within-k-stops")],
  [{ slug: "min-cost-climbing-stairs", id: 746, title: "Min Cost Climbing Stairs", difficulty: "Easy", categories: ["dynamic-programming", "array"] }, () => import("@/problems/min-cost-climbing-stairs")],
  [{ slug: "best-time-to-buy-and-sell-stock-with-cooldown", id: 309, title: "Best Time to Buy and Sell Stock with Cooldown", difficulty: "Medium", categories: ["dynamic-programming", "array"] }, () => import("@/problems/best-time-to-buy-and-sell-stock-with-cooldown")],
  [{ slug: "coin-change-ii", id: 518, title: "Coin Change II", difficulty: "Medium", categories: ["dynamic-programming", "array"] }, () => import("@/problems/coin-change-ii")],
  [{ slug: "target-sum", id: 494, title: "Target Sum", difficulty: "Medium", categories: ["dynamic-programming", "backtracking", "array"] }, () => import("@/problems/target-sum")],
  [{ slug: "interleaving-string", id: 97, title: "Interleaving String", difficulty: "Medium", categories: ["dynamic-programming", "string"] }, () => import("@/problems/interleaving-string")],
  [{ slug: "longest-increasing-path-in-a-matrix", id: 329, title: "Longest Increasing Path in a Matrix", difficulty: "Hard", categories: ["dynamic-programming", "matrix", "graph"] }, () => import("@/problems/longest-increasing-path-in-a-matrix")],
  [{ slug: "distinct-subsequences", id: 115, title: "Distinct Subsequences", difficulty: "Hard", categories: ["dynamic-programming", "string"] }, () => import("@/problems/distinct-subsequences")],
  [{ slug: "edit-distance", id: 72, title: "Edit Distance", difficulty: "Medium", categories: ["dynamic-programming", "string"] }, () => import("@/problems/edit-distance")],
  [{ slug: "burst-balloons", id: 312, title: "Burst Balloons", difficulty: "Hard", categories: ["dynamic-programming", "array"] }, () => import("@/problems/burst-balloons")],
  [{ slug: "regular-expression-matching", id: 10, title: "Regular Expression Matching", difficulty: "Hard", categories: ["dynamic-programming", "string"] }, () => import("@/problems/regular-expression-matching")],
  [{ slug: "jump-game-ii", id: 45, title: "Jump Game II", difficulty: "Medium", categories: ["greedy", "array", "dynamic-programming"] }, () => import("@/problems/jump-game-ii")],
  [{ slug: "gas-station", id: 134, title: "Gas Station", difficulty: "Medium", categories: ["greedy", "array"] }, () => import("@/problems/gas-station")],
  [{ slug: "hand-of-straights", id: 846, title: "Hand of Straights", difficulty: "Medium", categories: ["greedy", "hash-table", "array"] }, () => import("@/problems/hand-of-straights")],
  [{ slug: "merge-triplets-to-form-target-triplet", id: 1899, title: "Merge Triplets to Form Target Triplet", difficulty: "Medium", categories: ["greedy", "array"] }, () => import("@/problems/merge-triplets-to-form-target-triplet")],
  [{ slug: "partition-labels", id: 763, title: "Partition Labels", difficulty: "Medium", categories: ["greedy", "string", "two-pointers"] }, () => import("@/problems/partition-labels")],
  [{ slug: "valid-parenthesis-string", id: 678, title: "Valid Parenthesis String", difficulty: "Medium", categories: ["greedy", "string", "dynamic-programming"] }, () => import("@/problems/valid-parenthesis-string")],
  [{ slug: "minimum-interval-to-include-each-query", id: 1851, title: "Minimum Interval to Include Each Query", difficulty: "Hard", categories: ["interval", "heap", "binary-search"] }, () => import("@/problems/minimum-interval-to-include-each-query")],
  [{ slug: "happy-number", id: 202, title: "Happy Number", difficulty: "Easy", categories: ["math", "hash-table", "two-pointers"] }, () => import("@/problems/happy-number")],
  [{ slug: "plus-one", id: 66, title: "Plus One", difficulty: "Easy", categories: ["math", "array"] }, () => import("@/problems/plus-one")],
  [{ slug: "powx-n", id: 50, title: "Pow(x, n)", difficulty: "Medium", categories: ["math"] }, () => import("@/problems/powx-n")],
  [{ slug: "multiply-strings", id: 43, title: "Multiply Strings", difficulty: "Medium", categories: ["math", "string"] }, () => import("@/problems/multiply-strings")],
  [{ slug: "detect-squares", id: 2013, title: "Detect Squares", difficulty: "Medium", categories: ["math", "design", "hash-table"] }, () => import("@/problems/detect-squares")],
  [{ slug: "single-number", id: 136, title: "Single Number", difficulty: "Easy", categories: ["binary", "array"] }, () => import("@/problems/single-number")],
  [{ slug: "reverse-integer", id: 7, title: "Reverse Integer", difficulty: "Medium", categories: ["math"] }, () => import("@/problems/reverse-integer")],
];

export const problems: ProblemEntry[] = entries.map(([meta, load]) => ({ ...meta, load }));

const bySlug = new Map(problems.map((p) => [p.slug, p]));

export const getProblem = (slug: string) => bySlug.get(slug);

export const problemsInCategory = (id: CategoryId) =>
  problems.filter((p) => p.categories.includes(id));

export { leetcodeUrl } from "@/lib/leetcode";

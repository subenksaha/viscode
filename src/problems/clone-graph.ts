import { arr, edgeKey, graph, map, tones } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  adjList: number[][];
}

class GraphNode {
  constructor(
    public val: number,
    public neighbors: GraphNode[] = [],
  ) {}
}

function build(adj: number[][]): GraphNode | null {
  if (!adj.length) return null;
  const nodes = adj.map((_, i) => new GraphNode(i + 1));
  adj.forEach((ns, i) => (nodes[i].neighbors = ns.map((v) => nodes[v - 1])));
  return nodes[0];
}

function toAdj(node: GraphNode | null): number[][] {
  if (!node) return [];
  const all = new Map<number, GraphNode>();
  const stack = [node];
  while (stack.length) {
    const n = stack.pop()!;
    if (all.has(n.val)) continue;
    all.set(n.val, n);
    stack.push(...n.neighbors);
  }
  return [...all.keys()].sort((a, b) => a - b).map((v) => all.get(v)!.neighbors.map((x) => x.val));
}

function edgesOf(adj: number[][]) {
  return adj.flatMap((ns, i) => ns.map((v) => [i + 1, v] as const));
}

/** Panels: the original graph (colored by progress) and the clone built so far. */
function views(adj: number[][], clones: Map<GraphNode, GraphNode>, active?: GraphNode, edge?: [number, number]) {
  const ids = adj.map((_, i) => i + 1);
  const cloneTones: Record<string, Tone> = {};
  const done = new Set([...clones.keys()].map((n) => n.val));
  for (const id of ids) if (done.has(id)) cloneTones[id] = "visited";
  if (active) cloneTones[active.val] = "active";
  const cloned = [...clones.values()];
  return [
    graph("original", ids, edgesOf(adj), { tones: cloneTones, edgeTones: edge ? tones([edgeKey(...edge), "active"]) : {} }),
    graph(
      "clone",
      cloned.map((c) => c.val).sort((a, b) => a - b),
      cloned.flatMap((c) => c.neighbors.map((n) => [c.val, n.val] as const)),
      { tones: active ? tones([active.val, "success"]) : {} },
    ),
    map("old → new", [...clones.keys()].map((k) => [k.val, `${k.val}'`])),
  ];
}

const dfs = defineSolution<Input>({
  id: "dfs",
  name: "DFS + Hash Map",
  time: "O(V + E)",
  space: "O(V)",
  idea: "Recursively clone each node, recording old → new in a map before visiting neighbors so cycles reuse the existing copy.",
  approach: [
    {
      title: "Clone on first visit",
      detail: "Create the copy and record original → copy before visiting neighbors, so cycles find it.",
      at: "create",
    },
    {
      title: "Recurse into neighbors",
      detail: "Each neighbor is cloned (or found in the map) and linked into the copy's list.",
      at: "link",
    },
    {
      title: "Reuse existing clones",
      detail: "Reaching an already-cloned node returns its copy, which breaks cycles and keeps shared nodes shared.",
      at: "hit",
    },
    {
      title: "Done",
      detail: "Every node and edge is copied once: O(V + E).",
      at: "ret",
    },
  ],
  code: code(`
    function cloneGraph(node: _Node | null): _Node | null {
      const clones = new Map<_Node, _Node>();
      function clone(original: _Node): _Node {
        if (clones.has(original)) return clones.get(original)!; //@hit
        const copy = new _Node(original.val); //@create
        clones.set(original, copy);
        for (const neighbor of original.neighbors) {
          copy.neighbors.push(clone(neighbor)); //@link
        }
        return copy; //@done
      }
      return node ? clone(node) : null; //@ret
    }
  `),
  run({ adjList }, t) {
    const root = build(adjList);
    const clones = new Map<GraphNode, GraphNode>();
    const clone = (n: GraphNode): GraphNode => {
      if (clones.has(n)) {
        t.step("hit", `Node ${n.val} is already cloned. Reuse it.`, () => views(adjList, clones, n));
        return clones.get(n)!;
      }
      const copy = new GraphNode(n.val);
      clones.set(n, copy);
      t.step("create", `Create a copy of node ${n.val}.`, () => views(adjList, clones, n));
      for (const nb of n.neighbors) {
        const c = clone(nb);
        copy.neighbors.push(c);
        t.step("link", `Link ${n.val}' → ${nb.val}'.`, () => views(adjList, clones, n, [n.val, nb.val]));
      }
      t.step("done", `Node ${n.val} is fully cloned.`, () => views(adjList, clones, n));
      return copy;
    };
    const res = root ? clone(root) : null;
    t.step("ret", "Return the copy of node 1.", () => views(adjList, clones));
    return toAdj(res);
  },
});

const bfs = defineSolution<Input>({
  id: "bfs",
  name: "BFS + Hash Map",
  time: "O(V + E)",
  space: "O(V)",
  idea: "Clone the start node, then BFS. When a neighbor is first seen, clone it and enqueue it. Always wire the edge from the current copy.",
  approach: [
    {
      title: "Clone the start",
      detail: "Map the start node to its copy and enqueue it.",
      at: "init",
    },
    {
      title: "Process a node",
      detail: "Look at each neighbor of the popped original.",
      at: "pop",
    },
    {
      title: "First sight: clone and enqueue",
      detail: "A neighbor not in the map gets a copy and joins the queue.",
      at: "new",
    },
    {
      title: "Wire the edge",
      detail: "Always link copy(original) → copy(neighbor), whether the neighbor is new or not.",
      at: "link",
    },
  ],
  code: code(`
    function cloneGraph(node: _Node | null): _Node | null {
      if (node === null) return null;
      const clones = new Map<_Node, _Node>(); //@init
      clones.set(node, new _Node(node.val));
      const queue = [node];
      while (queue.length > 0) { //@loop
        const original = queue.shift()!; //@pop
        for (const neighbor of original.neighbors) {
          if (!clones.has(neighbor)) { //@new
            clones.set(neighbor, new _Node(neighbor.val));
            queue.push(neighbor);
          }
          clones.get(original)!.neighbors.push(clones.get(neighbor)!); //@link
        }
      }
      return clones.get(node)!; //@ret
    }
  `),
  run({ adjList }, t) {
    const root = build(adjList);
    if (!root) {
      t.step("ret", "Empty graph.");
      return [];
    }
    const clones = new Map([[root, new GraphNode(root.val)]]);
    const queue = [root];
    const view = (n?: GraphNode, edge?: [number, number]) => [
      ...views(adjList, clones, n, edge),
      arr("queue", queue.map((q) => q.val), { indexLabels: false }),
    ];
    t.step("init", "Clone node 1 and enqueue it.", view());
    while (queue.length) {
      t.step("loop", `Queue: [${queue.map((q) => q.val)}].`, view());
      const n = queue.shift()!;
      t.step("pop", `Process node ${n.val}.`, view(n));
      for (const nb of n.neighbors) {
        if (!clones.has(nb)) {
          clones.set(nb, new GraphNode(nb.val));
          queue.push(nb);
          t.step("new", `First time seeing ${nb.val}: clone and enqueue it.`, () => view(n, [n.val, nb.val]));
        }
        clones.get(n)!.neighbors.push(clones.get(nb)!);
        t.step("link", `Link ${n.val}' → ${nb.val}'.`, () => view(n, [n.val, nb.val]));
      }
    }
    t.step("ret", "Return the copy of node 1.", view());
    return toAdj(clones.get(root)!);
  },
});

export default defineProblem<Input>({
  description: "Given a node in a connected undirected graph (as an adjacency list where node i+1's neighbors are adjList[i]), return a deep copy of the graph.",
  input: { default: "adjList = [[2,4],[1,3],[2,4],[1,3]]", parse: (a) => ({ adjList: a.matrix<number>("adjList") }) },
  examples: [
    { input: "adjList = [[2,4],[1,3],[2,4],[1,3]]", output: [[2, 4], [1, 3], [2, 4], [1, 3]] },
    { input: "adjList = [[]]", output: [[]] },
    { input: "adjList = []", output: [] },
  ],
  solutions: [dfs, bfs],
});

import { arr, edgeKey, graph, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  numCourses: number;
  prerequisites: [number, number][];
}

// Edge b -> a means "take b before a".
const edgesOf = (pre: [number, number][]) => pre.map(([a, b]) => [b, a] as const);
const ids = (n: number) => Array.from({ length: n }, (_, i) => i);

const kahn = defineSolution<Input>({
  id: "kahn",
  name: "Kahn's Algorithm (BFS)",
  time: "O(V + E)",
  space: "O(V + E)",
  idea: "Take courses whose prerequisites are all done, in the order they become available. If some course never becomes available, there is a cycle.",
  approach: [
    {
      title: "Build the graph and in-degrees",
      detail: "Count each course's unfinished prerequisites.",
      at: "build",
    },
    {
      title: "Ready courses",
      detail: "Courses with in-degree 0 can be taken.",
      at: "seed",
    },
    {
      title: "Take and unlock",
      detail: "Append to the order and decrement each dependent's in-degree.",
      at: "take",
    },
    {
      title: "Newly ready",
      detail: "At 0 they join the queue.",
      at: "relax",
    },
    {
      title: "Valid order or []",
      detail: "If not every course was taken, there is a cycle.",
      at: "ret",
    },
  ],
  code: code(`
    function findOrder(numCourses: number, prerequisites: number[][]): number[] {
      // unlocks[c] = courses that need c first; inDegree[c] = how many courses c still waits on
      const unlocks: number[][] = Array.from({ length: numCourses }, () => []);
      const inDegree = new Array(numCourses).fill(0);
      for (const [course, required] of prerequisites) { //@build
        unlocks[required].push(course);
        inDegree[course]++;
      }
      const queue: number[] = [];
      for (let course = 0; course < numCourses; course++) { //@seed
        if (inDegree[course] === 0) queue.push(course);
      }
      const order: number[] = [];
      while (queue.length > 0) {
        const course = queue.shift()!; //@take
        order.push(course);
        for (const next of unlocks[course]) { //@relax
          inDegree[next]--;
          if (inDegree[next] === 0) queue.push(next);
        }
      }
      return order.length === numCourses ? order : []; //@ret
    }
  `),
  run({ numCourses, prerequisites }, t) {
    const indeg = new Array(numCourses).fill(0),
      adj: number[][] = Array.from({ length: numCourses }, () => []);
    for (const [a, b] of prerequisites) {
      adj[b].push(a);
      indeg[a]++;
    }
    const queue = indeg.flatMap((d, i) => (d === 0 ? [i] : [])),
      order: number[] = [];
    const view = (c?: number) => {
      const tn: Record<string, Tone> = {};
      order.forEach((o) => (tn[o] = "success"));
      queue.forEach((q) => (tn[q] = "compare"));
      if (c !== undefined) tn[c] = "active";
      return [
        graph("courses (prereq → course)", ids(numCourses), edgesOf(prerequisites), { directed: true, tones: tn }),
        arr("in-degree", indeg),
        arr("queue", queue, { indexLabels: false }),
        arr("order", order, { indexLabels: false }),
      ];
    };
    t.step("build", "Build the graph and in-degrees.", view());
    t.step("seed", `Ready now: [${queue}].`, view());
    while (queue.length) {
      const c = queue.shift()!;
      order.push(c);
      t.step("take", `Take ${c}.`, view(c));
      const freed = adj[c].filter((next) => --indeg[next] === 0);
      queue.push(...freed);
      if (adj[c].length) t.step("relax", freed.length ? `Unlocked: [${freed}].` : `Dependents of ${c} still wait on others.`, view(c));
    }
    const ok = order.length === numCourses;
    t.step("ret", ok ? `Order: [${order}].` : "A cycle left some courses untaken. Return [].", view());
    return ok ? order : [];
  },
});

const dfsPost = defineSolution<Input>({
  id: "dfs-postorder",
  name: "DFS Post-order (Reversed)",
  time: "O(V + E)",
  space: "O(V + E)",
  idea: "A course finishes in DFS only after everything that depends on it has finished. Reversing the finish order gives a valid schedule; reaching a node still on the path means a cycle.",
  approach: [
    {
      title: "Adjacency",
      detail: "Edges go from a prerequisite to its dependent.",
      at: "build",
    },
    {
      title: "Enter",
      detail: "Mark visiting. Reaching a visiting node again means a cycle.",
      at: "enter",
    },
    {
      title: "Finish after the dependents",
      detail: "A course finishes only after every course it unlocks has finished.",
      at: "finish",
    },
    {
      title: "Reverse",
      detail: "Reversed finish order puts every prerequisite before its dependents.",
      at: "ret",
    },
  ],
  code: code(`
    function findOrder(numCourses: number, prerequisites: number[][]): number[] {
      const unlocks: number[][] = Array.from({ length: numCourses }, () => []);
      for (const [course, required] of prerequisites) unlocks[required].push(course); //@build
      const state: ("new" | "visiting" | "done")[] = new Array(numCourses).fill("new");
      const finishOrder: number[] = [];
      // Returns false if a cycle is found.
      function visit(course: number): boolean {
        if (state[course] === "visiting") return false; //@cycle
        if (state[course] === "done") return true;
        state[course] = "visiting"; //@enter
        for (const next of unlocks[course]) {
          if (!visit(next)) return false;
        }
        state[course] = "done"; //@finish
        finishOrder.push(course);
        return true;
      }
      for (let course = 0; course < numCourses; course++) {
        if (!visit(course)) return [];
      }
      return finishOrder.reverse(); //@ret
    }
  `),
  run({ numCourses, prerequisites }, t) {
    const adj: number[][] = Array.from({ length: numCourses }, () => []);
    for (const [a, b] of prerequisites) adj[b].push(a);
    const state = new Array(numCourses).fill(0),
      post: number[] = [];
    const view = (u?: number, from?: number, bad = false) => {
      const tn: Record<string, Tone> = {};
      state.forEach((s, i) => s && (tn[i] = s === 1 ? "compare" : "success"));
      if (u !== undefined) tn[u] = bad ? "danger" : "active";
      return [
        graph("courses (prereq → course)", ids(numCourses), edgesOf(prerequisites), {
          directed: true,
          tones: tn,
          edgeTones: from !== undefined && u !== undefined ? tones([edgeKey(from, u), bad ? "danger" : "active"]) : {},
        }),
        vars({ finishOrder: `[${post}]` }),
      ];
    };
    t.step("build", "Build the adjacency list.", view());
    const dfs = (u: number, from?: number): boolean => {
      if (state[u] === 1) {
        t.step("cycle", `${u} is already on the current path: cycle.`, () => view(u, from, true));
        return false;
      }
      if (state[u] === 2) return true;
      state[u] = 1;
      t.step("enter", `Enter ${u}.`, () => view(u, from));
      for (const v of adj[u]) if (!dfs(v, u)) return false;
      state[u] = 2;
      post.push(u);
      t.step("finish", `Everything after ${u} is done. Finish ${u}.`, () => view(u));
      return true;
    };
    for (let i = 0; i < numCourses; i++)
      if (!dfs(i)) {
        t.step("ret", "Cycle: return [].", view());
        return [];
      }
    const order = [...post].reverse();
    t.step("ret", `Reverse the finish order: [${order}].`, view());
    return order;
  },
});

export default defineProblem<Input>({
  description: "There are numCourses courses and prerequisites[i] = [a, b] means b must be taken before a. Return an order in which all courses can be taken, or [] if that is impossible.",
  input: {
    default: "numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]",
    parse: (a) => ({ numCourses: a.int("numCourses"), prerequisites: a.pairs("prerequisites") }),
  },
  examples: [
    { input: "numCourses = 2, prerequisites = [[1,0]]", output: [0, 1] },
    { input: "numCourses = 3, prerequisites = [[1,0],[2,1]]", output: [0, 1, 2] },
    { input: "numCourses = 2, prerequisites = [[1,0],[0,1]]", output: [] },
    { input: "numCourses = 1, prerequisites = []", output: [0] },
  ],
  solutions: [kahn, dfsPost],
});

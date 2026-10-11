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
  name: "Kahn's Algorithm (BFS Topological Sort)",
  time: "O(V + E)",
  space: "O(V + E)",
  idea: "Repeatedly take a course with no remaining prerequisites and remove its outgoing edges. If every course gets taken, there is no cycle.",
  approach: [
    {
      title: "Build the graph and in-degrees",
      detail: "An edge from b to a means b unlocks a. inDegree[a] counts unfinished prerequisites.",
      at: "build",
    },
    {
      title: "Start with free courses",
      detail: "Courses with in-degree 0 can be taken right away.",
      at: "seed",
    },
    {
      title: "Take a course",
      detail: "Pop it and count it as taken.",
      at: "take",
    },
    {
      title: "Unlock dependents",
      detail: "Decrement each dependent's in-degree. At zero, it is ready and joins the queue.",
      at: "ready",
    },
    {
      title: "All taken means no cycle",
      detail: "Courses on a cycle never reach in-degree 0. So taken === numCourses exactly when the graph is acyclic.",
      at: "ret",
    },
  ],
  code: code(`
    function canFinish(numCourses: number, prerequisites: number[][]): boolean {
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
      let taken = 0;
      while (queue.length > 0) { //@loop
        const course = queue.shift()!; //@take
        taken++;
        for (const next of unlocks[course]) { //@edge
          inDegree[next]--;
          if (inDegree[next] === 0) queue.push(next); //@ready
        }
      }
      return taken === numCourses; //@ret
    }
  `),
  run({ numCourses, prerequisites }, t) {
    const indeg = new Array(numCourses).fill(0),
      adj: number[][] = Array.from({ length: numCourses }, () => []);
    for (const [a, b] of prerequisites) {
      adj[b].push(a);
      indeg[a]++;
    }
    const done = new Set<number>();
    const queue = indeg.flatMap((d, i) => (d === 0 ? [i] : []));
    let taken = 0;
    const view = (c?: number, next?: number) => {
      const nodeTones: Record<string, Tone> = {};
      done.forEach((d) => (nodeTones[d] = "success"));
      queue.forEach((q) => (nodeTones[q] = "compare"));
      if (c !== undefined) nodeTones[c] = "active";
      return [
        vars({ taken }),
        graph("courses (prereq → course)", ids(numCourses), edgesOf(prerequisites), {
          directed: true,
          tones: nodeTones,
          edgeTones: c !== undefined && next !== undefined ? tones([edgeKey(c, next), "active"]) : {},
        }),
        arr("in-degree", indeg, { tones: tones([next, "active"]) }),
        arr("queue", queue, { indexLabels: false }),
      ];
    };
    t.step("build", "Build the graph and count each course's prerequisites.", view());
    t.step("seed", `Courses with no prerequisites: [${queue}].`, view());
    while (queue.length) {
      t.step("loop", `Queue: [${queue}].`, view());
      const c = queue.shift()!;
      taken++;
      done.add(c);
      t.step("take", `Take course ${c}. taken = ${taken}.`, view(c));
      for (const next of adj[c]) {
        indeg[next]--;
        if (indeg[next] === 0) {
          queue.push(next);
          t.step("ready", `${next} has no prerequisites left. Enqueue it.`, view(c, next));
        } else t.step("edge", `${next} still needs ${indeg[next]} more.`, view(c, next));
      }
    }
    const ok = taken === numCourses;
    t.step("ret", ok ? "All courses taken. Return true." : `Only ${taken} of ${numCourses} taken: a cycle blocks the rest.`, view());
    return ok;
  },
});

const dfsColors = defineSolution<Input>({
  id: "dfs-cycle",
  name: "DFS Cycle Detection (3 Colors)",
  time: "O(V + E)",
  space: "O(V + E)",
  idea: "Mark nodes white (new), gray (on the current path) or black (done). Reaching a gray node means a back edge, which is a cycle.",
  approach: [
    {
      title: "Adjacency list",
      detail: "Edges go from a prerequisite to the course it unlocks.",
      at: "build",
    },
    {
      title: "Gray on entry",
      detail: "Mark the course as visiting: it is on the current DFS path.",
      at: "enter",
    },
    {
      title: "Explore dependents",
      detail: "Recurse into each course this one unlocks. Hitting a gray course means a back edge, which is a cycle.",
      at: "visit",
    },
    {
      title: "Black on exit",
      detail: "Once all descendants are clean, mark the course done. Later visits return immediately.",
      at: "exit",
    },
    {
      title: "No cycle found",
      detail: "If no DFS hits a gray node, all courses can be finished.",
      at: "ret",
    },
  ],
  code: code(`
    function canFinish(numCourses: number, prerequisites: number[][]): boolean {
      const unlocks: number[][] = Array.from({ length: numCourses }, () => []);
      for (const [course, required] of prerequisites) unlocks[required].push(course); //@build
      const state: ("new" | "visiting" | "done")[] = new Array(numCourses).fill("new");
      function hasCycle(course: number): boolean {
        if (state[course] === "visiting") return true; //@gray
        if (state[course] === "done") return false; //@black
        state[course] = "visiting"; //@enter
        for (const next of unlocks[course]) { //@visit
          if (hasCycle(next)) return true;
        }
        state[course] = "done"; //@exit
        return false;
      }
      for (let course = 0; course < numCourses; course++) { //@start
        if (hasCycle(course)) return false;
      }
      return true; //@ret
    }
  `),
  run({ numCourses, prerequisites }, t) {
    const adj: number[][] = Array.from({ length: numCourses }, () => []);
    for (const [a, b] of prerequisites) adj[b].push(a);
    const state = new Array(numCourses).fill(0);
    const view = (u?: number, edge?: [number, number], bad = false) => {
      const nodeTones: Record<string, Tone> = {};
      state.forEach((s, i) => s && (nodeTones[i] = s === 1 ? "active" : "success"));
      if (bad && u !== undefined) nodeTones[u] = "danger";
      return [
        graph("courses (prereq → course)", ids(numCourses), edgesOf(prerequisites), {
          directed: true,
          tones: nodeTones,
          edgeTones: edge ? tones([edgeKey(...edge), bad ? "danger" : "active"]) : {},
        }),
        arr("state", state.map((s) => ["white", "gray", "black"][s]), { tones: tones([u, "active"]) }),
      ];
    };
    t.step("build", "Build the adjacency list.", view());
    const hasCycle = (u: number, from?: number): boolean => {
      const edge = from !== undefined ? ([from, u] as [number, number]) : undefined;
      if (state[u] === 1) {
        t.step("gray", `${u} is gray (already on the current path). Cycle!`, () => view(u, edge, true));
        return true;
      }
      if (state[u] === 2) {
        t.step("black", `${u} is already finished.`, () => view(u, edge));
        return false;
      }
      state[u] = 1;
      t.step("enter", `Enter ${u}: mark it gray.`, () => view(u, edge));
      for (const v of adj[u]) {
        t.step("visit", `Follow ${u} → ${v}.`, () => view(u, [u, v]));
        if (hasCycle(v, u)) return true;
      }
      state[u] = 2;
      t.step("exit", `All of ${u}'s dependents are done: mark it black.`, () => view(u));
      return false;
    };
    for (let i = 0; i < numCourses; i++) {
      if (state[i] !== 0) continue;
      t.step("start", `Start DFS at ${i}.`, () => view(i));
      if (hasCycle(i)) {
        t.step("start", "Cycle found. Return false.", view());
        return false;
      }
    }
    t.step("ret", "No cycle. Return true.", view());
    return true;
  },
});

export default defineProblem<Input>({
  description: "There are numCourses courses. prerequisites[i] = [a, b] means you must take b before a. Return true if you can finish all courses.",
  input: {
    default: "numCourses = 5, prerequisites = [[1,0],[2,1],[3,1],[4,2],[4,3]]",
    parse: (a) => ({ numCourses: a.int("numCourses"), prerequisites: a.pairs("prerequisites") }),
  },
  examples: [
    { input: "numCourses = 2, prerequisites = [[1,0]]", output: true },
    { input: "numCourses = 2, prerequisites = [[1,0],[0,1]]", output: false },
    { input: "numCourses = 4, prerequisites = [[1,0],[2,1],[3,2],[1,3]]", output: false },
  ],
  solutions: [kahn, dfsColors],
});

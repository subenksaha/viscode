import { arr, map, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  tasks: string[];
  n: number;
}

const countTasks = (tasks: string[]) => {
  const count = new Map<string, number>();
  for (const x of tasks) count.set(x, (count.get(x) ?? 0) + 1);
  return count;
};

const simulate = defineSolution<Input>({
  id: "greedy-simulation",
  name: "Greedy Simulation (Max-heap + Cooldown Queue)",
  time: "O(T log 26)",
  space: "O(26)",
  idea: "Each tick, run the available task with the most copies left, since it is the hardest to fit. A task that just ran waits in a cooldown queue for n ticks before it is available again.",
  code: code(`
    function leastInterval(tasks: string[], n: number): number {
      const count = new Map<string, number>();
      for (const task of tasks) count.set(task, (count.get(task) ?? 0) + 1);
      // Tasks we can run now, by how many copies are left (most first).
      const ready = new MaxPriorityQueue<number>(); //@init
      for (const copies of count.values()) ready.enqueue(copies);
      const cooling: [number, number][] = []; // [copies left, time it can run again]
      let time = 0;
      while (ready.size() > 0 || cooling.length > 0) { //@tick
        time++;
        if (ready.size() > 0) { //@run
          const copiesLeft = ready.dequeue() - 1;
          if (copiesLeft > 0) cooling.push([copiesLeft, time + n]);
        }
        if (cooling.length > 0 && cooling[0][1] === time) { //@release
          ready.enqueue(cooling.shift()![0]);
        }
      }
      return time; //@ret
    }
  `),
  run({ tasks, n }, t) {
    const count = countTasks(tasks);
    // Sorted array (largest first) stands in for the max-heap; entries are [task, remaining].
    const ready: [string, number][] = [...count].sort((a, b) => b[1] - a[1]);
    const cooling: [string, number, number][] = [];
    const schedule: string[] = [];
    let time = 0;
    const insert = (e: [string, number]) => {
      let i = 0;
      while (i < ready.length && ready[i][1] >= e[1]) i++;
      ready.splice(i, 0, e);
    };
    const view = (hi?: string) => [
      vars({ time }),
      map("ready (task → left)", ready, tones([hi, "active"])),
      map("cooling (task → free at)", cooling.map(([x, , at]) => [x, at])),
      arr("schedule", schedule, { indexLabels: false, tones: tones([schedule.length - 1, schedule.at(-1) === "idle" ? "muted" : "success"]) }),
    ];
    t.step("init", "Every task type starts ready.", view());
    while (ready.length || cooling.length) {
      time++;
      t.step("tick", `Tick ${time}.`, view());
      if (ready.length) {
        const [x, c] = ready.shift()!;
        schedule.push(x);
        if (c - 1) cooling.push([x, c - 1, time + n]);
        t.step("run", `Run ${x} (${c - 1} left).`, view(x));
      } else {
        schedule.push("idle");
        t.step("run", "Nothing is ready: idle.", view());
      }
      if (cooling[0]?.[2] === time) {
        const [x, c] = cooling.shift()!;
        insert([x, c]);
        t.step("release", `${x} has cooled down.`, view(x));
      }
    }
    t.step("ret", `Finished after ${time} intervals.`, view());
    return time;
  },
});

const formula = defineSolution<Input>({
  id: "frame-formula",
  name: "Frame Counting Formula",
  time: "O(T)",
  space: "O(26)",
  idea: "The most frequent task (count f) forces f − 1 frames of length n + 1, plus a final partial frame holding every task tied for the max. If there are enough other tasks to fill all gaps, the answer is just the number of tasks.",
  code: code(`
    function leastInterval(tasks: string[], n: number): number {
      const count = new Map<string, number>();
      for (const task of tasks) count.set(task, (count.get(task) ?? 0) + 1); //@count
      const maxCount = Math.max(...count.values()); //@max
      let tiedForMax = 0; //@tied
      for (const copies of count.values()) {
        if (copies === maxCount) tiedForMax++;
      }
      // The most common task needs (maxCount - 1) gaps of size n + 1, then one last round.
      const framed = (maxCount - 1) * (n + 1) + tiedForMax;
      return Math.max(tasks.length, framed); //@ret
    }
  `),
  run({ tasks, n }, t) {
    const count = countTasks(tasks);
    t.step("count", "Count each task.", [map("count", count)]);
    const f = Math.max(...count.values());
    const top = [...count].filter(([, c]) => c === f).map(([x]) => x);
    t.step("max", `The most frequent task appears maxCount = ${f} times.`, [vars({ maxCount: f }), map("count", count, tones(...top.map((x) => [x, "active"] as [string, "active"])))]);
    t.step("tied", `${top.length} task(s) tie for the max: ${top.join(", ")}.`, [vars({ maxCount: f, tiedForMax: top.length })]);
    const frames = (f - 1) * (n + 1) + top.length;
    // Lay out the frames so the shape is visible.
    const rows: string[] = [];
    for (let k = 0; k < f; k++) rows.push(k < f - 1 ? [...top, ...Array(n + 1 - top.length).fill("_")].slice(0, Math.max(n + 1, top.length)).join(" ") : top.join(" "));
    const res = Math.max(tasks.length, frames);
    t.step("ret", frames >= tasks.length ? `(${f} − 1) × (${n} + 1) + ${top.length} = ${frames}.` : `Plenty of tasks to fill the gaps: answer is just ${tasks.length}.`, [
      vars({ framed: frames, tasks: tasks.length, answer: res }),
      arr("frames (_ = slot for others or idle)", rows, { indexLabels: false }),
    ]);
    return res;
  },
});

export default defineProblem<Input>({
  description: "Given CPU tasks labeled with letters and a cooldown n, identical tasks must be at least n intervals apart. Each interval runs one task or idles. Return the minimum number of intervals to finish every task.",
  input: { default: 'tasks = ["A","A","A","B","B","B","C"], n = 2', parse: (a) => ({ tasks: a.strs("tasks"), n: a.int("n") }) },
  examples: [
    { input: 'tasks = ["A","A","A","B","B","B"], n = 2', output: 8 },
    { input: 'tasks = ["A","C","A","B","D","B"], n = 1', output: 6 },
    { input: 'tasks = ["A","A","A","B","B","B"], n = 3', output: 10 },
  ],
  solutions: [simulate, formula],
});

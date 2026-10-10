import { arr, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  target: number;
  position: number[];
  speed: number[];
}

const fmtT = (x: number) => String(Math.round(x * 100) / 100);

const sortStack = defineSolution<Input>({
  id: "sort-stack",
  name: "Sort by Position + Stack",
  time: "O(n log n)",
  space: "O(n)",
  idea: "Process cars from closest to the target backwards. A car whose arrival time is ≤ the fleet ahead of it catches up and joins that fleet; otherwise it leads a new fleet.",
  code: code(`
    function carFleet(target: number, position: number[], speed: number[]): number {
      const cars = position.map((p, i) => [p, (target - p) / speed[i]]).sort((a, b) => b[0] - a[0]); //@sort
      const stack: number[] = [];
      for (const [, time] of cars) { //@car
        stack.push(time); //@push
        if (stack.length >= 2 && stack.at(-1)! <= stack.at(-2)!) stack.pop(); //@merge
      }
      return stack.length; //@ret
    }
  `),
  run({ target, position, speed }, t) {
    const cars = position.map((p, i) => [p, (target - p) / speed[i]] as [number, number]).sort((a, b) => b[0] - a[0]);
    const labels = cars.map(([p, tm]) => `pos ${p} · ${fmtT(tm)}h`);
    t.step("sort", "Sort cars by position, closest to the target first. Each label shows its arrival time.", [arr("cars", labels)]);
    const stack: number[] = [];
    const view = (i: number, merged = false) => [
      vars({ target, fleets: stack.length }),
      arr("cars", labels, { tones: tones([i, merged ? "muted" : "active"]), pointers: { car: i } }),
      arr("fleet arrival times", stack.map(fmtT), { indexLabels: false, tones: tones([stack.length - 1, merged ? "success" : "compare"]) }),
    ];
    cars.forEach(([p, time], i) => {
      t.step("car", `Car at ${p} arrives at ${fmtT(time)}h if unblocked.`, view(i));
      stack.push(time);
      t.step("push", "Tentatively start a new fleet.", view(i));
      if (stack.length >= 2 && stack.at(-1)! <= stack.at(-2)!) {
        stack.pop();
        t.step("merge", `${fmtT(time)}h ≤ ${fmtT(stack.at(-1)!)}h: it catches the fleet ahead and joins it.`, view(i, true));
      }
    });
    t.step("ret", `${stack.length} fleets arrive.`, view(-1));
    return stack.length;
  },
});

const sortCount = defineSolution<Input>({
  id: "sort-count",
  name: "Sort + Slowest-Ahead Counter",
  time: "O(n log n)",
  space: "O(n)",
  idea: "The stack only ever needs its top. Walk from the front car back, tracking the slowest arrival time ahead; a car that would arrive later than that starts a new fleet.",
  code: code(`
    function carFleet(target: number, position: number[], speed: number[]): number {
      const order = position.map((_, i) => i).sort((a, b) => position[b] - position[a]); //@sort
      let fleets = 0, lead = 0;
      for (const i of order) {
        const time = (target - position[i]) / speed[i]; //@time
        if (time > lead) { fleets++; lead = time; } //@new
      }
      return fleets; //@ret
    }
  `),
  run({ target, position, speed }, t) {
    const order = position.map((_, i) => i).sort((a, b) => position[b] - position[a]);
    const times = order.map((i) => (target - position[i]) / speed[i]);
    const labels = order.map((i, k) => `pos ${position[i]} · ${fmtT(times[k])}h`);
    let fleets = 0,
      lead = 0;
    const view = (k: number, tone: "active" | "success" | "muted" = "active") => [
      vars({ fleets, "lead arrival": fmtT(lead) }),
      arr("cars (front first)", labels, { tones: tones([k, tone]), pointers: { car: k } }),
    ];
    t.step("sort", "Sort cars front to back.", view(-1));
    order.forEach((_, k) => {
      const time = times[k];
      t.step("time", `Arrives at ${fmtT(time)}h alone.`, view(k));
      if (time > lead) {
        fleets++;
        lead = time;
        t.step("new", `Slower than the fleet ahead: new fleet #${fleets}.`, view(k, "success"));
      } else t.step("new", `Catches the fleet ahead (${fmtT(lead)}h) and merges.`, view(k, "muted"));
    });
    t.step("ret", `Return ${fleets}.`, view(-1));
    return fleets;
  },
});

export default defineProblem<Input>({
  description: "n cars drive to the same target on a one-lane road. A faster car that catches a slower one ahead slows down and they become a fleet. Given each car's position and speed, return how many fleets arrive at the target.",
  input: { default: "target = 12, position = [10,8,0,5,3], speed = [2,4,1,1,3]", parse: (a) => ({ target: a.int("target"), position: a.ints("position"), speed: a.ints("speed") }) },
  examples: [
    { input: "target = 12, position = [10,8,0,5,3], speed = [2,4,1,1,3]", output: 3 },
    { input: "target = 10, position = [3], speed = [3]", output: 1 },
    { input: "target = 100, position = [0,2,4], speed = [4,2,1]", output: 1 },
  ],
  solutions: [sortStack, sortCount],
});

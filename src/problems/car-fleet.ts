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
  approach: [
    {
      title: "Sort from the front",
      detail: "Cars can't pass each other, so a car's fate depends only on the cars ahead of it. Process from the car closest to the target backward, computing each car's solo arrival time.",
      at: "sort",
    },
    {
      title: "Tentatively a new fleet",
      detail: "Push this car's arrival time.",
      at: "push",
    },
    {
      title: "Catch up and merge",
      detail: "If it would arrive no later than the fleet ahead, it catches that fleet before the target and moves at its speed. Pop it, since it adds no new fleet.",
      at: "merge",
    },
    {
      title: "Count",
      detail: "The stack holds one arrival time per fleet.",
      at: "ret",
    },
  ],
  code: code(`
    function carFleet(target: number, position: number[], speed: number[]): number {
      const cars = position.map((pos, i) => ({
        position: pos,
        arrivalTime: (target - pos) / speed[i],
      }));
      cars.sort((a, b) => b.position - a.position); // closest to target first //@sort
      const fleetTimes: number[] = [];
      for (const car of cars) { //@car
        fleetTimes.push(car.arrivalTime); //@push
        const count = fleetTimes.length;
        // A car that would arrive no later than the fleet ahead catches it and joins it.
        if (count >= 2 && fleetTimes[count - 1] <= fleetTimes[count - 2]) { //@merge
          fleetTimes.pop();
        }
      }
      return fleetTimes.length; //@ret
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
  approach: [
    {
      title: "Sort front to back",
      detail: "Same ordering as the stack approach.",
      at: "sort",
    },
    {
      title: "Arrival time",
      detail: "(target − position) / speed if nothing blocked the car.",
      at: "time",
    },
    {
      title: "Slower than the fleet ahead",
      detail: "If it would arrive later than the lead fleet, it never catches up, so it starts a new fleet and becomes the new lead.",
      at: "new",
    },
    {
      title: "Count",
      detail: "Only the top of the stack was ever used, so one variable is enough.",
      at: "ret",
    },
  ],
  code: code(`
    function carFleet(target: number, position: number[], speed: number[]): number {
      const carIndices = position.map((_, i) => i);
      carIndices.sort((a, b) => position[b] - position[a]); // closest to target first //@sort
      let fleets = 0;
      let leadArrival = 0; // arrival time of the fleet just ahead
      for (const i of carIndices) {
        const time = (target - position[i]) / speed[i]; //@time
        if (time > leadArrival) { //@new
          fleets++;
          leadArrival = time;
        }
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
      vars({ fleets, leadArrival: fmtT(lead) }),
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

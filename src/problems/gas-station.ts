import { arr, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  gas: number[];
  cost: number[];
}

const simulate = defineSolution<Input>({
  id: "simulate",
  name: "Try Every Start",
  time: "O(n²)",
  space: "O(1)",
  idea: "From each starting station, drive around the circle and stop as soon as the tank would go negative.",
  approach: [
    {
      title: "Try each start",
      detail: "Drive around the full circle.",
      at: "start",
    },
    {
      title: "Track the tank",
      detail: "Add gas[i] − cost[i] at each station.",
      at: "drive",
    },
    {
      title: "Fail when negative",
      detail: "Ran out before the next station.",
      at: "fail",
    },
    {
      title: "First full loop",
      detail: "O(n²).",
      at: "ret",
    },
  ],
  code: code(`
    function canCompleteCircuit(gas: number[], cost: number[]): number {
      const n = gas.length;
      for (let start = 0; start < n; start++) { //@start
        let tank = 0;
        let madeIt = true;
        for (let step = 0; step < n; step++) {
          const station = (start + step) % n;
          tank += gas[station] - cost[station]; //@drive
          if (tank < 0) { //@fail
            madeIt = false;
            break;
          }
        }
        if (madeIt) return start; //@ret
      }
      return -1; //@none
    }
  `),
  run({ gas, cost }, t) {
    const n = gas.length;
    const net = gas.map((g, i) => g - cost[i]);
    for (let s = 0; s < n; s++) {
      let tank = 0,
        k = 0;
      t.step("start", `Start at station ${s}.`, [vars({ tank }), arr("gas − cost", net, { tones: tones([s, "active"]), pointers: { start: s } })]);
      for (; k < n; k++) {
        const i = (s + k) % n;
        tank += net[i];
        const view = [vars({ tank }), arr("gas − cost", net, { tones: tones([s, "compare"], [i, tank < 0 ? "danger" : "active"]), pointers: { start: s, at: i } })];
        if (tank < 0) {
          t.step("fail", `Tank goes to ${tank} after station ${i}. Fail.`, view);
          break;
        }
        t.step("drive", `Leave station ${i} with ${tank}.`, view);
      }
      if (k === n) {
        t.step("ret", `Made the full loop from ${s}.`, [arr("gas − cost", net, { tones: tones([s, "success"]) })]);
        return s;
      }
    }
    t.step("none", "No start works: -1.");
    return -1;
  },
});

const greedy = defineSolution<Input>({
  id: "greedy",
  name: "One-pass Greedy",
  time: "O(n)",
  space: "O(1)",
  idea: "If total gas < total cost, no start works. Otherwise, whenever the running tank goes negative at i, no start in [start, i] can work either, so restart at i + 1.",
  approach: [
    {
      title: "Running totals",
      detail: "total tells whether any solution exists. tank measures the trip from the current candidate start.",
      at: "init",
    },
    {
      title: "Accumulate",
      detail: "Add each station's net gain.",
      at: "add",
    },
    {
      title: "Reset on empty",
      detail: "If the tank drops below 0 at i, no start between the candidate and i can work: each of them arrives at i with no more gas. Try i + 1.",
      at: "reset",
    },
    {
      title: "Answer",
      detail: "If total ≥ 0, the last candidate works. O(n).",
      at: "ret",
    },
  ],
  code: code(`
    function canCompleteCircuit(gas: number[], cost: number[]): number {
      let total = 0; // gas left after the whole loop //@init
      let tank = 0;  // gas left since the current start
      let start = 0;
      for (let i = 0; i < gas.length; i++) {
        const gain = gas[i] - cost[i];
        total += gain; //@add
        tank += gain;
        if (tank < 0) { //@reset
          // We can't reach i + 1 from start, so no station up to i works. Try i + 1.
          start = i + 1;
          tank = 0;
        }
      }
      return total < 0 ? -1 : start; //@ret
    }
  `),
  run({ gas, cost }, t) {
    const net = gas.map((g, i) => g - cost[i]);
    let total = 0,
      tank = 0,
      start = 0;
    const view = (i?: number, bad = false) => [
      vars({ total, tank, start }),
      arr("gas − cost", net, { window: i !== undefined && start <= i ? [start, i] : null, tones: tones([i, bad ? "danger" : "active"]), pointers: { i, start: start < net.length ? start : null } }),
    ];
    t.step("init", "Scan once, keeping a running tank from the candidate start.", view());
    for (let i = 0; i < net.length; i++) {
      total += net[i];
      tank += net[i];
      t.step("add", `Station ${i}: ${net[i] >= 0 ? "+" : ""}${net[i]}. tank = ${tank}.`, view(i, tank < 0));
      if (tank < 0) {
        start = i + 1;
        tank = 0;
        t.step("reset", `Ran dry. No start up to ${i} works; try ${start}.`, view(i, true));
      }
    }
    const res = total < 0 ? -1 : start;
    t.step("ret", total < 0 ? `Total ${total} < 0: impossible.` : `Total ${total} ≥ 0, so start ${start} works.`, view());
    return res;
  },
});

export default defineProblem<Input>({
  description: "There are n gas stations in a circle; station i has gas[i] and driving to station i+1 costs cost[i]. Starting with an empty tank, return the station index from which you can drive around once clockwise, or -1. The answer is unique if it exists.",
  input: { default: "gas = [1,2,3,4,5], cost = [3,4,5,1,2]", parse: (a) => ({ gas: a.ints("gas"), cost: a.ints("cost") }) },
  examples: [
    { input: "gas = [1,2,3,4,5], cost = [3,4,5,1,2]", output: 3 },
    { input: "gas = [2,3,4], cost = [3,4,3]", output: -1 },
    { input: "gas = [5,1,2,3,4], cost = [4,4,1,5,1]", output: 4 },
  ],
  solutions: [simulate, greedy],
});

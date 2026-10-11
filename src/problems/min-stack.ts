import { arr, tones, vars } from "@/core/panels";
import { parseOps } from "@/core/input";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  ops: string[];
  args: number[][];
}

type Out = number | null;
const fmtOut = (out: Out[]) => out.map((o) => (o === null ? "null" : String(o)));

const pairs = defineSolution<Input>({
  id: "value-min-pairs",
  name: "Stack of (value, min) Pairs",
  time: "O(1) per op",
  space: "O(n)",
  idea: "Store each value together with the minimum of the stack at the moment it was pushed. The top pair always knows the current minimum.",
  approach: [
    {
      title: "Store the min with each value",
      detail: "Each entry records the stack's minimum at the moment it was pushed.",
      at: "ctor",
    },
    {
      title: "Push computes min(val, minBelow)",
      detail: "The minimum only depends on what is below.",
      at: "push",
      nth: 3,
    },
    {
      title: "Pop needs no bookkeeping",
      detail: "The entry below already knows its own minimum.",
      at: "pop",
    },
    {
      title: "getMin reads the top pair",
      detail: "O(1) for every operation.",
      at: "min",
    },
  ],
  code: code(`
    class MinStack {
      // Each entry stores [value, smallest value at or below it].
      stack: [number, number][] = []; //@ctor

      push(val: number): void {
        const minBelow = this.stack.length > 0 ? this.stack[this.stack.length - 1][1] : val;
        this.stack.push([val, Math.min(val, minBelow)]); //@push
      }

      pop(): void {
        this.stack.pop(); //@pop
      }

      top(): number {
        return this.stack[this.stack.length - 1][0]; //@top
      }

      getMin(): number {
        return this.stack[this.stack.length - 1][1]; //@min
      }
    }
  `),
  run({ ops, args }, t) {
    const s: [number, number][] = [],
      out: Out[] = [];
    const view = (op: string) => [
      vars({ op }),
      arr("stack (value | min so far)", s.map(([v, m]) => `${v} | ${m}`), { tones: tones([s.length - 1, "active"]), indexLabels: false }),
      arr("output", fmtOut(out), { indexLabels: false }),
    ];
    ops.forEach((op, k) => {
      const label = `${op}(${args[k].join(",")})`;
      if (op === "MinStack") {
        out.push(null);
        t.step("ctor", "Empty stack.", view(label));
      } else if (op === "push") {
        const val = args[k][0];
        const min = s.length ? Math.min(val, s.at(-1)![1]) : val;
        s.push([val, min]);
        out.push(null);
        t.step("push", `Push ${val}; the min at this level is ${min}.`, view(label));
      } else if (op === "pop") {
        const [v] = s.pop()!;
        out.push(null);
        t.step("pop", `Pop ${v}. The pair below already knows its own min.`, view(label));
      } else if (op === "top") {
        out.push(s.at(-1)![0]);
        t.step("top", `Top is ${out.at(-1)}.`, view(label));
      } else {
        out.push(s.at(-1)![1]);
        t.step("min", `Min is ${out.at(-1)}.`, view(label));
      }
    });
    return out;
  },
});

const twoStacks = defineSolution<Input>({
  id: "two-stacks",
  name: "Main Stack + Min Stack",
  time: "O(1) per op",
  space: "O(n)",
  idea: "Push onto a second stack only when the value is ≤ the current min. Popping a value equal to that min pops it there too.",
  approach: [
    {
      title: "Main stack and min stack",
      detail: "The top of mins is always the current minimum.",
      at: "ctor",
    },
    {
      title: "Push onto mins on a new min",
      detail: "Use ≤ rather than <, so duplicate minimums are tracked and popping one doesn't lose the other.",
      at: "push-min",
    },
    {
      title: "Pop in sync",
      detail: "If the popped value equals mins' top, pop mins too.",
      at: "pop",
    },
    {
      title: "getMin is O(1)",
      detail: "Just read the top of mins.",
      at: "min",
    },
  ],
  code: code(`
    class MinStack {
      stack: number[] = []; //@ctor
      mins: number[] = []; // top is always the current minimum

      push(val: number): void {
        this.stack.push(val); //@push
        const currentMin = this.mins[this.mins.length - 1];
        if (this.mins.length === 0 || val <= currentMin) this.mins.push(val); //@push-min
      }

      pop(): void {
        const removed = this.stack.pop(); //@pop
        if (removed === this.mins[this.mins.length - 1]) this.mins.pop();
      }

      top(): number {
        return this.stack[this.stack.length - 1]; //@top
      }

      getMin(): number {
        return this.mins[this.mins.length - 1]; //@min
      }
    }
  `),
  run({ ops, args }, t) {
    const s: number[] = [],
      mins: number[] = [],
      out: Out[] = [];
    const view = (op: string, hiMin = false) => [
      vars({ op }),
      arr("stack", s, { tones: tones([s.length - 1, "active"]), indexLabels: false }),
      arr("mins", mins, { tones: tones([mins.length - 1, hiMin ? "success" : "compare"]), indexLabels: false }),
      arr("output", fmtOut(out), { indexLabels: false }),
    ];
    ops.forEach((op, k) => {
      const label = `${op}(${args[k].join(",")})`;
      if (op === "MinStack") {
        out.push(null);
        t.step("ctor", "Two empty stacks.", view(label));
      } else if (op === "push") {
        const val = args[k][0];
        s.push(val);
        out.push(null);
        t.step("push", `Push ${val}.`, view(label));
        if (!mins.length || val <= mins.at(-1)!) {
          mins.push(val);
          t.step("push-min", `${val} is a new minimum: push it onto mins too.`, view(label, true));
        }
      } else if (op === "pop") {
        const v = s.pop();
        out.push(null);
        if (v === mins.at(-1)) {
          mins.pop();
          t.step("pop", `Pop ${v}. It was the min, so pop mins as well.`, view(label));
        } else t.step("pop", `Pop ${v}. mins is unchanged.`, view(label));
      } else if (op === "top") {
        out.push(s.at(-1)!);
        t.step("top", `Top is ${out.at(-1)}.`, view(label));
      } else {
        out.push(mins.at(-1)!);
        t.step("min", `Min is ${out.at(-1)}.`, view(label, true));
      }
    });
    return out;
  },
});

export default defineProblem<Input>({
  description: "Design a stack that supports push, pop, top and retrieving the minimum element, all in constant time. Input is a LeetCode-style list of operations.",
  input: {
    default: 'ops = ["MinStack","push","push","push","getMin","pop","top","getMin","push","getMin"], args = [[],[-2],[0],[-3],[],[],[],[],[-5],[]]',
    parse: (a) => parseOps<number>(a),
  },
  examples: [
    { input: 'ops = ["MinStack","push","push","push","getMin","pop","top","getMin"], args = [[],[-2],[0],[-3],[],[],[],[]]', output: [null, null, null, null, -3, null, 0, -2] },
    { input: 'ops = ["MinStack","push","push","push","getMin","pop","getMin"], args = [[],[1],[1],[2],[],[],[]]', output: [null, null, null, null, 1, null, 1] },
  ],
  solutions: [twoStacks, pairs],
});

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
  code: code(`
    class MinStack {
      s: [number, number][] = []; //@ctor
      push(val: number): void {
        const min = this.s.length ? Math.min(val, this.s.at(-1)![1]) : val;
        this.s.push([val, min]); //@push
      }
      pop(): void { this.s.pop(); } //@pop
      top(): number { return this.s.at(-1)![0]; } //@top
      getMin(): number { return this.s.at(-1)![1]; } //@min
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
  code: code(`
    class MinStack {
      s: number[] = []; mins: number[] = []; //@ctor
      push(val: number): void {
        this.s.push(val); //@push
        if (!this.mins.length || val <= this.mins.at(-1)!) this.mins.push(val); //@push-min
      }
      pop(): void {
        if (this.s.pop() === this.mins.at(-1)) this.mins.pop(); //@pop
      }
      top(): number { return this.s.at(-1)!; } //@top
      getMin(): number { return this.mins.at(-1)!; } //@min
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

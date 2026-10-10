import { arr, tones, vars } from "@/core/panels";
import { parseOps } from "@/core/input";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  ops: string[];
  args: number[][];
}

type Out = number | boolean | null;

const fmtOut = (out: Out[]) => out.map((o) => (o === null ? "null" : String(o)));

const pushHeavy = defineSolution<Input>({
  id: "push-heavy",
  name: "Costly Push (Keep Oldest on Top)",
  time: "push O(n), others O(1)",
  space: "O(n)",
  idea: "Keep the oldest element on top of the main stack. To push, move everything to a helper stack, push the new value, then move everything back.",
  code: code(`
    class MyQueue {
      s: number[] = []; tmp: number[] = []; //@ctor
      push(x: number): void {
        while (this.s.length) this.tmp.push(this.s.pop()!); //@unload
        this.s.push(x); //@push
        while (this.tmp.length) this.s.push(this.tmp.pop()!); //@reload
      }
      pop(): number { return this.s.pop()!; } //@pop
      peek(): number { return this.s.at(-1)!; } //@peek
      empty(): boolean { return this.s.length === 0; } //@empty
    }
  `),
  run({ ops, args }, t) {
    const s: number[] = [],
      tmp: number[] = [],
      out: Out[] = [];
    const view = (op: string, hi?: "s" | "tmp") => [
      vars({ op }),
      arr("s (top = right = front of queue)", s, { tones: tones([hi === "s" ? s.length - 1 : null, "active"]), indexLabels: false }),
      arr("tmp", tmp, { tones: tones([hi === "tmp" ? tmp.length - 1 : null, "active"]), indexLabels: false }),
      arr("output", fmtOut(out), { indexLabels: false }),
    ];
    ops.forEach((op, k) => {
      const label = `${op}(${args[k].join(",")})`;
      if (op === "MyQueue") {
        out.push(null);
        t.step("ctor", "Create two empty stacks.", view(label));
      } else if (op === "push") {
        const x = args[k][0];
        while (s.length) {
          tmp.push(s.pop()!);
          t.step("unload", `Move ${tmp.at(-1)} to tmp.`, view(label, "tmp"));
        }
        s.push(x);
        t.step("push", `Push ${x}; it is now at the bottom (back of the queue).`, view(label, "s"));
        while (tmp.length) {
          s.push(tmp.pop()!);
          t.step("reload", `Move ${s.at(-1)} back onto s.`, view(label, "s"));
        }
        out.push(null);
      } else if (op === "pop") {
        out.push(s.pop()!);
        t.step("pop", `Pop the top: ${out.at(-1)}.`, view(label));
      } else if (op === "peek") {
        out.push(s.at(-1)!);
        t.step("peek", `Front is ${out.at(-1)}.`, view(label, "s"));
      } else {
        out.push(s.length === 0);
        t.step("empty", `empty() = ${out.at(-1)}.`, view(label));
      }
    });
    return out;
  },
});

const amortized = defineSolution<Input>({
  id: "two-stacks-amortized",
  name: "Two Stacks (Amortized O(1))",
  time: "O(1) amortized",
  space: "O(n)",
  idea: "Push onto an inbox stack. When you need the front and the outbox is empty, pour the whole inbox into the outbox, which reverses the order. Each element moves at most once.",
  code: code(`
    class MyQueue {
      inbox: number[] = []; outbox: number[] = []; //@ctor
      push(x: number): void { this.inbox.push(x); } //@push
      private shift(): void {
        if (!this.outbox.length) //@check
          while (this.inbox.length) this.outbox.push(this.inbox.pop()!); //@pour
      }
      pop(): number { this.shift(); return this.outbox.pop()!; } //@pop
      peek(): number { this.shift(); return this.outbox.at(-1)!; } //@peek
      empty(): boolean { return !this.inbox.length && !this.outbox.length; } //@empty
    }
  `),
  run({ ops, args }, t) {
    const inbox: number[] = [],
      outbox: number[] = [],
      out: Out[] = [];
    const view = (op: string, hi?: "in" | "out") => [
      vars({ op }),
      arr("inbox (top = right)", inbox, { tones: tones([hi === "in" ? inbox.length - 1 : null, "active"]), indexLabels: false }),
      arr("outbox (top = right = front)", outbox, { tones: tones([hi === "out" ? outbox.length - 1 : null, "active"]), indexLabels: false }),
      arr("output", fmtOut(out), { indexLabels: false }),
    ];
    const shift = (label: string) => {
      if (outbox.length) {
        t.step("check", "outbox is not empty: its top is the front.", view(label, "out"));
        return;
      }
      t.step("check", "outbox is empty. Pour inbox into it.", view(label));
      while (inbox.length) {
        outbox.push(inbox.pop()!);
        t.step("pour", `Move ${outbox.at(-1)} to outbox.`, view(label, "out"));
      }
    };
    ops.forEach((op, k) => {
      const label = `${op}(${args[k].join(",")})`;
      if (op === "MyQueue") {
        out.push(null);
        t.step("ctor", "Create inbox and outbox.", view(label));
      } else if (op === "push") {
        inbox.push(args[k][0]);
        out.push(null);
        t.step("push", `Push ${args[k][0]} onto inbox.`, view(label, "in"));
      } else if (op === "pop") {
        shift(label);
        out.push(outbox.pop()!);
        t.step("pop", `Pop ${out.at(-1)} from outbox.`, view(label));
      } else if (op === "peek") {
        shift(label);
        out.push(outbox.at(-1)!);
        t.step("peek", `Front is ${out.at(-1)}.`, view(label, "out"));
      } else {
        out.push(!inbox.length && !outbox.length);
        t.step("empty", `empty() = ${out.at(-1)}.`, view(label));
      }
    });
    return out;
  },
});

export default defineProblem<Input>({
  description: "Implement a first-in-first-out queue using only two stacks, supporting push, pop, peek and empty. Input is a LeetCode-style list of operations.",
  input: {
    default: 'ops = ["MyQueue","push","push","push","peek","pop","push","pop","pop","empty","pop","empty"], args = [[],[1],[2],[3],[],[],[4],[],[],[],[],[]]',
    parse: (a) => parseOps<number>(a),
  },
  examples: [
    { input: 'ops = ["MyQueue","push","push","peek","pop","empty"], args = [[],[1],[2],[],[],[]]', output: [null, null, null, 1, 1, false] },
    { input: 'ops = ["MyQueue","push","pop","empty","push","push","pop","peek"], args = [[],[5],[],[],[6],[7],[],[]]', output: [null, null, 5, true, null, null, 6, 7] },
  ],
  solutions: [pushHeavy, amortized],
});

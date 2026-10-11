import { arr, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  n: number;
}

const next = (n: number) => [...String(n)].reduce((s, d) => s + Number(d) ** 2, 0);
const explain = (n: number) => `${[...String(n)].map((d) => `${d}²`).join(" + ")} = ${next(n)}`;

const hashSet = defineSolution<Input>({
  id: "hash-set",
  name: "Remember Seen Numbers",
  time: "O(log n)",
  space: "O(log n)",
  idea: "Keep replacing n by the sum of the squares of its digits. Either it reaches 1, or it repeats a number and loops forever; a set detects the repeat.",
  approach: [
    {
      title: "Track seen numbers",
      detail: "The sequence either reaches 1 or enters a cycle.",
      at: "init",
    },
    {
      title: "Check",
      detail: "Stop if we hit 1 or a repeat.",
      at: "check",
    },
    {
      title: "Next",
      detail: "Sum of the squares of the digits.",
      at: "next",
    },
    {
      title: "Happy if 1",
      detail: "A repeat without 1 means an endless loop.",
      at: "ret",
    },
  ],
  code: code(`
    function isHappy(n: number): boolean {
      const seen = new Set<number>(); //@init
      while (n !== 1 && !seen.has(n)) { //@check
        seen.add(n);
        n = sumOfSquaredDigits(n); //@next
      }
      return n === 1; //@ret
    }

    function sumOfSquaredDigits(num: number): number {
      let sum = 0;
      while (num > 0) {
        const digit = num % 10;
        sum += digit * digit;
        num = Math.floor(num / 10);
      }
      return sum;
    }
  `),
  run({ n }, t) {
    const seen: number[] = [];
    const view = (hi?: number) => [vars({ n }), arr("seen", seen, { indexLabels: false, tones: hi !== undefined ? { [hi]: "danger" } : {} })];
    t.step("init", `Start with ${n}.`, view());
    while (n !== 1 && !seen.includes(n)) {
      t.step("check", `${n} is new.`, view());
      seen.push(n);
      const e = explain(n);
      n = next(n);
      t.step("next", e, view());
    }
    const ok = n === 1;
    t.step("ret", ok ? "Reached 1: happy." : `${n} repeats: stuck in a loop.`, view(ok ? undefined : seen.indexOf(n)));
    return ok;
  },
});

const floyd = defineSolution<Input>({
  id: "floyd",
  name: "Floyd's Cycle Detection",
  time: "O(log n)",
  space: "O(1)",
  idea: "The sequence is a linked list of numbers. Move slow one step and fast two steps; they meet inside the cycle. The number is happy exactly when that cycle is 1 → 1.",
  approach: [
    {
      title: "Slow and fast",
      detail: "Treat the sequence as a linked list.",
      at: "init",
    },
    {
      title: "Advance",
      detail: "slow takes 1 step and fast takes 2.",
      at: "move",
    },
    {
      title: "Meet or reach 1",
      detail: "In a cycle they must meet. Reaching 1 (which maps to itself) means happy.",
      at: "check",
      nth: 2,
    },
    {
      title: "Answer",
      detail: "O(1) extra space.",
      at: "ret",
    },
  ],
  code: code(`
    function isHappy(n: number): boolean {
      let slow = n; //@init
      let fast = sumOfSquaredDigits(n);
      // fast moves two steps for every one step of slow. They meet only if there is a loop.
      while (fast !== 1 && slow !== fast) { //@check
        slow = sumOfSquaredDigits(slow); //@move
        fast = sumOfSquaredDigits(sumOfSquaredDigits(fast));
      }
      return fast === 1; //@ret
    }

    function sumOfSquaredDigits(num: number): number {
      let sum = 0;
      while (num > 0) {
        const digit = num % 10;
        sum += digit * digit;
        num = Math.floor(num / 10);
      }
      return sum;
    }
  `),
  run({ n }, t) {
    // The whole sequence up to its first repeat (or 1), for display.
    const trail = [n];
    while (trail.at(-1) !== 1 && trail.indexOf(trail.at(-1)!) === trail.length - 1) trail.push(next(trail.at(-1)!));
    let slow = n,
      fast = next(n);
    const view = () => [vars({ slow, fast }), arr("sequence", trail, { indexLabels: false, tones: { [trail.indexOf(slow)]: "active", [trail.indexOf(fast)]: "compare" } })];
    t.step("init", `slow = ${slow}, fast = ${fast}.`, view());
    while (fast !== 1 && slow !== fast) {
      t.step("check", "Not 1 and not met yet.", view());
      slow = next(slow);
      fast = next(next(fast));
      t.step("move", `slow → ${slow}, fast → ${fast}.`, view());
    }
    const ok = fast === 1;
    t.step("ret", ok ? "fast reached 1: happy." : `They met at ${slow}: a cycle without 1.`, view());
    return ok;
  },
});

export default defineProblem<Input>({
  description: "A number is happy if repeatedly replacing it with the sum of the squares of its digits eventually reaches 1. Otherwise it loops forever in a cycle without 1. Return whether n is happy.",
  input: { default: "n = 19", parse: (a) => ({ n: a.int("n") }) },
  examples: [
    { input: "n = 19", output: true },
    { input: "n = 2", output: false },
    { input: "n = 7", output: true },
  ],
  solutions: [hashSet, floyd],
});

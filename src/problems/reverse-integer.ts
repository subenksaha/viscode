import { arr, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  x: number;
}

const MAX = 2 ** 31 - 1;
const MIN = -(2 ** 31);

const viaString = defineSolution<Input>({
  id: "string",
  name: "Reverse the Digit String",
  time: "O(log |x|)",
  space: "O(log |x|)",
  idea: "Reverse the digits of |x| as a string, reapply the sign, and return 0 if the result leaves the 32-bit range.",
  code: code(`
    function reverse(x: number): number {
      const digits = String(Math.abs(x)).split("").reverse(); //@split
      const reversed = Math.sign(x) * Number(digits.join("")); //@join
      const MIN = -(2 ** 31);
      const MAX = 2 ** 31 - 1;
      return reversed < MIN || reversed > MAX ? 0 : reversed; //@ret
    }
  `),
  run({ x }, t) {
    const digits = String(Math.abs(x)).split("");
    t.step("split", `Digits of |x|: ${digits.join("")}.`, [arr("digits", digits)]);
    digits.reverse();
    const r = (Math.sign(x) || 1) * Number(digits.join(""));
    t.step("join", `Reversed with sign: ${r}.`, [arr("digits", digits), vars({ reversed: r })]);
    const res = r < MIN || r > MAX ? 0 : r;
    t.step("ret", res === r ? `${r} fits in 32 bits.` : `${r} overflows 32 bits: return 0.`, [vars({ result: res })]);
    return res;
  },
});

const popPush = defineSolution<Input>({
  id: "pop-push",
  name: "Pop and Push Digits with Overflow Check",
  time: "O(log |x|)",
  space: "O(1)",
  idea: "Pop the last digit with % 10 and push it onto the result with ×10 +. Before pushing, check that the result can grow by one more digit without leaving the 32-bit range.",
  code: code(`
    function reverse(x: number): number {
      const MAX_BEFORE_PUSH = Math.trunc((2 ** 31 - 1) / 10);
      const MIN_BEFORE_PUSH = Math.trunc(-(2 ** 31) / 10);
      let reversed = 0; //@init
      while (x !== 0) {
        const lastDigit = x % 10; //@pop
        x = Math.trunc(x / 10);
        // Multiplying by 10 would leave the 32-bit range.
        if (reversed > MAX_BEFORE_PUSH || reversed < MIN_BEFORE_PUSH) return 0; //@overflow
        reversed = reversed * 10 + lastDigit; //@push
      }
      return reversed; //@ret
    }
  `),
  run({ x }, t) {
    let r = 0;
    const view = (d?: number) => [vars({ x, lastDigit: d, reversed: r })];
    t.step("init", "r = 0.", view());
    while (x !== 0) {
      const d = x % 10;
      x = Math.trunc(x / 10);
      t.step("pop", `Pop digit ${d}; x is now ${x}.`, view(d));
      if (r > Math.trunc(MAX / 10) || r < Math.trunc(MIN / 10)) {
        t.step("overflow", `${r} × 10 would overflow 32 bits: return 0.`, view(d));
        return 0;
      }
      r = r * 10 + d;
      t.step("push", `r = r × 10 + ${d} = ${r}.`, view(d));
    }
    t.step("ret", `Return ${r}.`, view());
    return r;
  },
});

export default defineProblem<Input>({
  description: "Given a signed 32-bit integer x, return x with its digits reversed. If the reversed value falls outside the signed 32-bit range, return 0.",
  input: { default: "x = -1230", parse: (a) => ({ x: a.int("x") }) },
  examples: [
    { input: "x = 123", output: 321 },
    { input: "x = -123", output: -321 },
    { input: "x = 120", output: 21 },
    { input: "x = 1534236469", output: 0 },
  ],
  solutions: [viaString, popPush],
});

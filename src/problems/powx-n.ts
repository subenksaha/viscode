import { bits, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  x: number;
  n: number;
}

const fmtN = (v: number) => String(Math.round(v * 1e6) / 1e6);
/** Beyond this many multiplications the linear loop isn't worth animating. */
const LINEAR_LIMIT = 100_000;

const linear = defineSolution<Input>({
  id: "repeated-multiplication",
  name: "Multiply |n| Times",
  time: "O(|n|)",
  space: "O(1)",
  idea: "Multiply x into the result |n| times; for negative n, invert x first.",
  code: code(`
    function myPow(x: number, n: number): number {
      if (n < 0) { //@neg
        x = 1 / x;
        n = -n;
      }
      let result = 1;
      for (let i = 0; i < n; i++) result *= x; //@mul
      return result; //@ret
    }
  `),
  run({ x, n }, t) {
    if (n < 0) {
      x = 1 / x;
      n = -n;
      t.step("neg", `Negative exponent: use x = 1/x = ${fmtN(x)}, n = ${n}.`, [vars({ x: fmtN(x), n })]);
    }
    if (n > LINEAR_LIMIT) {
      t.step("ret", `n = ${n} is too many multiplications to step through; this approach is too slow for it.`, [vars({ x: fmtN(x), n })]);
      return Math.pow(x, n);
    }
    let res = 1;
    for (let i = 0; i < n; i++) {
      res *= x;
      t.step("mul", `Multiply #${i + 1}: result = ${fmtN(res)}.`, [vars({ x: fmtN(x), i: i + 1, result: fmtN(res) })]);
    }
    t.step("ret", `Return ${fmtN(res)}.`, [vars({ result: fmtN(res) })]);
    return res;
  },
});

const fast = defineSolution<Input>({
  id: "binary-exponentiation",
  name: "Binary Exponentiation",
  time: "O(log |n|)",
  space: "O(1)",
  idea: "Write n in binary. Square x at every step; whenever the current bit of n is 1, multiply that power of x into the result. x^13 = x^8 · x^4 · x^1.",
  code: code(`
    function myPow(x: number, n: number): number {
      // Write the exponent in binary: x^13 = x^8 * x^4 * x^1.
      let exponent = Math.abs(n); //@init
      let result = 1;
      while (exponent > 0) {
        if (exponent % 2 === 1) result *= x; // this power of x is part of the answer //@bit
        x *= x; // x, x^2, x^4, x^8, ... //@square
        exponent = Math.floor(exponent / 2); //@shift
      }
      return n < 0 ? 1 / result : result; //@ret
    }
  `),
  run({ x, n }, t) {
    let e = Math.abs(n),
      res = 1,
      p = 0;
    const width = Math.max(1, Math.abs(n).toString(2).length);
    const view = (bitTone?: Tone) => [
      vars({ "x^(2^k)": fmtN(x), result: fmtN(res), k: p }),
      bits("|n| in binary", Math.abs(n) % 2 ** 30, Math.min(width, 30), bitTone && p < 30 ? { [p]: bitTone } : {}),
    ];
    t.step("init", `|n| = ${e} = ${e.toString(2)}₂.`, view());
    while (e > 0) {
      if (e & 1) {
        res *= x;
        t.step("bit", `Bit ${p} is 1: result *= ${fmtN(x)} → ${fmtN(res)}.`, view("success"));
      } else t.step("bit", `Bit ${p} is 0: skip.`, view("muted"));
      x *= x;
      t.step("square", `Square: x = ${fmtN(x)}.`, view());
      e = Math.floor(e / 2);
      p++;
    }
    const out = n < 0 ? 1 / res : res;
    t.step("ret", n < 0 ? `n is negative: 1 / ${fmtN(res)} = ${fmtN(out)}.` : `Return ${fmtN(out)}.`, view());
    return out;
  },
});

export default defineProblem<Input>({
  description: "Implement pow(x, n): x raised to the integer power n (n may be negative).",
  input: {
    default: "x = 2, n = 13",
    parse: (a) => {
      const x = a.get("x");
      if (typeof x !== "number") throw new Error('"x" must be a number');
      return { x, n: a.int("n") };
    },
  },
  examples: [
    { input: "x = 2.00000, n = 10", output: 1024 },
    { input: "x = 2.10000, n = 3", output: 9.261 },
    { input: "x = 2.00000, n = -2", output: 0.25 },
  ],
  normalize: (v) => Math.round((v as number) * 1e5) / 1e5,
  solutions: [linear, fast],
});

import { bitWidth, bits, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  a: number;
  b: number;
}

const xorCarry = defineSolution<Input>({
  id: "xor-carry",
  name: "XOR + Carry Loop",
  time: "O(32)",
  space: "O(1)",
  idea: "a ^ b adds without carrying; (a & b) << 1 is the carry. Repeat until there is no carry left.",
  code: code(`
    function getSum(a: number, b: number): number {
      while (b !== 0) { //@loop
        const carry = (a & b) << 1; //@carry
        a = a ^ b; //@xor
        b = carry; //@shift
      }
      return a; //@ret
    }
  `),
  run(input, t) {
    let { a, b } = input;
    const w = bitWidth(a, b, a + b);
    const view = (carry?: number) => [
      vars({ a, b, carry }),
      bits("a", a, w),
      bits("b", b, w),
      ...(carry !== undefined ? [bits("carry", carry, w)] : []),
    ];
    while (b !== 0) {
      t.step("loop", `b = ${b} ≠ 0, so there is still something to add.`, view());
      const carry = (a & b) << 1;
      t.step("carry", `carry = (a & b) << 1 = ${carry}: bits where both are 1, shifted left.`, view(carry));
      a = a ^ b;
      t.step("xor", `a = a ^ b = ${a}: the sum without carries.`, view(carry));
      b = carry;
      t.step("shift", `b = carry = ${b}.`, view());
    }
    t.step("ret", `No carry left. Return ${a}.`, view());
    return a;
  },
});

const fullAdder = defineSolution<Input>({
  id: "full-adder",
  name: "Bit-by-bit Full Adder",
  time: "O(32)",
  space: "O(1)",
  idea: "Add one bit position at a time like a hardware ripple-carry adder: sum bit = x ^ y ^ c, next carry = majority(x, y, c).",
  code: code(`
    function getSum(a: number, b: number): number {
      let res = 0, c = 0; //@init
      for (let i = 0; i < 32; i++) { //@loop
        const x = (a >>> i) & 1, y = (b >>> i) & 1; //@bits
        res |= (x ^ y ^ c) << i; //@sum
        c = (x & y) | (x & c) | (y & c); //@carry
      }
      return res; //@ret
    }
  `),
  run({ a, b }, t) {
    const w = bitWidth(a, b, a + b);
    let res = 0,
      c = 0;
    const view = (i?: number) => {
      const tone = i !== undefined ? { [i]: "active" as const } : {};
      return [vars({ i, carry: c, res }), bits("a", a, w, tone), bits("b", b, w, tone), bits("res", res, w, tone)];
    };
    t.step("init", "res = 0, carry = 0.", view());
    for (let i = 0; i < 32; i++) {
      // Above the display width every remaining bit is just sign extension.
      const show = i < w;
      if (show) t.step("loop", `Bit ${i}.`, view(i));
      const x = (a >>> i) & 1,
        y = (b >>> i) & 1;
      if (show) t.step("bits", `x = ${x}, y = ${y}, carry in = ${c}.`, view(i));
      res |= (x ^ y ^ c) << i;
      if (show) t.step("sum", `Sum bit = ${x} ^ ${y} ^ ${c} = ${x ^ y ^ c}.`, view(i));
      c = (x & y) | (x & c) | (y & c);
      if (show) t.step("carry", `Carry out = ${c}.`, view(i));
    }
    t.step("ret", `Return ${res}.`, view());
    return res;
  },
});

export default defineProblem<Input>({
  description: "Return the sum of integers a and b without using the + or − operators.",
  input: { default: "a = 5, b = 7", parse: (x) => ({ a: x.int("a"), b: x.int("b") }) },
  examples: [
    { input: "a = 1, b = 2", output: 3 },
    { input: "a = 2, b = 3", output: 5 },
    { input: "a = -12, b = 5", output: -7 },
  ],
  solutions: [fullAdder, xorCarry],
});

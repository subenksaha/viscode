import { bits, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  n: number;
}

const bitByBit = defineSolution<Input>({
  id: "bit-by-bit",
  name: "Bit by Bit",
  time: "O(32)",
  space: "O(1)",
  idea: "Pop the lowest bit of n and push it onto result from the right, 32 times.",
  code: code(`
    function reverseBits(n: number): number {
      let result = 0; //@init
      for (let i = 0; i < 32; i++) { //@loop
        const lowestBit = n & 1;
        result = (result << 1) | lowestBit; // make room on the right, then add the bit //@push
        n = n >>> 1; // drop the bit we just used //@pop
      }
      return result >>> 0; // read the 32 bits as an unsigned number //@ret
    }
  `),
  run(input, t) {
    let { n } = input;
    let res = 0;
    const view = (i?: number) => [
      vars({ i, n: n >>> 0, result: res >>> 0 }),
      bits("n", n, 32, { 0: "active" }),
      bits("res", res, 32, { 0: "success" }),
    ];
    t.step("init", "res = 0.", view());
    for (let i = 0; i < 32; i++) {
      t.step("loop", `Step ${i + 1} of 32. Lowest bit of n is ${n & 1}.`, view(i));
      res = (res << 1) | (n & 1);
      t.step("push", "Shift res left and append that bit.", view(i));
      n >>>= 1;
      t.step("pop", "Drop the bit from n.", view(i));
    }
    t.step("ret", `Return ${res >>> 0}.`, view());
    return res >>> 0;
  },
});

const masks = defineSolution<Input>({
  id: "divide-and-conquer",
  name: "Divide & Conquer Swaps",
  time: "O(1)",
  space: "O(1)",
  idea: "Swap the two 16-bit halves, then the 8-bit halves inside each, then 4, 2 and 1. Five mask-and-shift steps reverse all 32 bits.",
  code: code(`
    function reverseBits(n: number): number {
      // Swap halves, then swap halves inside each half, and so on down to single bits.
      n = (n >>> 16) | (n << 16); // swap the two 16-bit halves //@s16
      n = ((n & 0xff00ff00) >>> 8) | ((n & 0x00ff00ff) << 8); // swap neighboring bytes //@s8
      n = ((n & 0xf0f0f0f0) >>> 4) | ((n & 0x0f0f0f0f) << 4); // swap neighboring 4-bit groups //@s4
      n = ((n & 0xcccccccc) >>> 2) | ((n & 0x33333333) << 2); // swap neighboring 2-bit pairs //@s2
      n = ((n & 0xaaaaaaaa) >>> 1) | ((n & 0x55555555) << 1); // swap neighboring bits //@s1
      return n >>> 0; // read the 32 bits as an unsigned number //@ret
    }
  `),
  run(input, t) {
    let { n } = input;
    const view = () => [vars({ n: n >>> 0 }), bits("n", n, 32)];
    n = (n >>> 16) | (n << 16);
    t.step("s16", "Swap the 16-bit halves.", view());
    n = ((n & 0xff00ff00) >>> 8) | ((n & 0x00ff00ff) << 8);
    t.step("s8", "Swap bytes inside each half.", view());
    n = ((n & 0xf0f0f0f0) >>> 4) | ((n & 0x0f0f0f0f) << 4);
    t.step("s4", "Swap nibbles inside each byte.", view());
    n = ((n & 0xcccccccc) >>> 2) | ((n & 0x33333333) << 2);
    t.step("s2", "Swap bit pairs inside each nibble.", view());
    n = ((n & 0xaaaaaaaa) >>> 1) | ((n & 0x55555555) << 1);
    t.step("s1", "Swap adjacent bits.", view());
    t.step("ret", `Return ${n >>> 0}.`, view());
    return n >>> 0;
  },
});

export default defineProblem<Input>({
  description: "Reverse the bits of a 32-bit unsigned integer n and return the result as an unsigned integer.",
  input: { default: "n = 43261596", parse: (a) => ({ n: a.int("n") }) },
  examples: [
    { input: "n = 43261596", output: 964176192 },
    { input: "n = 4294967293", output: 3221225471 },
  ],
  solutions: [bitByBit, masks],
});

import { bitWidth, bits, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  n: number;
}

const checkEach = defineSolution<Input>({
  id: "check-each-bit",
  name: "Check Every Bit",
  time: "O(32)",
  space: "O(1)",
  idea: "Test the lowest bit, shift right, repeat until the number is 0.",
  approach: [
    {
      title: "Inspect the lowest bit",
      detail: "n & 1 is 1 exactly when the last bit is set. Add it to count.",
      at: "add",
    },
    {
      title: "Shift right",
      detail: "Unsigned shift >>> 1 drops that bit and brings the next one into the last position.",
      at: "shift",
    },
    {
      title: "Stop at zero",
      detail: "When n becomes 0 there are no set bits left. This runs once per bit up to the highest set bit.",
      at: "ret",
    },
  ],
  code: code(`
    function hammingWeight(n: number): number {
      let count = 0; //@init
      while (n !== 0) { //@loop
        const lastBit = n & 1; // 1 if the lowest bit is set
        count += lastBit; //@add
        n = n >>> 1; // shift right by one bit //@shift
      }
      return count; //@ret
    }
  `),
  run(input, t) {
    let { n } = input;
    const w = bitWidth(n);
    let count = 0;
    const view = (low = false) => [vars({ n, count }), bits("n", n, w, low ? { 0: n & 1 ? "success" : "compare" } : {})];
    t.step("init", "count = 0.", view());
    while (n !== 0) {
      t.step("loop", `n = ${n}.`, view(true));
      count += n & 1;
      t.step("add", `Lowest bit is ${n & 1}. count = ${count}.`, view(true));
      n >>>= 1;
      t.step("shift", "Shift right by one.", view());
    }
    t.step("ret", `Return ${count}.`, view());
    return count;
  },
});

const kernighan = defineSolution<Input>({
  id: "kernighan",
  name: "Brian Kernighan's Trick",
  time: "O(number of 1s)",
  space: "O(1)",
  idea: "n & (n − 1) clears the lowest set bit. Count how many times you can do that before n becomes 0.",
  approach: [
    {
      title: "Find the lowest set bit",
      detail: "Subtracting 1 flips the lowest 1 to 0 and turns all the 0s below it into 1s.",
      at: "loop",
    },
    {
      title: "Clear it with n & (n − 1)",
      detail: "ANDing n with n − 1 wipes exactly that lowest 1 and leaves the higher bits alone.",
      at: "clear",
    },
    {
      title: "Count each clear",
      detail: "Every iteration removes one set bit, so the loop runs as many times as there are 1s.",
      at: "count",
    },
    {
      title: "Done when n is 0",
      detail: "For sparse numbers this beats checking all 32 positions.",
      at: "ret",
    },
  ],
  code: code(`
    function hammingWeight(n: number): number {
      let count = 0; //@init
      while (n !== 0) { //@loop
        // n - 1 flips the lowest 1 bit (and the 0s below it), so n & (n - 1) clears that bit.
        n = n & (n - 1); //@clear
        count++; //@count
      }
      return count; //@ret
    }
  `),
  run(input, t) {
    let { n } = input;
    const w = bitWidth(n);
    let count = 0;
    const lowest = (x: number) => (x === 0 ? -1 : 31 - Math.clz32(x & -x));
    const view = (mark?: number) => [vars({ n, count }), bits("n", n, w, mark !== undefined && mark >= 0 ? { [mark]: "danger" } : {})];
    t.step("init", "count = 0.", view());
    while (n !== 0) {
      const p = lowest(n);
      t.step("loop", `Lowest set bit is at position ${p}.`, view(p));
      n &= n - 1;
      t.step("clear", `n & (n − 1) clears it: n = ${n}.`, view());
      count++;
      t.step("count", `count = ${count}.`, view());
    }
    t.step("ret", `Return ${count}.`, view());
    return count;
  },
});

export default defineProblem<Input>({
  description: "Return the number of set bits (1s) in the binary representation of the positive integer n.",
  input: { default: "n = 11", parse: (a) => ({ n: a.int("n") }) },
  examples: [
    { input: "n = 11", output: 3 },
    { input: "n = 128", output: 1 },
    { input: "n = 2147483645", output: 30 },
  ],
  solutions: [checkEach, kernighan],
});

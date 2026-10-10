import { arr, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  digits: number[];
}

const carry = defineSolution<Input>({
  id: "carry-loop",
  name: "Add with a Carry Variable",
  time: "O(n)",
  space: "O(n)",
  idea: "Add 1 to the last digit like on paper: write (d + carry) mod 10 and carry ⌊(d + carry) / 10⌋ leftwards. If a carry is left over, prepend it.",
  code: code(`
    function plusOne(digits: number[]): number[] {
      let carry = 1; //@init
      for (let i = digits.length - 1; i >= 0; i--) {
        const sum = digits[i] + carry; //@sum
        digits[i] = sum % 10;
        carry = Math.floor(sum / 10); //@write
      }
      if (carry) digits.unshift(carry); //@prepend
      return digits; //@ret
    }
  `),
  run({ digits }, t) {
    let c = 1;
    const view = (i?: number) => [vars({ carry: c }), arr("digits", digits, { tones: tones([i, "active"]), pointers: { i } })];
    t.step("init", "The +1 starts as a carry into the last digit.", view());
    for (let i = digits.length - 1; i >= 0; i--) {
      const sum = digits[i] + c;
      t.step("sum", `${digits[i]} + ${c} = ${sum}.`, view(i));
      digits[i] = sum % 10;
      c = Math.floor(sum / 10);
      t.step("write", `Write ${digits[i]}, carry ${c}.`, view(i));
    }
    if (c) {
      digits.unshift(c);
      t.step("prepend", "A carry is left: prepend 1.", [arr("digits", digits, { tones: tones([0, "success"]) })]);
    }
    t.step("ret", `Return [${digits}].`, view());
    return digits;
  },
});

const earlyExit = defineSolution<Input>({
  id: "early-exit",
  name: "Stop at the First Non-nine",
  time: "O(n)",
  space: "O(1) extra",
  idea: "Scan from the right. A 9 becomes 0 and the carry moves on; the first digit below 9 just goes up by one and we are done. If every digit was 9, the answer is 1 followed by zeros.",
  code: code(`
    function plusOne(digits: number[]): number[] {
      for (let i = digits.length - 1; i >= 0; i--) {
        if (digits[i] < 9) { digits[i]++; return digits; } //@bump
        digits[i] = 0; //@zero
      }
      return [1, ...digits]; //@all-nines
    }
  `),
  run({ digits }, t) {
    for (let i = digits.length - 1; i >= 0; i--) {
      if (digits[i] < 9) {
        digits[i]++;
        t.step("bump", `${digits[i] - 1} < 9: make it ${digits[i]} and stop.`, [arr("digits", digits, { tones: tones([i, "success"]), pointers: { i } })]);
        return digits;
      }
      digits[i] = 0;
      t.step("zero", "9 rolls over to 0; carry continues left.", [arr("digits", digits, { tones: tones([i, "active"]), pointers: { i } })]);
    }
    const res = [1, ...digits];
    t.step("all-nines", "Every digit was 9: prepend 1.", [arr("digits", res, { tones: tones([0, "success"]) })]);
    return res;
  },
});

export default defineProblem<Input>({
  description: "A large integer is given as an array of its digits, most significant first, with no leading zeros. Return the digits of the integer plus one.",
  input: { default: "digits = [1,2,9,9]", parse: (a) => ({ digits: a.ints("digits") }) },
  examples: [
    { input: "digits = [1,2,3]", output: [1, 2, 4] },
    { input: "digits = [4,3,2,1]", output: [4, 3, 2, 2] },
    { input: "digits = [9]", output: [1, 0] },
  ],
  solutions: [carry, earlyExit],
});

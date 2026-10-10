import { arr, range, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  a: string;
  b: string;
}

const columnAdd = defineSolution<Input>({
  id: "column-addition",
  name: "Column Addition with Carry",
  time: "O(max(m, n))",
  space: "O(max(m, n))",
  idea: "Add like on paper: walk both strings from the right, sum the two digits and the carry, write sum % 2 and carry sum >> 1.",
  code: code(`
    function addBinary(a: string, b: string): string {
      let i = a.length - 1, j = b.length - 1, carry = 0, out = ""; //@init
      while (i >= 0 || j >= 0 || carry) { //@loop
        const sum = (i >= 0 ? +a[i--] : 0) + (j >= 0 ? +b[j--] : 0) + carry; //@sum
        out = (sum % 2) + out; //@write
        carry = sum >> 1; //@carry
      }
      return out; //@ret
    }
  `),
  run({ a, b }, t) {
    let i = a.length - 1,
      j = b.length - 1,
      carry = 0,
      out = "";
    const view = (sum?: number) => [
      vars({ carry, sum }),
      arr("a", [...a], { tones: tones(...range(i + 1, a.length - 1, "muted"), [i, "active"]), pointers: { i: i >= 0 ? i : null } }),
      arr("b", [...b], { tones: tones(...range(j + 1, b.length - 1, "muted"), [j, "active"]), pointers: { j: j >= 0 ? j : null } }),
      arr("out", [...out], { tones: tones([0, "success"]) }),
    ];
    t.step("init", "Start at the rightmost digit of each string.", view());
    while (i >= 0 || j >= 0 || carry) {
      t.step("loop", "Next column.", view());
      const da = i >= 0 ? +a[i] : 0,
        db = j >= 0 ? +b[j] : 0;
      const sum = da + db + carry;
      t.step("sum", `${da} + ${db} + carry ${carry} = ${sum}.`, view(sum));
      i--;
      j--;
      out = (sum % 2) + out;
      t.step("write", `Write ${sum % 2}.`, view(sum));
      carry = sum >> 1;
      t.step("carry", `Carry ${carry}.`, view(sum));
    }
    t.step("ret", `Return "${out}".`, view());
    return out;
  },
});

const bitwise = defineSolution<Input>({
  id: "xor-and-carry",
  name: "XOR + AND Carry (BigInt)",
  time: "O(n) word ops per round",
  space: "O(n)",
  idea: "Treat both strings as big integers. XOR adds without carrying; AND shifted left is the carry. Repeat until there is no carry.",
  code: code(`
    function addBinary(a: string, b: string): string {
      let x = BigInt("0b" + a), y = BigInt("0b" + b); //@init
      while (y !== 0n) { //@loop
        const noCarry = x ^ y; //@xor
        const carry = (x & y) << 1n; //@and
        x = noCarry; y = carry; //@swap
      }
      return x.toString(2); //@ret
    }
  `),
  run({ a, b }, t) {
    const ZERO = BigInt(0),
      ONE = BigInt(1);
    let x = BigInt("0b" + a),
      y = BigInt("0b" + b);
    const width = Math.max(a.length, b.length) + 1;
    const pad = (n: bigint) => [...n.toString(2).padStart(width, "0")];
    const view = (hi?: "x" | "y") => [
      arr("x", pad(x), { indexLabels: false, tones: hi === "x" ? tones(...range(0, width - 1, "compare")) : {} }),
      arr("y (carry)", pad(y), { indexLabels: false, tones: hi === "y" ? tones(...range(0, width - 1, "compare")) : {} }),
    ];
    t.step("init", "Parse both strings as BigInts.", view());
    while (y !== ZERO) {
      t.step("loop", "Carry is non-zero: another round.", view());
      const noCarry = x ^ y;
      t.step("xor", `x ^ y = ${noCarry.toString(2)} (sum ignoring carries).`, [...view(), arr("x ^ y", pad(noCarry), { indexLabels: false })]);
      const carry = (x & y) << ONE;
      t.step("and", `(x & y) << 1 = ${carry.toString(2)} (the carries).`, [...view(), arr("carry", pad(carry), { indexLabels: false })]);
      x = noCarry;
      y = carry;
      t.step("swap", "x = sum, y = carry.", view("x"));
    }
    t.step("ret", `Return "${x.toString(2)}".`, view("x"));
    return x.toString(2);
  },
});

export default defineProblem<Input>({
  description: "Given two binary strings a and b, return their sum as a binary string.",
  input: { default: 'a = "1011", b = "111"', parse: (p) => ({ a: p.str("a"), b: p.str("b") }) },
  examples: [
    { input: 'a = "11", b = "1"', output: "100" },
    { input: 'a = "1010", b = "1011"', output: "10101" },
    { input: 'a = "0", b = "0"', output: "0" },
  ],
  solutions: [bitwise, columnAdd],
});

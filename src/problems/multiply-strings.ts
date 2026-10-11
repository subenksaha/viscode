import { arr, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  num1: string;
  num2: string;
}

/** Add two non-negative decimal strings. */
const addStrings = (a: string, b: string) => {
  let i = a.length - 1,
    j = b.length - 1,
    carry = 0,
    out = "";
  while (i >= 0 || j >= 0 || carry) {
    const s = (i >= 0 ? +a[i--] : 0) + (j >= 0 ? +b[j--] : 0) + carry;
    out = (s % 10) + out;
    carry = Math.floor(s / 10);
  }
  return out;
};

const partials = defineSolution<Input>({
  id: "partial-products",
  name: "Grade-school Partial Products",
  time: "O(m·n + n·(m + n))",
  space: "O(m + n)",
  idea: "Multiply num1 by one digit of num2 at a time (with a carry), shift it by that digit's place with trailing zeros, and add it to a running string sum.",
  approach: [
    {
      title: "One digit of num2 at a time",
      detail: "Multiply num1 by it with a running carry.",
      at: "digit",
    },
    {
      title: "Shift by place",
      detail: "Append zeros for the digit's position.",
      at: "row",
    },
    {
      title: "Add to the total",
      detail: "String addition with a carry.",
      at: "add",
    },
    {
      title: "Result",
      detail: "Grade-school multiplication.",
      at: "ret",
    },
  ],
  code: code(`
    function multiply(num1: string, num2: string): string {
      if (num1 === "0" || num2 === "0") return "0";
      let total = "0";
      // Multiply num1 by one digit of num2 at a time, like on paper.
      for (let j = num2.length - 1; j >= 0; j--) { //@digit
        let row = "";
        let carry = 0;
        for (let i = num1.length - 1; i >= 0; i--) {
          const product = Number(num1[i]) * Number(num2[j]) + carry;
          row = (product % 10) + row;
          carry = Math.floor(product / 10);
        }
        if (carry > 0) row = carry + row;
        const zerosToShift = num2.length - 1 - j;
        row += "0".repeat(zerosToShift); //@row
        total = addStrings(total, row); //@add
      }
      return total; //@ret
    }

    // Grade-school addition of two digit strings.
    function addStrings(a: string, b: string): string {
      let i = a.length - 1;
      let j = b.length - 1;
      let carry = 0;
      let result = "";
      while (i >= 0 || j >= 0 || carry > 0) {
        const digitA = i >= 0 ? Number(a[i]) : 0;
        const digitB = j >= 0 ? Number(b[j]) : 0;
        const sum = digitA + digitB + carry;
        result = (sum % 10) + result;
        carry = Math.floor(sum / 10);
        i--;
        j--;
      }
      return result;
    }
  `),
  run({ num1, num2 }, t) {
    if (num1 === "0" || num2 === "0") {
      t.step("ret", "Anything times 0 is 0.");
      return "0";
    }
    let total = "0";
    const rows: string[] = [];
    const view = (j?: number) => [
      vars({ total }),
      arr("num1", [...num1]),
      arr("num2", [...num2], { tones: tones([j, "active"]) }),
      arr("partial products", rows, { indexLabels: false, tones: tones([rows.length - 1, "compare"]) }),
    ];
    for (let j = num2.length - 1; j >= 0; j--) {
      t.step("digit", `Multiply ${num1} by ${num2[j]}.`, view(j));
      let row = "",
        carry = 0;
      for (let i = num1.length - 1; i >= 0; i--) {
        const p = +num1[i] * +num2[j] + carry;
        row = (p % 10) + row;
        carry = Math.floor(p / 10);
      }
      if (carry) row = carry + row;
      row += "0".repeat(num2.length - 1 - j);
      rows.push(row);
      t.step("row", `${num1} × ${num2[j]}${num2.length - 1 - j ? ` × 10^${num2.length - 1 - j}` : ""} = ${row}.`, view(j));
      total = addStrings(total, row);
      t.step("add", `Running total: ${total}.`, view(j));
    }
    t.step("ret", `Return "${total}".`, view());
    return total;
  },
});

const positions = defineSolution<Input>({
  id: "position-array",
  name: "Digit Position Array",
  time: "O(m·n)",
  space: "O(m + n)",
  idea: "The product of num1[i] and num2[j] lands in positions i + j and i + j + 1 of an (m + n)-digit result. Add each product into place, push the carry left, then strip leading zeros.",
  approach: [
    {
      title: "m + n digit slots",
      detail: "The product has at most m + n digits.",
      at: "init",
    },
    {
      title: "Products land at i + j + 1",
      detail: "num1[i]·num2[j] adds into digits[i + j + 1].",
      at: "mul",
    },
    {
      title: "Carry left",
      detail: "Keep sum % 10 there and add the carry into digits[i + j].",
      at: "carry",
    },
    {
      title: "Strip leading zeros",
      detail: "Then join. O(m·n) with no string additions.",
      at: "strip",
    },
  ],
  code: code(`
    function multiply(num1: string, num2: string): string {
      const m = num1.length;
      const n = num2.length;
      // digits[k] holds one digit of the answer; num1[i] * num2[j] lands on digits[i + j + 1].
      const digits = new Array(m + n).fill(0); //@init
      for (let i = m - 1; i >= 0; i--) {
        for (let j = n - 1; j >= 0; j--) {
          const sum = Number(num1[i]) * Number(num2[j]) + digits[i + j + 1]; //@mul
          digits[i + j + 1] = sum % 10;
          digits[i + j] += Math.floor(sum / 10); //@carry
        }
      }
      // Skip leading zeros.
      let start = 0;
      while (start < digits.length - 1 && digits[start] === 0) start++; //@strip
      return digits.slice(start).join(""); //@ret
    }
  `),
  run({ num1, num2 }, t) {
    const m = num1.length,
      n = num2.length,
      res = new Array(m + n).fill(0);
    const view = (i?: number, j?: number) => [
      arr("num1", [...num1], { tones: tones([i, "active"]) }),
      arr("num2", [...num2], { tones: tones([j, "active"]) }),
      arr("result digits", res, { tones: i !== undefined && j !== undefined ? tones([i + j, "compare"], [i + j + 1, "active"]) : {} }),
    ];
    t.step("init", `The product has at most ${m + n} digits.`, view());
    for (let i = m - 1; i >= 0; i--)
      for (let j = n - 1; j >= 0; j--) {
        const sum = +num1[i] * +num2[j] + res[i + j + 1];
        t.step("mul", `${num1[i]} × ${num2[j]} + ${res[i + j + 1]} = ${sum} at position ${i + j + 1}.`, () => view(i, j));
        res[i + j + 1] = sum % 10;
        res[i + j] += Math.floor(sum / 10);
        t.step("carry", `Keep ${sum % 10}; carry ${Math.floor(sum / 10)} to position ${i + j}.`, () => view(i, j));
      }
    const s = res.join("").replace(/^0+/, "") || "0";
    t.step("strip", "Drop leading zeros.", view());
    t.step("ret", `Return "${s}".`, [vars({ product: s })]);
    return s;
  },
});

export default defineProblem<Input>({
  description: "Given two non-negative integers as strings, return their product as a string, without converting the inputs to integers directly or using big-integer libraries.",
  input: { default: 'num1 = "123", num2 = "456"', parse: (a) => ({ num1: a.str("num1"), num2: a.str("num2") }) },
  examples: [
    { input: 'num1 = "2", num2 = "3"', output: "6" },
    { input: 'num1 = "123", num2 = "456"', output: "56088" },
    { input: 'num1 = "9133", num2 = "0"', output: "0" },
    { input: 'num1 = "999", num2 = "99"', output: "98901" },
  ],
  solutions: [partials, positions],
});

import { arr, range, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  s: string;
}

const recursive = defineSolution<Input>({
  id: "recursive-descent",
  name: "Recursive Descent",
  time: "O(n)",
  space: "O(depth)",
  idea: "Parse a sum of signed terms. A term is a number or a parenthesized expression, which is parsed by a recursive call that stops at the matching ')'.",
  code: code(`
    function calculate(s: string): number {
      let i = 0;
      function expr(): number {
        let total = 0, sign = 1;
        while (i < s.length && s[i] !== ")") { //@loop
          const c = s[i];
          if (c === " ") i++;
          else if (c === "+" || c === "-") { sign = c === "-" ? -1 : 1; i++; } //@sign
          else if (c === "(") { i++; total += sign * expr(); i++; sign = 1; } //@paren
          else { let n = 0; while (s[i] >= "0" && s[i] <= "9") n = n * 10 + +s[i++]; total += sign * n; sign = 1; } //@num
        }
        return total; //@ret
      }
      return expr();
    }
  `),
  run({ s }, t) {
    let i = 0;
    const frames: string[] = [];
    const view = (lo: number, hi: number, extra: Record<string, unknown>) => [
      vars(extra),
      arr("s", [...s], { tones: tones(...range(lo, hi, "active")), pointers: { i: i < s.length ? i : null } }),
      arr("call stack (running totals)", frames, { indexLabels: false }),
    ];
    const expr = (): number => {
      let total = 0,
        sign = 1;
      frames.push("0");
      const sync = () => (frames[frames.length - 1] = String(total));
      while (i < s.length && s[i] !== ")") {
        const c = s[i];
        if (c === " ") i++;
        else if (c === "+" || c === "-") {
          sign = c === "-" ? -1 : 1;
          t.step("sign", `Sign ${c}.`, () => view(i, i, { total, sign }));
          i++;
        } else if (c === "(") {
          t.step("paren", "'(': evaluate the inner expression recursively.", () => view(i, i, { total, sign }));
          i++;
          const inner = expr();
          total += sign * inner;
          sync();
          t.step("paren", `Inner expression = ${inner}. total = ${total}.`, () => view(i, i, { total, sign }));
          i++;
          sign = 1;
        } else {
          const start = i;
          let n = 0;
          while (s[i] >= "0" && s[i] <= "9") n = n * 10 + +s[i++];
          total += sign * n;
          sync();
          t.step("num", `Number ${n}: total = ${total}.`, () => view(start, i - 1, { total, sign }));
          sign = 1;
        }
      }
      t.step("ret", s[i] === ")" ? `Hit ')': return ${total} to the caller.` : `End of input: ${total}.`, () => view(i, i, { total }));
      frames.pop();
      return total;
    };
    return expr();
  },
});

const stack = defineSolution<Input>({
  id: "sign-stack",
  name: "Stack of Saved (result, sign)",
  time: "O(n)",
  space: "O(depth)",
  idea: "Accumulate result with the current sign. On '(' push the running result and the sign before it, then start fresh. On ')' multiply the inner result by the saved sign and add the saved result back.",
  code: code(`
    function calculate(s: string): number {
      const stack: number[] = [];
      let result = 0, sign = 1, num = 0; //@init
      for (const c of s) {
        if (c >= "0" && c <= "9") num = num * 10 + +c; //@digit
        else if (c === "+" || c === "-") { result += sign * num; num = 0; sign = c === "+" ? 1 : -1; } //@op
        else if (c === "(") { stack.push(result, sign); result = 0; sign = 1; } //@open
        else if (c === ")") { result += sign * num; num = 0; result = result * stack.pop()! + stack.pop()!; } //@close
      }
      return result + sign * num; //@ret
    }
  `),
  run({ s }, t) {
    const st: number[] = [];
    let result = 0,
      sign = 1,
      num = 0;
    const view = (i?: number) => [
      vars({ result, sign, num }),
      arr("s", [...s], { tones: tones([i, "active"]), pointers: { i } }),
      arr("stack (result, sign pairs)", st, { indexLabels: false }),
    ];
    t.step("init", "result = 0, sign = +, num = 0.", view());
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c >= "0" && c <= "9") {
        num = num * 10 + +c;
        t.step("digit", `Digit ${c}: num = ${num}.`, view(i));
      } else if (c === "+" || c === "-") {
        result += sign * num;
        num = 0;
        sign = c === "+" ? 1 : -1;
        t.step("op", `Fold the pending number in: result = ${result}. Next sign ${c}.`, view(i));
      } else if (c === "(") {
        st.push(result, sign);
        result = 0;
        sign = 1;
        t.step("open", `'(': save (${st.at(-2)}, ${st.at(-1)}) and start a fresh sub-result.`, view(i));
      } else if (c === ")") {
        result += sign * num;
        num = 0;
        const savedSign = st.pop()!,
          savedResult = st.pop()!;
        const inner = result;
        result = inner * savedSign + savedResult;
        t.step("close", `')': inner = ${inner}. result = ${inner} × ${savedSign} + ${savedResult} = ${result}.`, view(i));
      }
    }
    const res = result + sign * num;
    t.step("ret", `Return ${result} + ${sign} × ${num} = ${res}.`, view());
    return res;
  },
});

export default defineProblem<Input>({
  description: "Evaluate a valid expression string containing non-negative integers, '+', '−', '(', ')' and spaces. '−' may also be unary. Don't use eval.",
  input: { default: 's = "(1+(4+5+2)-3)-(6+8)"', parse: (a) => ({ s: a.str("s") }) },
  examples: [
    { input: 's = "1 + 1"', output: 2 },
    { input: 's = " 2-1 + 2 "', output: 3 },
    { input: 's = "(1+(4+5+2)-3)+(6+8)"', output: 23 },
    { input: 's = "-(2+3)"', output: -5 },
  ],
  solutions: [recursive, stack],
});

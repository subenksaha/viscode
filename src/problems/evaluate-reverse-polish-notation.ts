import { arr, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  tokens: string[];
}

const apply = (a: number, b: number, op: string) =>
  op === "+" ? a + b : op === "-" ? a - b : op === "*" ? a * b : Math.trunc(a / b);
const isOp = (s: string) => s === "+" || s === "-" || s === "*" || s === "/";

const recursive = defineSolution<Input>({
  id: "recursive",
  name: "Recursion from the End",
  time: "O(n)",
  space: "O(n)",
  idea: "Read tokens right to left. An operator's right operand is the expression just before it, and its left operand is the one before that, so evaluate them recursively.",
  code: code(`
    function evalRPN(tokens: string[]): number {
      let i = tokens.length - 1;
      function evaluate(): number {
        const tok = tokens[i--]; //@read
        if (!["+", "-", "*", "/"].includes(tok)) return +tok; //@num
        const b = evaluate(), a = evaluate(); //@operands
        return tok === "+" ? a + b : tok === "-" ? a - b : tok === "*" ? a * b : Math.trunc(a / b); //@apply
      }
      return evaluate(); //@ret
    }
  `),
  run({ tokens }, t) {
    let i = tokens.length - 1;
    const stack: string[] = [];
    const view = (k: number) => [arr("tokens", tokens, { tones: tones([k, "active"]), pointers: { i: k } }), arr("call stack", stack, { indexLabels: false })];
    const evaluate = (): number => {
      const k = i--;
      const tok = tokens[k];
      t.step("read", `Read "${tok}".`, view(k));
      if (!isOp(tok)) {
        t.step("num", `${tok} is a number.`, view(k));
        return +tok;
      }
      stack.push(tok);
      t.step("operands", `"${tok}" needs two operands: evaluate the right one first.`, view(k));
      const b = evaluate(),
        a = evaluate();
      stack.pop();
      const r = apply(a, b, tok);
      t.step("apply", `${a} ${tok} ${b} = ${r}.`, [vars({ a, b, result: r }), ...view(k)]);
      return r;
    };
    const res = evaluate();
    t.step("ret", `Return ${res}.`, [vars({ result: res })]);
    return res;
  },
});

const stack = defineSolution<Input>({
  id: "stack",
  name: "Operand Stack",
  time: "O(n)",
  space: "O(n)",
  idea: "Push numbers. On an operator, pop the right then the left operand, apply it, and push the result. The last value on the stack is the answer.",
  code: code(`
    function evalRPN(tokens: string[]): number {
      const stack: number[] = []; //@init
      for (const tok of tokens) { //@loop
        if (!["+", "-", "*", "/"].includes(tok)) { stack.push(+tok); continue; } //@push
        const b = stack.pop()!, a = stack.pop()!; //@pop
        stack.push(tok === "+" ? a + b : tok === "-" ? a - b : tok === "*" ? a * b : Math.trunc(a / b)); //@apply
      }
      return stack[0]; //@ret
    }
  `),
  run({ tokens }, t) {
    const st: number[] = [];
    const view = (k?: number, extra: Record<string, unknown> = {}) => [
      vars(extra),
      arr("tokens", tokens, { tones: tones([k, "active"]), pointers: { i: k } }),
      arr("stack (top = right)", st, { tones: tones([st.length - 1, "compare"]), indexLabels: false }),
    ];
    t.step("init", "Empty stack.", view());
    tokens.forEach((tok, k) => {
      if (!isOp(tok)) {
        st.push(+tok);
        t.step("push", `Push ${tok}.`, view(k));
        return;
      }
      const b = st.pop()!,
        a = st.pop()!;
      t.step("pop", `"${tok}": pop b = ${b}, then a = ${a}.`, view(k, { a, b }));
      st.push(apply(a, b, tok));
      t.step("apply", `${a} ${tok} ${b} = ${st.at(-1)}. Push it.`, view(k, { a, b }));
    });
    t.step("ret", `Return ${st[0]}.`, view());
    return st[0];
  },
});

export default defineProblem<Input>({
  description: "Evaluate an arithmetic expression in Reverse Polish Notation. Operators are +, −, *, /; division truncates toward zero.",
  input: { default: 'tokens = ["4","13","5","/","+","3","*"]', parse: (a) => ({ tokens: a.strs("tokens") }) },
  examples: [
    { input: 'tokens = ["2","1","+","3","*"]', output: 9 },
    { input: 'tokens = ["4","13","5","/","+"]', output: 6 },
    { input: 'tokens = ["10","6","9","3","+","-11","*","/","*","17","+","5","+"]', output: 22 },
  ],
  solutions: [recursive, stack],
});

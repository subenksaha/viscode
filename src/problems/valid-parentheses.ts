import { arr, text, tones } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  s: string;
}

const stack = defineSolution<Input>({
  id: "stack",
  name: "Stack",
  time: "O(n)",
  space: "O(n)",
  idea: "Push each opening bracket. A closing bracket must match the top of the stack. At the end, the stack must be empty.",
  approach: [
    {
      title: "Openers wait on a stack",
      detail: "The most recent unclosed bracket must be the first one closed: last in, first out.",
      at: "init",
    },
    {
      title: "Push openers",
      detail: "Every '(' '[' '{' goes onto the stack.",
      at: "push",
    },
    {
      title: "Closers must match the top",
      detail: "Pop and compare. A mismatch or an empty stack means the string is invalid.",
      at: "pop",
    },
    {
      title: "Nothing left open",
      detail: "The string is valid only if the stack ends empty.",
      at: "ret",
    },
  ],
  code: code(`
    function isValid(s: string): boolean {
      const openerFor: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
      const stack: string[] = []; // openers still waiting to be closed //@init
      for (const char of s) { //@loop
        const isCloser = char in openerFor;
        if (!isCloser) {
          stack.push(char); //@push
        } else {
          const lastOpen = stack.pop(); //@pop
          if (lastOpen !== openerFor[char]) return false;
        }
      }
      return stack.length === 0; //@ret
    }
  `),
  run({ s }, t) {
    const pairs: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
    const st: string[] = [];
    const chars = [...s];
    const view = (i?: number, bad = false) => [arr("s", chars, { tones: tones([i, bad ? "danger" : "active"]), pointers: { i } }), arr("stack (bottom → top)", st, { indexLabels: false, tones: tones([st.length - 1, "compare"]) })];
    t.step("init", "Empty stack.", view());
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      t.step("loop", `'${ch}'.`, view(i));
      if (!(ch in pairs)) {
        st.push(ch);
        t.step("push", `Opening bracket: push '${ch}'.`, view(i));
      } else {
        const top = st.pop();
        if (top !== pairs[ch]) {
          t.step("pop", `'${ch}' needs '${pairs[ch]}' on top, found ${top ? `'${top}'` : "nothing"}. Return false.`, view(i, true));
          return false;
        }
        t.step("pop", `'${ch}' matches '${top}'. Pop it.`, view(i));
      }
    }
    const ok = st.length === 0;
    t.step("ret", ok ? "Stack is empty. Return true." : "Unclosed brackets remain. Return false.", view());
    return ok;
  },
});

const replace = defineSolution<Input>({
  id: "remove-pairs",
  name: "Repeatedly Remove Adjacent Pairs",
  time: "O(n²)",
  space: "O(n)",
  idea: "A valid string always contains an adjacent pair like (), [] or {}. Delete such pairs until nothing changes. Valid strings shrink to empty.",
  approach: [
    {
      title: "Start",
      detail: "A valid string always has an innermost pair right next to each other: (), [] or {}.",
      at: "init",
    },
    {
      title: "Strip adjacent pairs",
      detail: "Delete them. This exposes the next layer of pairs.",
      at: "strip",
    },
    {
      title: "Repeat until stable",
      detail: "If the string shrinks to empty, every bracket was matched. Each pass costs O(n), and there can be up to n/2 passes.",
      at: "ret",
    },
  ],
  code: code(`
    function isValid(s: string): boolean {
      // Keep deleting adjacent pairs like "()" until nothing changes.
      let previous = ""; //@init
      while (s !== previous) { //@loop
        previous = s;
        s = s.replace("()", "").replace("[]", "").replace("{}", ""); //@strip
      }
      return s === ""; //@ret
    }
  `),
  run({ s }, t) {
    let prev = "";
    t.step("init", "Start with the full string.", [text("s", s)]);
    while (s !== prev) {
      t.step("loop", "Look for adjacent pairs.", [text("s", s)]);
      prev = s;
      s = s.replace("()", "").replace("[]", "").replace("{}", "");
      t.step("strip", s === prev ? "No pair left to remove." : "Removed pair(s).", [text("before", prev), text("after", s)]);
    }
    t.step("ret", s === "" ? "Empty: valid." : `"${s}" is left: invalid.`, [text("s", s)]);
    return s === "";
  },
});

export default defineProblem<Input>({
  description: "Given a string of the brackets ()[]{}, return true if every bracket is closed by the same type in the correct order.",
  input: { default: 's = "{[()]}()"', parse: (a) => ({ s: a.str("s") }) },
  examples: [
    { input: 's = "()"', output: true },
    { input: 's = "()[]{}"', output: true },
    { input: 's = "(]"', output: false },
    { input: 's = "([)]"', output: false },
    { input: 's = "{[]}"', output: true },
  ],
  solutions: [replace, stack],
});

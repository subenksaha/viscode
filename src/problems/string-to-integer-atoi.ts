import { arr, range, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  s: string;
}

const MAX = 2 ** 31 - 1,
  MIN = -(2 ** 31);

const regex = defineSolution<Input>({
  id: "regex",
  name: "Regex + Clamp",
  time: "O(n)",
  space: "O(n)",
  idea: "Match optional whitespace, an optional sign and a run of digits with a regular expression, convert, then clamp to the 32-bit range.",
  code: code(`
    function myAtoi(s: string): number {
      const m = s.match(/^ *([+-]?\\d+)/); //@match
      if (!m) return 0; //@none
      const n = Number(m[1]);
      return Math.min(2 ** 31 - 1, Math.max(-(2 ** 31), n)) || 0; //@clamp
    }
  `),
  run({ s }, t) {
    const m = s.match(/^ *([+-]?\d+)/);
    if (!m) {
      t.step("none", "No leading number. Return 0.", [arr("s", [...s], { indexLabels: false })]);
      return 0;
    }
    const start = m[0].length - m[1].length;
    t.step("match", `Matched "${m[1]}".`, [arr("s", [...s], { tones: tones(...range(0, start - 1, "muted"), ...range(start, m[0].length - 1, "success")) })]);
    const n = Number(m[1]);
    const res = Math.min(MAX, Math.max(MIN, n)) || 0;
    t.step("clamp", res !== n ? `${m[1]} is out of range: clamp to ${res}.` : `Return ${res}.`, [vars({ parsed: m[1], result: res })]);
    return res;
  },
});

const scan = defineSolution<Input>({
  id: "scan",
  name: "Single Scan with Overflow Check",
  time: "O(n)",
  space: "O(1)",
  idea: "Skip spaces, read a sign, then fold digits into the result. Before each multiply-by-10, check whether it would overflow and clamp right away.",
  code: code(`
    function myAtoi(s: string): number {
      let i = 0, sign = 1, res = 0;
      while (s[i] === " ") i++; //@space
      if (s[i] === "+" || s[i] === "-") sign = s[i++] === "-" ? -1 : 1; //@sign
      while (i < s.length && s[i] >= "0" && s[i] <= "9") { //@digit
        const d = +s[i++];
        if (res > (2 ** 31 - 1 - d) / 10) return sign === 1 ? 2 ** 31 - 1 : -(2 ** 31); //@overflow
        res = res * 10 + d; //@fold
      }
      return sign * res || 0; //@ret
    }
  `),
  run({ s }, t) {
    let i = 0,
      sign = 1,
      res = 0;
    const view = (tone: "active" | "danger" | "success" = "active") => [
      vars({ sign, res }),
      arr("s", [...s], { tones: tones(...range(0, i - 1, "muted"), [i < s.length ? i : null, tone]), pointers: { i: i < s.length ? i : null } }),
    ];
    while (s[i] === " ") {
      i++;
      t.step("space", "Skip a leading space.", view());
    }
    if (s[i] === "+" || s[i] === "-") {
      sign = s[i] === "-" ? -1 : 1;
      i++;
      t.step("sign", `Sign is ${sign < 0 ? "−" : "+"}.`, view());
    }
    while (i < s.length && s[i] >= "0" && s[i] <= "9") {
      const d = +s[i];
      t.step("digit", `Digit ${d}.`, view());
      i++;
      if (res > (MAX - d) / 10) {
        const out = sign === 1 ? MAX : MIN;
        t.step("overflow", `${res} × 10 + ${d} would overflow. Clamp to ${out}.`, view("danger"));
        return out;
      }
      res = res * 10 + d;
      t.step("fold", `res = ${res}.`, view());
    }
    const out = sign * res || 0;
    t.step("ret", i < s.length ? `'${s[i]}' is not a digit. Stop and return ${out}.` : `End of string. Return ${out}.`, view("success"));
    return out;
  },
});

export default defineProblem<Input>({
  description: "Implement atoi: skip leading spaces, read an optional sign, then read digits until a non-digit. Clamp the result to the signed 32-bit range; return 0 if no digits were read.",
  input: { default: 's = "   -4193 with words"', parse: (a) => ({ s: a.str("s") }) },
  examples: [
    { input: 's = "42"', output: 42 },
    { input: 's = " -042"', output: -42 },
    { input: 's = "1337c0d3"', output: 1337 },
    { input: 's = "0-1"', output: 0 },
    { input: 's = "words and 987"', output: 0 },
    { input: 's = "-91283472332"', output: -2147483648 },
  ],
  solutions: [regex, scan],
});

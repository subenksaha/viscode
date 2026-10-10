import { arr, tones } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  temperatures: number[];
}

const brute = defineSolution<Input>({
  id: "brute-force",
  name: "Scan Forward",
  time: "O(n²)",
  space: "O(1)",
  idea: "For each day, walk forward until a warmer day appears.",
  code: code(`
    function dailyTemperatures(temps: number[]): number[] {
      const res = new Array(temps.length).fill(0);
      for (let i = 0; i < temps.length; i++) //@i
        for (let j = i + 1; j < temps.length; j++) //@j
          if (temps[j] > temps[i]) { res[i] = j - i; break; } //@found
      return res; //@ret
    }
  `),
  run({ temperatures: temps }, t) {
    const res = new Array(temps.length).fill(0);
    const view = (i: number, j?: number, hit = false) => [
      arr("temperatures", temps, { tones: tones([i, "active"], [j, hit ? "success" : "compare"]), pointers: { i, j } }),
      arr("answer", res, { tones: tones([i, "active"]) }),
    ];
    for (let i = 0; i < temps.length; i++) {
      t.step("i", `Day ${i}: ${temps[i]}°.`, view(i));
      for (let j = i + 1; j < temps.length; j++) {
        if (temps[j] > temps[i]) {
          res[i] = j - i;
          t.step("found", `Day ${j} (${temps[j]}°) is warmer: wait ${j - i}.`, view(i, j, true));
          break;
        }
        t.step("j", `Day ${j} (${temps[j]}°) is not warmer.`, view(i, j));
      }
    }
    t.step("ret", `Return [${res}].`, [arr("answer", res)]);
    return res;
  },
});

const monoStack = defineSolution<Input>({
  id: "monotonic-stack",
  name: "Monotonic Stack",
  time: "O(n)",
  space: "O(n)",
  idea: "Keep a stack of days still waiting for a warmer one; their temperatures decrease from bottom to top. A warmer day pops every cooler day off the top and answers it.",
  code: code(`
    function dailyTemperatures(temps: number[]): number[] {
      const res = new Array(temps.length).fill(0), stack: number[] = [];
      for (let i = 0; i < temps.length; i++) { //@loop
        while (stack.length && temps[stack.at(-1)!] < temps[i]) { //@cmp
          const j = stack.pop()!;
          res[j] = i - j; //@pop
        }
        stack.push(i); //@push
      }
      return res; //@ret
    }
  `),
  run({ temperatures: temps }, t) {
    const res = new Array(temps.length).fill(0),
      stack: number[] = [];
    const view = (i: number, j?: number) => [
      arr("temperatures", temps, { tones: tones(...stack.map((s) => [s, "compare"] as [number, "compare"]), [j, "success"], [i, "active"]), pointers: { i } }),
      arr("stack (waiting days)", stack.map((s) => `${s}:${temps[s]}°`), { indexLabels: false }),
      arr("answer", res, { tones: tones([j, "success"]) }),
    ];
    for (let i = 0; i < temps.length; i++) {
      t.step("loop", `Day ${i}: ${temps[i]}°.`, view(i));
      while (stack.length && temps[stack.at(-1)!] < temps[i]) {
        const j = stack.pop()!;
        res[j] = i - j;
        t.step("pop", `${temps[i]}° > ${temps[j]}°: day ${j} waits ${i - j}.`, view(i, j));
      }
      stack.push(i);
      t.step("push", `Day ${i} waits for a warmer day.`, view(i));
    }
    t.step("ret", "Days left on the stack never get warmer: 0.", view(temps.length - 1));
    return res;
  },
});

export default defineProblem<Input>({
  description: "Given daily temperatures, return an array where answer[i] is the number of days after day i until a warmer temperature, or 0 if there is none.",
  input: { default: "temperatures = [73,74,75,71,69,72,76,73]", parse: (a) => ({ temperatures: a.ints("temperatures") }) },
  examples: [
    { input: "temperatures = [73,74,75,71,69,72,76,73]", output: [1, 1, 4, 2, 1, 1, 0, 0] },
    { input: "temperatures = [30,40,50,60]", output: [1, 1, 1, 0] },
    { input: "temperatures = [30,60,90]", output: [1, 1, 0] },
  ],
  solutions: [brute, monoStack],
});

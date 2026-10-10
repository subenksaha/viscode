import { arr, range, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  heights: number[];
}

const expand = defineSolution<Input>({
  id: "expand-each-bar",
  name: "Expand Around Each Bar",
  time: "O(n²)",
  space: "O(1)",
  idea: "Use each bar as the rectangle's height. Extend left and right while the neighbors are at least as tall; width × height is the candidate.",
  code: code(`
    function largestRectangleArea(heights: number[]): number {
      let best = 0;
      for (let i = 0; i < heights.length; i++) { //@bar
        let l = i, r = i;
        while (l > 0 && heights[l - 1] >= heights[i]) l--; //@left
        while (r < heights.length - 1 && heights[r + 1] >= heights[i]) r++; //@right
        best = Math.max(best, heights[i] * (r - l + 1)); //@area
      }
      return best; //@ret
    }
  `),
  run({ heights }, t) {
    let best = 0;
    for (let i = 0; i < heights.length; i++) {
      let l = i,
        r = i;
      while (l > 0 && heights[l - 1] >= heights[i]) l--;
      while (r < heights.length - 1 && heights[r + 1] >= heights[i]) r++;
      const area = heights[i] * (r - l + 1);
      best = Math.max(best, area);
      t.step("area", `Height ${heights[i]} spans [${l}, ${r}]: area ${heights[i]} × ${r - l + 1} = ${area}.`, () => [
        vars({ area, best }),
        arr("heights", heights, { tones: tones(...range(l, r, "window"), [i, "active"]), window: [l, r], pointers: { i } }),
      ]);
    }
    t.step("ret", `Return ${best}.`, [vars({ best })]);
    return best;
  },
});

const monoStack = defineSolution<Input>({
  id: "monotonic-stack",
  name: "Monotonic Stack",
  time: "O(n)",
  space: "O(n)",
  idea: "Keep indices of increasing heights on a stack. When a shorter bar arrives, every taller bar on the stack has found its right edge; its left edge is the index below it on the stack. Pop and measure.",
  code: code(`
    function largestRectangleArea(heights: number[]): number {
      const stack: number[] = []; let best = 0; //@init
      for (let i = 0; i <= heights.length; i++) { //@bar
        const h = i === heights.length ? 0 : heights[i];
        while (stack.length && heights[stack.at(-1)!] > h) { //@pop
          const top = stack.pop()!;
          const left = stack.length ? stack.at(-1)! + 1 : 0;
          best = Math.max(best, heights[top] * (i - left)); //@area
        }
        stack.push(i); //@push
      }
      return best; //@ret
    }
  `),
  run({ heights }, t) {
    const stack: number[] = [];
    let best = 0;
    const n = heights.length;
    const view = (i: number, extra: Record<string, unknown> = {}, span?: [number, number], top?: number) => [
      vars({ best, ...extra }),
      arr("heights", heights, {
        tones: tones(...(span ? range(span[0], span[1], "window") : []), ...stack.map((s) => [s, "compare"] as [number, "compare"]), [top, "success"], [i < n ? i : null, "active"]),
        pointers: { i: i < n ? i : null },
        window: span ?? null,
      }),
      arr("stack (indices)", stack, { indexLabels: false }),
    ];
    t.step("init", "Empty stack.", view(-1));
    for (let i = 0; i <= n; i++) {
      const h = i === n ? 0 : heights[i];
      t.step("bar", i === n ? "Past the end: use height 0 to flush the stack." : `Bar ${i}, height ${h}.`, () => view(i));
      while (stack.length && heights[stack.at(-1)!] > h) {
        const top = stack.pop()!;
        const left = stack.length ? stack.at(-1)! + 1 : 0;
        const area = heights[top] * (i - left);
        best = Math.max(best, area);
        t.step("area", `${heights[top]} (index ${top}) spans [${left}, ${i - 1}]: ${heights[top]} × ${i - left} = ${area}.`, () => view(i, { area }, [left, i - 1], top));
      }
      if (i < n) {
        stack.push(i);
        t.step("push", `Push ${i}.`, () => view(i));
      }
    }
    t.step("ret", `Return ${best}.`, view(n));
    return best;
  },
});

export default defineProblem<Input>({
  description: "Given bar heights of a histogram where each bar has width 1, return the area of the largest rectangle that fits inside it.",
  input: { default: "heights = [2,1,5,6,2,3]", parse: (a) => ({ heights: a.ints("heights") }) },
  examples: [
    { input: "heights = [2,1,5,6,2,3]", output: 10 },
    { input: "heights = [2,4]", output: 4 },
    { input: "heights = [2,1,2]", output: 3 },
  ],
  solutions: [expand, monoStack],
});

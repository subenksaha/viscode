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
  approach: [
    {
      title: "Each bar as the height",
      detail: "Use bar i as the rectangle's height. Stretch left and right while the neighbors are at least as tall.",
      at: "area",
    },
    {
      title: "Width × height",
      detail: "Bar 5 at index 2 stretches over [2, 3]: 5 × 2 = 10.",
      at: "area",
      nth: 3,
    },
    {
      title: "Max over all bars",
      detail: "Stretching can take O(n) per bar, so O(n²) worst case.",
      at: "ret",
    },
  ],
  code: code(`
    function largestRectangleArea(heights: number[]): number {
      let best = 0;
      for (let i = 0; i < heights.length; i++) { //@bar
        // Stretch left and right while the bars are at least as tall as bar i.
        let left = i;
        let right = i;
        while (left > 0 && heights[left - 1] >= heights[i]) left--; //@left
        while (right < heights.length - 1 && heights[right + 1] >= heights[i]) right++; //@right
        const width = right - left + 1;
        best = Math.max(best, heights[i] * width); //@area
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
  approach: [
    {
      title: "Increasing stack of indices",
      detail: "Bars on the stack are still waiting for a shorter bar on their right.",
      at: "init",
    },
    {
      title: "Push while heights rise",
      detail: "A taller or equal bar extends the rectangles of the bars below it.",
      at: "push",
    },
    {
      title: "A shorter bar closes rectangles",
      detail: "Pop the taller bars. Each one's right edge is i − 1, and its left edge is just after the new stack top, the nearest shorter bar to its left.",
      at: "area",
      nth: 2,
    },
    {
      title: "Flush with a final 0",
      detail: "The sentinel height 0 at the end pops everything. Each index is pushed and popped once: O(n).",
      at: "ret",
    },
  ],
  code: code(`
    function largestRectangleArea(heights: number[]): number {
      const stack: number[] = []; // indices of bars with increasing heights //@init
      let best = 0;
      for (let i = 0; i <= heights.length; i++) { //@bar
        // A height-0 bar at the end flushes everything left on the stack.
        const height = i === heights.length ? 0 : heights[i];
        while (stack.length > 0 && heights[stack[stack.length - 1]] > height) { //@pop
          const tallest = stack.pop()!;
          // That bar stretches from just after the new stack top up to i - 1.
          const left = stack.length > 0 ? stack[stack.length - 1] + 1 : 0;
          const width = i - left;
          best = Math.max(best, heights[tallest] * width); //@area
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

import { arr, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  height: number[];
}

const bruteForce = defineSolution<Input>({
  id: "brute-force",
  name: "Brute Force",
  time: "O(n²)",
  space: "O(1)",
  idea: "Try every pair of lines. Area = width × the shorter height.",
  code: code(`
    function maxArea(height: number[]): number {
      let best = 0; //@init
      for (let i = 0; i < height.length; i++) //@i
        for (let j = i + 1; j < height.length; j++) { //@j
          const area = (j - i) * Math.min(height[i], height[j]); //@area
          best = Math.max(best, area); //@best
        }
      return best; //@ret
    }
  `),
  run({ height }, t) {
    let best = 0;
    const view = (i?: number, j?: number, area?: number) => [
      vars({ area, best }),
      arr("height", height, { window: i !== undefined && j !== undefined ? [i, j] : null, tones: tones([i, "active"], [j, "compare"]), pointers: { i, j } }),
    ];
    t.step("init", "best = 0.", view());
    for (let i = 0; i < height.length; i++) {
      t.step("i", `Left line i = ${i}.`, view(i));
      for (let j = i + 1; j < height.length; j++) {
        const area = (j - i) * Math.min(height[i], height[j]);
        t.step("area", `(${j} − ${i}) × min(${height[i]}, ${height[j]}) = ${area}.`, () => view(i, j, area));
        best = Math.max(best, area);
        t.step("best", `best = ${best}.`, () => view(i, j, area));
      }
    }
    t.step("ret", `Return ${best}.`, view());
    return best;
  },
});

const twoPointers = defineSolution<Input>({
  id: "two-pointers",
  name: "Two Pointers",
  time: "O(n)",
  space: "O(1)",
  idea: "Start with the widest container. The shorter line limits the area, and moving the taller one inward can never help, so always move the shorter line.",
  code: code(`
    function maxArea(height: number[]): number {
      let lo = 0, hi = height.length - 1, best = 0; //@init
      while (lo < hi) { //@loop
        const area = (hi - lo) * Math.min(height[lo], height[hi]); //@area
        best = Math.max(best, area); //@best
        if (height[lo] < height[hi]) lo++; //@lo
        else hi--; //@hi
      }
      return best; //@ret
    }
  `),
  run({ height }, t) {
    let lo = 0,
      hi = height.length - 1,
      best = 0;
    const view = (area?: number) => [
      vars({ area, best }),
      arr("height", height, { window: [lo, hi], tones: tones([lo, "active"], [hi, "compare"]), pointers: { lo, hi } }),
    ];
    t.step("init", "Start with the widest pair.", view());
    while (lo < hi) {
      t.step("loop", `lo = ${lo}, hi = ${hi}.`, view());
      const area = (hi - lo) * Math.min(height[lo], height[hi]);
      t.step("area", `(${hi} − ${lo}) × min(${height[lo]}, ${height[hi]}) = ${area}.`, view(area));
      best = Math.max(best, area);
      t.step("best", `best = ${best}.`, view(area));
      if (height[lo] < height[hi]) {
        lo++;
        t.step("lo", "Left line is shorter: move lo right.", view());
      } else {
        hi--;
        t.step("hi", "Right line is shorter (or equal): move hi left.", view());
      }
    }
    t.step("ret", `Return ${best}.`, view());
    return best;
  },
});

export default defineProblem<Input>({
  description:
    "Given line heights, pick two lines that, together with the x-axis, hold the most water. Return that maximum area.",
  input: { default: "height = [1,8,6,2,5,4,8,3,7]", parse: (a) => ({ height: a.ints("height") }) },
  examples: [
    { input: "height = [1,8,6,2,5,4,8,3,7]", output: 49 },
    { input: "height = [1,1]", output: 1 },
  ],
  solutions: [bruteForce, twoPointers],
});

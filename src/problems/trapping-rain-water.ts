import { arr, range, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  height: number[];
}

const bruteForce = defineSolution<Input>({
  id: "brute-force",
  name: "Brute Force",
  time: "O(n²)",
  space: "O(1)",
  idea: "Water above bar i is min(tallest bar to its left, tallest bar to its right) − height[i]. Find both maxima by scanning each time.",
  code: code(`
    function trap(height: number[]): number {
      let water = 0;
      for (let i = 0; i < height.length; i++) { //@bar
        const left = Math.max(...height.slice(0, i + 1)); //@left
        const right = Math.max(...height.slice(i)); //@right
        water += Math.min(left, right) - height[i]; //@add
      }
      return water; //@ret
    }
  `),
  run({ height }, t) {
    let water = 0;
    const filled = height.map(() => 0);
    const view = (i: number, extra: Record<string, unknown> = {}, scan: [number, Tone][] = []) => [
      vars({ water, ...extra }),
      arr("height", height, { tones: tones(...scan, [i, "active"]), pointers: { i } }),
      arr("water above bar", filled, { tones: tones(...filled.map((w, k) => [w ? k : null, "window"] as [number | null, Tone])) }),
    ];
    for (let i = 0; i < height.length; i++) {
      const left = Math.max(...height.slice(0, i + 1));
      t.step("left", `Tallest bar at or left of ${i}: ${left}.`, () => view(i, { left }, range(0, i, "compare")));
      const right = Math.max(...height.slice(i));
      t.step("right", `Tallest bar at or right of ${i}: ${right}.`, () => view(i, { left, right }, range(i, height.length - 1, "compare")));
      const w = Math.min(left, right) - height[i];
      water += w;
      filled[i] = w;
      t.step("add", `min(${left}, ${right}) − ${height[i]} = ${w}.`, () => view(i, { left, right }));
    }
    t.step("ret", `Total water: ${water}.`, view(-1));
    return water;
  },
});

const prefixMax = defineSolution<Input>({
  id: "prefix-suffix-max",
  name: "Prefix & Suffix Maxima",
  time: "O(n)",
  space: "O(n)",
  idea: "Precompute the tallest bar to the left of every index and to the right of every index. Then each bar's water is a single lookup.",
  code: code(`
    function trap(height: number[]): number {
      const n = height.length, L = new Array(n), R = new Array(n);
      for (let i = 0; i < n; i++) L[i] = Math.max(height[i], i ? L[i - 1] : 0); //@L
      for (let i = n - 1; i >= 0; i--) R[i] = Math.max(height[i], i < n - 1 ? R[i + 1] : 0); //@R
      let water = 0;
      for (let i = 0; i < n; i++) water += Math.min(L[i], R[i]) - height[i]; //@add
      return water; //@ret
    }
  `),
  run({ height }, t) {
    const n = height.length;
    const L: (number | null)[] = new Array(n).fill(null),
      R: (number | null)[] = new Array(n).fill(null);
    const view = (i: number | undefined, which?: "L" | "R" | "add", water?: number) => [
      vars({ water }),
      arr("height", height, { tones: tones([i, "active"]) }),
      arr("leftMax", L.map((x) => x ?? ""), { tones: tones([which === "L" || which === "add" ? i : null, "compare"]) }),
      arr("rightMax", R.map((x) => x ?? ""), { tones: tones([which === "R" || which === "add" ? i : null, "compare"]) }),
    ];
    for (let i = 0; i < n; i++) {
      L[i] = Math.max(height[i], i ? L[i - 1]! : 0);
      t.step("L", `leftMax[${i}] = ${L[i]}.`, () => view(i, "L"));
    }
    for (let i = n - 1; i >= 0; i--) {
      R[i] = Math.max(height[i], i < n - 1 ? R[i + 1]! : 0);
      t.step("R", `rightMax[${i}] = ${R[i]}.`, () => view(i, "R"));
    }
    let water = 0;
    for (let i = 0; i < n; i++) {
      const w = Math.min(L[i]!, R[i]!) - height[i];
      water += w;
      t.step("add", `Bar ${i}: min(${L[i]}, ${R[i]}) − ${height[i]} = ${w}.`, () => view(i, "add", water));
    }
    t.step("ret", `Total water: ${water}.`, view(undefined, undefined, water));
    return water;
  },
});

const twoPointers = defineSolution<Input>({
  id: "two-pointers",
  name: "Two Pointers",
  time: "O(n)",
  space: "O(1)",
  idea: "Move inward from both ends, always on the side with the lower max. That side's water is bounded by its own max, since the other side is known to be at least as tall.",
  code: code(`
    function trap(height: number[]): number {
      let l = 0, r = height.length - 1, lMax = 0, rMax = 0, water = 0; //@init
      while (l < r) { //@loop
        lMax = Math.max(lMax, height[l]); rMax = Math.max(rMax, height[r]); //@max
        if (lMax < rMax) water += lMax - height[l++]; //@left
        else water += rMax - height[r--]; //@right
      }
      return water; //@ret
    }
  `),
  run({ height }, t) {
    let l = 0,
      r = height.length - 1,
      lMax = 0,
      rMax = 0,
      water = 0;
    const filled: number[] = height.map(() => 0);
    const view = (hi?: number) => [
      vars({ lMax, rMax, water }),
      arr("height", height, { tones: tones(...range(0, l - 1, "muted"), ...range(r + 1, height.length - 1, "muted"), [hi, "active"]), pointers: { l, r } }),
      arr("water above bar", filled, { tones: tones(...filled.map((w, k) => [w ? k : null, "window"] as [number | null, Tone])) }),
    ];
    t.step("init", "Pointers at both ends.", view());
    while (l < r) {
      lMax = Math.max(lMax, height[l]);
      rMax = Math.max(rMax, height[r]);
      t.step("max", `lMax = ${lMax}, rMax = ${rMax}.`, view());
      if (lMax < rMax) {
        const w = lMax - height[l];
        filled[l] = w;
        water += w;
        t.step("left", `Left side is lower: bar ${l} holds ${lMax} − ${height[l]} = ${w}.`, view(l));
        l++;
      } else {
        const w = rMax - height[r];
        filled[r] = w;
        water += w;
        t.step("right", `Right side is lower or equal: bar ${r} holds ${rMax} − ${height[r]} = ${w}.`, view(r));
        r--;
      }
    }
    t.step("ret", `Total water: ${water}.`, view());
    return water;
  },
});

export default defineProblem<Input>({
  description: "Given n non-negative bar heights of width 1, compute how much rain water is trapped between the bars after raining.",
  input: { default: "height = [0,1,0,2,1,0,1,3,2,1,2,1]", parse: (a) => ({ height: a.ints("height") }) },
  examples: [
    { input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]", output: 6 },
    { input: "height = [4,2,0,3,2,5]", output: 9 },
  ],
  solutions: [bruteForce, prefixMax, twoPointers],
});

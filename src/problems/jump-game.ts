import { arr, range, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  nums: number[];
}

const dp = defineSolution<Input>({
  id: "dp",
  name: "Bottom-up DP",
  time: "O(n²)",
  space: "O(n)",
  idea: "Work backwards: index i is good if some jump from i lands on a good index. The last index is good.",
  code: code(`
    function canJump(nums: number[]): boolean {
      const n = nums.length, good = new Array(n).fill(false);
      good[n - 1] = true; //@init
      for (let i = n - 2; i >= 0; i--) //@i
        for (let j = i + 1; j <= Math.min(i + nums[i], n - 1); j++) //@j
          if (good[j]) { good[i] = true; break; } //@hit
      return good[0]; //@ret
    }
  `),
  run({ nums }, t) {
    const n = nums.length,
      good = new Array(n).fill(false);
    good[n - 1] = true;
    const view = (i?: number, j?: number) => [
      arr("nums", nums, { tones: tones(...(i !== undefined ? range(i + 1, Math.min(i + nums[i], n - 1), "window") : []), [i, "active"], [j, "compare"]), pointers: { i, j } }),
      arr("good", good.map((g) => (g ? "✓" : "·")), { tones: tones(...good.map((g, k) => [g ? k : null, "success"] as [number | null, "success"])) }),
    ];
    t.step("init", "The last index is the goal.", view());
    for (let i = n - 2; i >= 0; i--) {
      t.step("i", `From ${i} you can jump up to ${nums[i]}.`, () => view(i));
      for (let j = i + 1; j <= Math.min(i + nums[i], n - 1); j++) {
        if (good[j]) {
          good[i] = true;
          t.step("hit", `Index ${j} is good, so ${i} is good.`, () => view(i, j));
          break;
        }
        t.step("j", `Index ${j} is not good.`, () => view(i, j));
      }
    }
    t.step("ret", `good[0] = ${good[0]}.`, view());
    return good[0];
  },
});

const greedyForward = defineSolution<Input>({
  id: "greedy-forward",
  name: "Greedy: Max Reach",
  time: "O(n)",
  space: "O(1)",
  idea: "Track the farthest index reachable so far. If you ever stand past it, you are stuck.",
  code: code(`
    function canJump(nums: number[]): boolean {
      let reach = 0; //@init
      for (let i = 0; i < nums.length; i++) { //@loop
        if (i > reach) return false; //@stuck
        reach = Math.max(reach, i + nums[i]); //@extend
      }
      return true; //@ret
    }
  `),
  run({ nums }, t) {
    let reach = 0;
    const view = (i?: number) => [vars({ reach }), arr("nums", nums, { tones: tones(...range(0, Math.min(reach, nums.length - 1), "window"), [i, "active"]), pointers: { i } })];
    t.step("init", "reach = 0.", view());
    for (let i = 0; i < nums.length; i++) {
      t.step("loop", `i = ${i}.`, view(i));
      if (i > reach) {
        t.step("stuck", `Index ${i} is beyond reach ${reach}. Return false.`, view(i));
        return false;
      }
      reach = Math.max(reach, i + nums[i]);
      t.step("extend", `From ${i} we can reach ${i + nums[i]}. reach = ${reach}.`, view(i));
    }
    t.step("ret", "Every index was reachable. Return true.", view());
    return true;
  },
});

const greedyBackward = defineSolution<Input>({
  id: "greedy-backward",
  name: "Greedy: Move the Goal Back",
  time: "O(n)",
  space: "O(1)",
  idea: "Walk from the end. Whenever index i can reach the current goal, i becomes the new goal. Success if the goal reaches 0.",
  code: code(`
    function canJump(nums: number[]): boolean {
      let goal = nums.length - 1; //@init
      for (let i = nums.length - 2; i >= 0; i--) { //@loop
        if (i + nums[i] >= goal) goal = i; //@move
      }
      return goal === 0; //@ret
    }
  `),
  run({ nums }, t) {
    let goal = nums.length - 1;
    const view = (i?: number) => [vars({ goal }), arr("nums", nums, { tones: tones([goal, "success"], [i, "active"]), pointers: { i, goal } })];
    t.step("init", "The goal starts at the last index.", view());
    for (let i = nums.length - 2; i >= 0; i--) {
      if (i + nums[i] >= goal) {
        goal = i;
        t.step("move", `${i} + ${nums[i]} reaches the goal. New goal = ${i}.`, view(i));
      } else t.step("loop", `${i} + ${nums[i]} = ${i + nums[i]} falls short of ${goal}.`, view(i));
    }
    t.step("ret", `goal = ${goal}. Return ${goal === 0}.`, view());
    return goal === 0;
  },
});

export default defineProblem<Input>({
  description: "You start at index 0, and nums[i] is your maximum jump length from index i. Return true if you can reach the last index.",
  input: { default: "nums = [2,3,1,1,4]", parse: (a) => ({ nums: a.ints("nums") }) },
  examples: [
    { input: "nums = [2,3,1,1,4]", output: true },
    { input: "nums = [3,2,1,0,4]", output: false },
    { input: "nums = [0]", output: true },
  ],
  solutions: [dp, greedyForward, greedyBackward],
});

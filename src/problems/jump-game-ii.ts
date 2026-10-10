import { arr, range, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  nums: number[];
}

const dp = defineSolution<Input>({
  id: "dp",
  name: "DP: Fewest Jumps to Each Index",
  time: "O(n²)",
  space: "O(n)",
  idea: "jumps[i] = fewest jumps to reach i. From each reachable i, every index up to i + nums[i] can be reached with jumps[i] + 1.",
  code: code(`
    function jump(nums: number[]): number {
      const jumps = new Array(nums.length).fill(Infinity);
      jumps[0] = 0; //@init
      for (let i = 0; i < nums.length; i++) //@from
        for (let j = i + 1; j <= Math.min(i + nums[i], nums.length - 1); j++)
          jumps[j] = Math.min(jumps[j], jumps[i] + 1); //@relax
      return jumps[nums.length - 1]; //@ret
    }
  `),
  run({ nums }, t) {
    const jumps = new Array(nums.length).fill(Infinity);
    jumps[0] = 0;
    const view = (i?: number, j?: number) => [
      arr("nums", nums, { tones: tones(...(i !== undefined ? range(i + 1, Math.min(i + nums[i], nums.length - 1), "window") : []), [i, "active"], [j, "compare"]), pointers: { i } }),
      arr("fewest jumps", jumps.map((x) => (x === Infinity ? "∞" : x)), { tones: tones([j, "compare"]) }),
    ];
    t.step("init", "Index 0 takes 0 jumps.", view());
    for (let i = 0; i < nums.length; i++) {
      t.step("from", `From ${i} (${jumps[i]} jumps) reach up to ${Math.min(i + nums[i], nums.length - 1)}.`, view(i));
      for (let j = i + 1; j <= Math.min(i + nums[i], nums.length - 1); j++)
        if (jumps[i] + 1 < jumps[j]) {
          jumps[j] = jumps[i] + 1;
          t.step("relax", `jumps[${j}] = ${jumps[j]}.`, view(i, j));
        }
    }
    const res = jumps[nums.length - 1];
    t.step("ret", `Return ${res}.`, view());
    return res;
  },
});

const greedyBfs = defineSolution<Input>({
  id: "greedy-bfs",
  name: "Greedy BFS Levels",
  time: "O(n)",
  space: "O(1)",
  idea: "Indices reachable with exactly k jumps form a contiguous window. Scan the current window, track the farthest index reachable from it, and when the window ends, take a jump: the next window ends at that farthest point.",
  code: code(`
    function jump(nums: number[]): number {
      let jumps = 0, end = 0, far = 0; //@init
      for (let i = 0; i < nums.length - 1; i++) {
        far = Math.max(far, i + nums[i]); //@far
        if (i === end) { jumps++; end = far; } //@jump
      }
      return jumps; //@ret
    }
  `),
  run({ nums }, t) {
    let jumps = 0,
      end = 0,
      far = 0,
      start = 0;
    const view = (i?: number) => [
      vars({ jumps, end, far }),
      arr("nums", nums, { window: [start, Math.min(end, nums.length - 1)], tones: tones([i, "active"], [Math.min(far, nums.length - 1), "compare"]), pointers: { i, end: Math.min(end, nums.length - 1) } }),
    ];
    t.step("init", "Window for 0 jumps is just index 0.", view());
    for (let i = 0; i < nums.length - 1; i++) {
      far = Math.max(far, i + nums[i]);
      t.step("far", `From ${i} we can reach ${i + nums[i]}. far = ${far}.`, view(i));
      if (i === end) {
        jumps++;
        start = end + 1;
        end = far;
        t.step("jump", `End of the window: jump #${jumps}. Next window ends at ${end}.`, view(i));
      }
    }
    t.step("ret", `Return ${jumps}.`, view());
    return jumps;
  },
});

export default defineProblem<Input>({
  description: "Starting at index 0, nums[i] is the maximum jump length from index i. Return the minimum number of jumps to reach the last index (it is always reachable).",
  input: { default: "nums = [2,3,1,1,4]", parse: (a) => ({ nums: a.ints("nums") }) },
  examples: [
    { input: "nums = [2,3,1,1,4]", output: 2 },
    { input: "nums = [2,3,0,1,4]", output: 2 },
    { input: "nums = [0]", output: 0 },
  ],
  solutions: [dp, greedyBfs],
});

import { arr, grid, map, range, rc, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  nums: number[];
}

const memo = defineSolution<Input>({
  id: "memo",
  name: "Top-down: Last Balloon in (l, r)",
  time: "O(n³)",
  space: "O(n²)",
  idea: "Pad nums with 1 on both ends. For the open interval (l, r), choose which balloon k bursts last: its neighbors are then l and r, and the two sides are independent subproblems.",
  approach: [
    {
      title: "Think about the last burst",
      detail: "Choosing which balloon bursts first makes the subproblems depend on each other. Instead, choose which balloon k bursts last in the open interval (l, r). Its neighbors at that moment are exactly l and r.",
      at: "last",
    },
    {
      title: "Independent halves",
      detail: "Then (l, k) and (k, r) are separate subproblems: best(l, k) + nums[l]·nums[k]·nums[r] + best(k, r).",
      at: "last",
      nth: 3,
    },
    {
      title: "Memoize intervals",
      detail: "O(n²) intervals with O(n) choices each: O(n³).",
      at: "store",
    },
    {
      title: "Reuse",
      detail: "Overlapping intervals are cached.",
      at: "hit",
    },
  ],
  code: code(`
    function maxCoins(nums: number[]): number {
      const balloons = [1, ...nums, 1]; // pad with 1s so edges are easy
      const memo = new Map<string, number>();
      // Max coins from bursting every balloon strictly between left and right.
      function best(left: number, right: number): number {
        if (left + 1 === right) return 0; //@empty
        const key = left + "," + right;
        if (memo.has(key)) return memo.get(key)!; //@hit
        let result = 0;
        for (let last = left + 1; last < right; last++) { //@last
          const coins = balloons[left] * balloons[last] * balloons[right];
          const total = best(left, last) + coins + best(last, right);
          result = Math.max(result, total);
        }
        memo.set(key, result); //@store
        return result;
      }
      return best(0, balloons.length - 1); //@ret
    }
  `),
  run({ nums }, t) {
    const a = [1, ...nums, 1];
    const memo = new Map<string, number>();
    const view = (l: number, r: number, k?: number, key?: string) => [
      arr("balloons (padded)", a, { window: l + 1 <= r - 1 ? [l + 1, r - 1] : null, tones: tones([l, "compare"], [r, "compare"], [k, "active"]) }),
      map("memo (l,r → coins)", memo, tones([key, "success"])),
    ];
    const best = (l: number, r: number): number => {
      if (l + 1 === r) return 0;
      const key = `${l},${r}`;
      if (memo.has(key)) {
        t.step("hit", `(${key}) cached = ${memo.get(key)}.`, () => view(l, r, undefined, key));
        return memo.get(key)!;
      }
      let res = 0;
      for (let k = l + 1; k < r; k++) {
        const v = best(l, k) + a[l] * a[k] * a[r] + best(k, r);
        res = Math.max(res, v);
        t.step("last", `Burst ${a[k]} last in (${l}, ${r}): left + ${a[l]}·${a[k]}·${a[r]} + right = ${v}.`, () => view(l, r, k));
      }
      memo.set(key, res);
      t.step("store", `best(${key}) = ${res}.`, () => view(l, r, undefined, key));
      return res;
    };
    const res = best(0, a.length - 1);
    t.step("ret", `Return ${res}.`, view(0, a.length - 1, undefined, `0,${a.length - 1}`));
    return res;
  },
});

const intervalDp = defineSolution<Input>({
  id: "interval-dp",
  name: "Bottom-up Interval DP",
  time: "O(n³)",
  space: "O(n²)",
  idea: "Fill dp[l][r] for open intervals in order of increasing width, so both halves of every split are already known.",
  approach: [
    {
      title: "Empty intervals are 0",
      detail: "Pad with 1s on both ends.",
      at: "init",
    },
    {
      title: "Increasing width",
      detail: "Smaller intervals are filled first.",
      at: "width",
    },
    {
      title: "Try every last balloon",
      detail: "dp[l][r] = max over k of dp[l][k] + coins + dp[k][r].",
      at: "cell",
    },
    {
      title: "Answer",
      detail: "dp[0][n−1].",
      at: "ret",
    },
  ],
  code: code(`
    function maxCoins(nums: number[]): number {
      const balloons = [1, ...nums, 1]; // pad with 1s so edges are easy
      const n = balloons.length;
      // dp[left][right] = max coins from bursting everything strictly between left and right
      const dp = Array.from({ length: n }, () => new Array(n).fill(0)); //@init
      for (let width = 2; width < n; width++) { //@width
        for (let left = 0; left + width < n; left++) {
          const right = left + width;
          for (let last = left + 1; last < right; last++) { //@cell
            const coins = balloons[left] * balloons[last] * balloons[right];
            const total = dp[left][last] + coins + dp[last][right];
            dp[left][right] = Math.max(dp[left][right], total);
          }
        }
      }
      return dp[0][n - 1]; //@ret
    }
  `),
  run({ nums }, t) {
    const a = [1, ...nums, 1],
      n = a.length;
    const dp: (number | null)[][] = Array.from({ length: n }, (_, l) => Array.from({ length: n }, (_, r) => (r === l + 1 ? 0 : null)));
    const labels = { rowLabels: a.map((v, i) => `${i}:${v}`), colLabels: a.map((v, i) => `${i}:${v}`) };
    t.step("init", "Adjacent pairs (l, l+1) contain no balloons: 0.", [grid("dp[l][r]", dp, labels)]);
    for (let width = 2; width < n; width++) {
      t.step("width", `Intervals of width ${width}.`, [vars({ width }), grid("dp[l][r]", dp, labels)]);
      for (let l = 0; l + width < n; l++) {
        const r = l + width;
        let best = 0,
          bestK = l + 1;
        for (let k = l + 1; k < r; k++) {
          const v = dp[l][k]! + a[l] * a[k] * a[r] + dp[k][r]!;
          if (v > best) {
            best = v;
            bestK = k;
          }
        }
        dp[l][r] = best;
        t.step("cell", `dp[${l}][${r}] = ${best} (burst ${a[bestK]} last).`, () => [
          arr("balloons (padded)", a, { tones: tones(...range(l + 1, r - 1, "window"), [bestK, "active"], [l, "compare"], [r, "compare"]) }),
          grid("dp[l][r]", dp, { ...labels, tones: tones([rc(l, bestK), "compare"], [rc(bestK, r), "compare"], [rc(l, r), "success"]) }),
        ]);
      }
    }
    const res = dp[0][n - 1]!;
    t.step("ret", `Return dp[0][${n - 1}] = ${res}.`, [grid("dp[l][r]", dp, { ...labels, tones: tones([rc(0, n - 1), "success"]) })]);
    return res;
  },
});

export default defineProblem<Input>({
  description: "Bursting balloon i earns nums[i−1]·nums[i]·nums[i+1] coins (out-of-range neighbors count as 1), after which its neighbors become adjacent. Return the maximum coins from bursting all balloons.",
  input: { default: "nums = [3,1,5,8]", parse: (a) => ({ nums: a.ints("nums") }) },
  examples: [
    { input: "nums = [3,1,5,8]", output: 167 },
    { input: "nums = [1,5]", output: 10 },
  ],
  solutions: [memo, intervalDp],
});

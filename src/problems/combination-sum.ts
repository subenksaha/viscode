import { arr, range, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  candidates: number[];
  target: number;
}

const backtrack = defineSolution<Input>({
  id: "backtracking",
  name: "Backtracking (Sorted, Pruned)",
  time: "O(n^(T/min))",
  space: "O(T/min)",
  idea: "Build combinations in non-decreasing index order so each set is generated once. Reuse the same index to allow repeats, and stop early once a candidate overshoots (they are sorted).",
  code: code(`
    function combinationSum(candidates: number[], target: number): number[][] {
      candidates.sort((a, b) => a - b); //@sort
      const result: number[][] = [];
      const path: number[] = [];
      function search(start: number, remain: number) {
        if (remain === 0) { //@found
          result.push([...path]);
          return;
        }
        for (let i = start; i < candidates.length; i++) { //@try
          if (candidates[i] > remain) break; //@prune
          path.push(candidates[i]); //@choose
          search(i, remain - candidates[i]); // i, not i + 1: a number can be reused
          path.pop(); //@undo
        }
      }
      search(0, target);
      return result; //@ret
    }
  `),
  run({ candidates, target }, t) {
    candidates.sort((a, b) => a - b);
    const res: number[][] = [],
      path: number[] = [];
    const view = (i?: number, start?: number, remain?: number, tone: "active" | "danger" = "active") => [
      vars({ remain, path: `[${path}]` }),
      arr("candidates", candidates, { tones: tones(...(start !== undefined ? range(0, start - 1, "muted") : []), [i, tone]), pointers: { start, i } }),
      arr("results", res.map((r) => `[${r}]`), { indexLabels: false, tones: tones([res.length - 1, "success"]) }),
    ];
    t.step("sort", "Sort the candidates so we can prune.", view());
    const dfs = (start: number, remain: number) => {
      if (remain === 0) {
        res.push([...path]);
        t.step("found", `Sum hits ${target}: record [${path}].`, () => view(undefined, start, remain));
        return;
      }
      for (let i = start; i < candidates.length; i++) {
        if (candidates[i] > remain) {
          t.step("prune", `${candidates[i]} > ${remain}. Everything after is bigger too: stop.`, () => view(i, start, remain, "danger"));
          break;
        }
        path.push(candidates[i]);
        t.step("choose", `Take ${candidates[i]}; ${remain - candidates[i]} left.`, () => view(i, start, remain - candidates[i]));
        dfs(i, remain - candidates[i]);
        path.pop();
        t.step("undo", `Remove ${candidates[i]} and try the next candidate.`, () => view(i, start, remain));
      }
    };
    dfs(0, target);
    t.step("ret", `${res.length} combination(s).`, view());
    return res;
  },
});

const dp = defineSolution<Input>({
  id: "dp-by-sum",
  name: "DP over Sums",
  time: "O(n · T · k)",
  space: "O(T · k)",
  idea: "Like the coin-change table, but store the combinations themselves. Loop candidates in the outer loop so each combination is built in one order only.",
  code: code(`
    function combinationSum(candidates: number[], target: number): number[][] {
      // combos[sum] = every combination that adds up to sum
      const combos: number[][][] = Array.from({ length: target + 1 }, () => []);
      combos[0] = [[]]; //@init
      for (const candidate of candidates) { //@coin
        for (let sum = candidate; sum <= target; sum++) { //@sum
          for (const combo of combos[sum - candidate]) {
            combos[sum].push([...combo, candidate]); //@extend
          }
        }
      }
      return combos[target]; //@ret
    }
  `),
  run({ candidates, target }, t) {
    const dp: number[][][] = Array.from({ length: target + 1 }, () => []);
    dp[0] = [[]];
    const cell = (s: number) => dp[s].map((c) => `[${c}]`).join(" ") || "–";
    const view = (c?: number, s?: number) => [
      vars({ candidate: c }),
      arr("combos[sum]", dp.map((_, k) => cell(k)), { tones: tones([s !== undefined && c !== undefined ? s - c : null, "compare"], [s, "active"]) }),
    ];
    t.step("init", "The only way to make 0 is the empty combination.", view());
    for (const c of candidates) {
      t.step("coin", `Allow candidate ${c}.`, view(c));
      for (let s = c; s <= target; s++) {
        if (!dp[s - c].length) continue;
        for (const combo of dp[s - c]) dp[s].push([...combo, c]);
        t.step("extend", `Append ${c} to every way to make ${s - c}.`, () => view(c, s));
      }
    }
    t.step("ret", `dp[${target}] has ${dp[target].length} combination(s).`, view(undefined, target));
    return dp[target];
  },
});

export default defineProblem<Input>({
  description: "Given distinct integers candidates and a target, return all unique combinations of candidates that sum to target. The same number may be chosen any number of times.",
  input: { default: "candidates = [2,3,6,7], target = 7", parse: (a) => ({ candidates: a.ints("candidates"), target: a.int("target") }) },
  examples: [
    { input: "candidates = [2,3,6,7], target = 7", output: [[2, 2, 3], [7]] },
    { input: "candidates = [2,3,5], target = 8", output: [[2, 2, 2, 2], [2, 3, 3], [3, 5]] },
    { input: "candidates = [2], target = 1", output: [] },
  ],
  normalize: (v) => (v as number[][]).map((c) => [...c].sort((a, b) => a - b)).sort((a, b) => a.join().localeCompare(b.join())),
  solutions: [dp, backtrack],
});

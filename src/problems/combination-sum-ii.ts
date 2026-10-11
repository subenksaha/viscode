import { arr, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  candidates: number[];
  target: number;
}

const fmtSets = (res: number[][]) => res.map((r) => `[${r}]`);

const includeExclude = defineSolution<Input>({
  id: "include-exclude",
  name: "Include / Exclude + Set Dedupe",
  time: "O(2ⁿ · n)",
  space: "O(n)",
  idea: "Sort, then for each candidate either take it or not. Equal combinations come out identical after sorting, so a set of keys removes the duplicates.",
  approach: [
    {
      title: "Take the candidate",
      detail: "Branch 1: include candidates[i] and move to i + 1, since each number is used at most once.",
      at: "take",
    },
    {
      title: "Skip it",
      detail: "Branch 2: leave it out.",
      at: "skip",
    },
    {
      title: "Record unique hits",
      detail: "Sorted paths give identical keys for equal combinations, so a set filters duplicates. Duplicates are still generated, which wastes work.",
      at: "hit",
    },
  ],
  code: code(`
    function combinationSum2(candidates: number[], target: number): number[][] {
      candidates.sort((a, b) => a - b);
      const seen = new Set<string>();
      const result: number[][] = [];
      const path: number[] = [];
      function search(i: number, remain: number) {
        if (remain === 0) { //@hit
          const key = path.join(",");
          if (!seen.has(key)) {
            seen.add(key);
            result.push([...path]);
          }
          return;
        }
        if (i === candidates.length || candidates[i] > remain) return; //@stop
        path.push(candidates[i]); //@take
        search(i + 1, remain - candidates[i]);
        path.pop();
        search(i + 1, remain); //@skip
      }
      search(0, target);
      return result; //@ret
    }
  `),
  run({ candidates, target }, t) {
    candidates.sort((a, b) => a - b);
    const seen = new Set<string>(),
      res: number[][] = [],
      path: number[] = [];
    const view = (i: number, remain: number, tone: Tone = "active") => [
      vars({ remain, path: `[${path}]` }),
      arr("candidates", candidates, { tones: tones([i < candidates.length ? i : null, tone]), pointers: { i: i < candidates.length ? i : null } }),
      arr("result", fmtSets(res), { indexLabels: false, tones: tones([res.length - 1, "success"]) }),
    ];
    const dfs = (i: number, remain: number) => {
      if (remain === 0) {
        const key = path.join(",");
        if (!seen.has(key)) {
          seen.add(key);
          res.push([...path]);
          t.step("hit", `[${path}] sums to ${target}. New combination.`, () => view(i, remain, "success"));
        } else t.step("hit", `[${path}] was already found.`, () => view(i, remain, "danger"));
        return;
      }
      if (i === candidates.length || candidates[i] > remain) return;
      path.push(candidates[i]);
      t.step("take", `Take ${candidates[i]}.`, () => view(i, remain - candidates[i]));
      dfs(i + 1, remain - candidates[i]);
      path.pop();
      t.step("skip", `Skip ${candidates[i]}.`, () => view(i, remain, "muted"));
      dfs(i + 1, remain);
    };
    dfs(0, target);
    t.step("ret", `${res.length} combinations.`, view(candidates.length, 0));
    return res;
  },
});

const skipDuplicates = defineSolution<Input>({
  id: "backtracking",
  name: "Backtracking, Skip Equal Siblings",
  time: "O(2ⁿ · n)",
  space: "O(n)",
  idea: "Sort, then at each depth loop over the remaining candidates. Skip a value equal to the previous sibling (it would start the same combinations again) and stop once a value exceeds what is left.",
  approach: [
    {
      title: "Choose from the remaining candidates",
      detail: "Loop i from start and recurse on i + 1.",
      at: "choose",
    },
    {
      title: "Skip equal siblings",
      detail: "At the same depth, a value equal to the previous one would start the same combinations again.",
      at: "dup",
    },
    {
      title: "Stop when too big",
      detail: "Sorted order means every later candidate is too big as well.",
      at: "stop",
    },
    {
      title: "Record",
      detail: "A remainder of 0 is a unique combination. No dedupe set is needed.",
      at: "hit",
    },
  ],
  code: code(`
    function combinationSum2(candidates: number[], target: number): number[][] {
      candidates.sort((a, b) => a - b);
      const result: number[][] = [];
      const path: number[] = [];
      function search(start: number, remain: number) {
        if (remain === 0) { //@hit
          result.push([...path]);
          return;
        }
        for (let i = start; i < candidates.length; i++) {
          const sameAsPrevious = i > start && candidates[i] === candidates[i - 1];
          if (sameAsPrevious) continue; //@dup
          if (candidates[i] > remain) break; //@stop
          path.push(candidates[i]); //@choose
          search(i + 1, remain - candidates[i]);
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
    const view = (start: number, remain: number, i?: number, tone: Tone = "active") => [
      vars({ remain, path: `[${path}]` }),
      arr("candidates", candidates, { tones: tones(...candidates.map((_, k) => [k < start ? k : null, "muted"] as [number | null, Tone]), [i, tone]), pointers: { start: start < candidates.length ? start : null, i } }),
      arr("result", fmtSets(res), { indexLabels: false, tones: tones([res.length - 1, "success"]) }),
    ];
    const dfs = (start: number, remain: number) => {
      if (remain === 0) {
        res.push([...path]);
        t.step("hit", `[${path}] sums to ${target}.`, () => view(start, remain));
        return;
      }
      for (let i = start; i < candidates.length; i++) {
        if (i > start && candidates[i] === candidates[i - 1]) {
          t.step("dup", `${candidates[i]} repeats its sibling. Skip.`, () => view(start, remain, i, "danger"));
          continue;
        }
        if (candidates[i] > remain) {
          t.step("stop", `${candidates[i]} > ${remain}: nothing further fits.`, () => view(start, remain, i, "danger"));
          break;
        }
        path.push(candidates[i]);
        t.step("choose", `Take ${candidates[i]}; ${remain - candidates[i]} left.`, () => view(start, remain - candidates[i], i));
        dfs(i + 1, remain - candidates[i]);
        path.pop();
        t.step("undo", `Drop ${candidates[i]}.`, () => view(start, remain, i));
      }
    };
    dfs(0, target);
    t.step("ret", `${res.length} combinations.`, view(candidates.length, 0));
    return res;
  },
});

export default defineProblem<Input>({
  description: "Given candidates (which may contain duplicates) and a target, return all unique combinations whose numbers sum to target. Each number may be used at most once.",
  input: { default: "candidates = [10,1,2,7,6,1,5], target = 8", parse: (a) => ({ candidates: a.ints("candidates"), target: a.int("target") }) },
  examples: [
    { input: "candidates = [10,1,2,7,6,1,5], target = 8", output: [[1, 1, 6], [1, 2, 5], [1, 7], [2, 6]] },
    { input: "candidates = [2,5,2,1,2], target = 5", output: [[1, 2, 2], [5]] },
  ],
  normalize: (v) => (v as number[][]).map((s) => [...s].sort((a, b) => a - b).join()).sort(),
  solutions: [includeExclude, skipDuplicates],
});

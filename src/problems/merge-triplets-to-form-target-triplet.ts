import { arr, grid, rc, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  triplets: number[][];
  target: number[];
}

const mergeUsable = defineSolution<Input>({
  id: "merge-usable",
  name: "Merge Every Safe Triplet",
  time: "O(n)",
  space: "O(1)",
  idea: "A triplet with any value above the target can never be used (merging only takes maxima). Merging all the other triplets is always safe; check whether that merge equals the target.",
  code: code(`
    function mergeTriplets(triplets: number[][], target: number[]): boolean {
      const cur = [0, 0, 0]; //@init
      for (const t of triplets) {
        if (t[0] > target[0] || t[1] > target[1] || t[2] > target[2]) continue; //@skip
        for (let k = 0; k < 3; k++) cur[k] = Math.max(cur[k], t[k]); //@merge
      }
      return cur.every((v, k) => v === target[k]); //@ret
    }
  `),
  run({ triplets, target }, t) {
    const cur = [0, 0, 0];
    const rowTones: Record<string, Tone> = {};
    const view = (i?: number) => [
      arr("target", target),
      grid("triplets", triplets, { tones: { ...rowTones, ...(i !== undefined ? tones(...[0, 1, 2].map((k) => [rc(i, k), "active"] as [string, Tone])) : {}) } }),
      arr("merged", cur, { tones: tones(...cur.map((v, k) => [k, v === target[k] ? "success" : "muted"] as [number, Tone])) }),
    ];
    t.step("init", "Start from [0, 0, 0].", view());
    triplets.forEach((tr, i) => {
      if (tr.some((v, k) => v > target[k])) {
        [0, 1, 2].forEach((k) => (rowTones[rc(i, k)] = tr[k] > target[k] ? "danger" : "muted"));
        t.step("skip", `[${tr}] exceeds the target somewhere. Never use it.`, view());
        return;
      }
      for (let k = 0; k < 3; k++) cur[k] = Math.max(cur[k], tr[k]);
      [0, 1, 2].forEach((k) => (rowTones[rc(i, k)] = "success"));
      t.step("merge", `Merge [${tr}] → [${cur}].`, view());
    });
    const ok = cur.every((v, k) => v === target[k]);
    t.step("ret", ok ? "Merged triplet equals the target." : `Merged [${cur}] ≠ target.`, view());
    return ok;
  },
});

const coverFlags = defineSolution<Input>({
  id: "cover-flags",
  name: "Track Which Positions Are Covered",
  time: "O(n)",
  space: "O(1)",
  idea: "Only the three target values matter. Among safe triplets (nothing above the target), note which positions hit the target value exactly. All three must be covered.",
  code: code(`
    function mergeTriplets(triplets: number[][], target: number[]): boolean {
      const hit = [false, false, false]; //@init
      for (const t of triplets) {
        if (t.some((v, k) => v > target[k])) continue; //@skip
        t.forEach((v, k) => { if (v === target[k]) hit[k] = true; }); //@cover
      }
      return hit.every(Boolean); //@ret
    }
  `),
  run({ triplets, target }, t) {
    const hit = [false, false, false];
    const view = (i?: number) => [
      vars({ triplet: i !== undefined ? `[${triplets[i]}]` : undefined }),
      arr("target", target, { tones: tones(...hit.map((h, k) => [k, h ? "success" : "muted"] as [number, Tone])) }),
      arr("covered", hit, { tones: tones(...hit.map((h, k) => [k, h ? "success" : "muted"] as [number, Tone])) }),
    ];
    t.step("init", "No position covered yet.", view());
    triplets.forEach((tr, i) => {
      if (tr.some((v, k) => v > target[k])) {
        t.step("skip", `[${tr}] overshoots. Skip it.`, view(i));
        return;
      }
      tr.forEach((v, k) => v === target[k] && (hit[k] = true));
      t.step("cover", `[${tr}] covers positions [${tr.flatMap((v, k) => (v === target[k] ? [k] : []))}].`, view(i));
    });
    const ok = hit.every(Boolean);
    t.step("ret", ok ? "All three positions covered." : "Some position can't reach its target value.", view());
    return ok;
  },
});

export default defineProblem<Input>({
  description: "Merging triplets a and b gives [max(a0,b0), max(a1,b1), max(a2,b2)]. Given a list of triplets and a target triplet, return true if some sequence of merges can produce the target as one of the triplets.",
  input: { default: "triplets = [[2,5,3],[1,8,4],[1,7,5]], target = [2,7,5]", parse: (a) => ({ triplets: a.matrix<number>("triplets"), target: a.ints("target") }) },
  examples: [
    { input: "triplets = [[2,5,3],[1,8,4],[1,7,5]], target = [2,7,5]", output: true },
    { input: "triplets = [[3,4,5],[4,5,6]], target = [3,2,5]", output: false },
    { input: "triplets = [[2,5,3],[2,3,4],[1,2,5],[5,2,3]], target = [5,5,5]", output: true },
  ],
  solutions: [mergeUsable, coverFlags],
});

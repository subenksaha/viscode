import { arr, map, text, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  nums: number[];
}

const show = (res: number[][]) => res.map((r) => `[${r}]`).join(" ");

const bruteForce = defineSolution<Input>({
  id: "brute-force",
  name: "Brute Force",
  time: "O(n³)",
  space: "O(k)",
  idea: "Sort first so equal triplets look identical, then try every triple and dedupe with a set of keys.",
  code: code(`
    function threeSum(nums: number[]): number[][] {
      nums.sort((a, b) => a - b); //@sort
      const seen = new Set<string>(), res: number[][] = [];
      for (let i = 0; i < nums.length; i++) //@i
        for (let j = i + 1; j < nums.length; j++)
          for (let k = j + 1; k < nums.length; k++) { //@k
            if (nums[i] + nums[j] + nums[k] !== 0) continue; //@check
            const key = [nums[i], nums[j], nums[k]].join(",");
            if (!seen.has(key)) { seen.add(key); res.push([nums[i], nums[j], nums[k]]); } //@add
          }
      return res; //@ret
    }
  `),
  run({ nums }, t) {
    nums.sort((a, b) => a - b);
    const seen = new Set<string>(),
      res: number[][] = [];
    const view = (i?: number, j?: number, k?: number, tone: "active" | "success" = "active") => [
      arr("nums (sorted)", nums, { tones: tones([i, tone], [j, tone], [k, tone]), pointers: { i, j, k } }),
      text("result", show(res)),
    ];
    t.step("sort", "Sort nums.", view());
    for (let i = 0; i < nums.length; i++) {
      t.step("i", `i = ${i}.`, view(i));
      for (let j = i + 1; j < nums.length; j++)
        for (let k = j + 1; k < nums.length; k++) {
          const sum = nums[i] + nums[j] + nums[k];
          t.step("k", `${nums[i]} + ${nums[j]} + ${nums[k]} = ${sum}.`, () => view(i, j, k));
          if (sum !== 0) continue;
          const key = [nums[i], nums[j], nums[k]].join(",");
          if (!seen.has(key)) {
            seen.add(key);
            res.push([nums[i], nums[j], nums[k]]);
            t.step("add", `Sum is 0. Add [${key}].`, () => view(i, j, k, "success"));
          } else t.step("check", `Sum is 0 but [${key}] is already in the result.`, () => view(i, j, k));
        }
    }
    t.step("ret", `Return ${res.length} triplet(s).`, view());
    return res;
  },
});

const hashSet = defineSolution<Input>({
  id: "hash-set",
  name: "Sort + Hash Set per Anchor",
  time: "O(n²)",
  space: "O(n)",
  idea: "Fix nums[i], then run Two Sum with a hash set on the rest for target −nums[i]. Sorting lets us skip duplicates.",
  code: code(`
    function threeSum(nums: number[]): number[][] {
      nums.sort((a, b) => a - b); //@sort
      const res: number[][] = [];
      for (let i = 0; i < nums.length; i++) { //@i
        if (i > 0 && nums[i] === nums[i - 1]) continue; //@skip-i
        const seen = new Set<number>(); //@reset
        for (let j = i + 1; j < nums.length; j++) { //@j
          const need = -nums[i] - nums[j];
          if (seen.has(need)) { //@check
            res.push([nums[i], need, nums[j]]); //@add
            while (j + 1 < nums.length && nums[j] === nums[j + 1]) j++; //@skip-j
          }
          seen.add(nums[j]); //@store
        }
      }
      return res; //@ret
    }
  `),
  run({ nums }, t) {
    nums.sort((a, b) => a - b);
    const res: number[][] = [];
    let seen = new Set<number>();
    const view = (i?: number, j?: number, need?: number, hit = false) => [
      vars({ need }),
      arr("nums (sorted)", nums, { tones: tones([i, "active"], [j, hit ? "success" : "compare"]), pointers: { i, j } }),
      map("seen", seen, tones([need, hit ? "success" : "compare"])),
      text("result", show(res)),
    ];
    t.step("sort", "Sort nums.", view());
    for (let i = 0; i < nums.length; i++) {
      t.step("i", `Anchor nums[${i}] = ${nums[i]}.`, view(i));
      if (i > 0 && nums[i] === nums[i - 1]) {
        t.step("skip-i", "Same anchor as before. Skip it to avoid duplicates.", view(i));
        continue;
      }
      seen = new Set();
      t.step("reset", "Fresh set for this anchor.", view(i));
      for (let j = i + 1; j < nums.length; j++) {
        const need = -nums[i] - nums[j];
        t.step("j", `j = ${j}: need ${need}.`, view(i, j, need));
        if (seen.has(need)) {
          res.push([nums[i], need, nums[j]]);
          t.step("add", `${need} was seen. Add [${nums[i]},${need},${nums[j]}].`, view(i, j, need, true));
          while (j + 1 < nums.length && nums[j] === nums[j + 1]) j++;
          t.step("skip-j", "Skip equal values of nums[j].", view(i, j));
        }
        seen.add(nums[j]);
        t.step("store", `Add ${nums[j]} to seen.`, view(i, j));
      }
    }
    t.step("ret", `Return ${res.length} triplet(s).`, view());
    return res;
  },
});

const twoPointers = defineSolution<Input>({
  id: "two-pointers",
  name: "Sort + Two Pointers",
  time: "O(n²)",
  space: "O(1)",
  idea: "Sort, fix nums[i], then move lo and hi inward on the rest: a small sum moves lo right, a big sum moves hi left. Skip equal values to avoid duplicates.",
  code: code(`
    function threeSum(nums: number[]): number[][] {
      nums.sort((a, b) => a - b); //@sort
      const res: number[][] = [];
      for (let i = 0; i < nums.length - 2; i++) { //@i
        if (nums[i] > 0) break; //@stop
        if (i > 0 && nums[i] === nums[i - 1]) continue; //@skip
        let lo = i + 1, hi = nums.length - 1; //@init
        while (lo < hi) { //@loop
          const sum = nums[i] + nums[lo] + nums[hi]; //@sum
          if (sum < 0) lo++; //@lo
          else if (sum > 0) hi--; //@hi
          else {
            res.push([nums[i], nums[lo], nums[hi]]); //@add
            while (lo < hi && nums[lo] === nums[lo + 1]) lo++; //@dedupe
            while (lo < hi && nums[hi] === nums[hi - 1]) hi--;
            lo++; hi--; //@move
          }
        }
      }
      return res; //@ret
    }
  `),
  run({ nums }, t) {
    nums.sort((a, b) => a - b);
    const res: number[][] = [];
    const view = (i?: number, lo?: number, hi?: number, sum?: number, hit = false) => [
      vars({ sum }),
      arr("nums (sorted)", nums, {
        tones: tones([i, "active"], [lo, hit ? "success" : "compare"], [hi, hit ? "success" : "compare"]),
        pointers: { i, lo, hi },
      }),
      text("result", show(res)),
    ];
    t.step("sort", "Sort nums.", view());
    for (let i = 0; i < nums.length - 2; i++) {
      t.step("i", `Anchor nums[${i}] = ${nums[i]}.`, view(i));
      if (nums[i] > 0) {
        t.step("stop", "Anchor is positive, so no triplet can sum to 0. Stop.", view(i));
        break;
      }
      if (i > 0 && nums[i] === nums[i - 1]) {
        t.step("skip", "Duplicate anchor. Skip it.", view(i));
        continue;
      }
      let lo = i + 1,
        hi = nums.length - 1;
      t.step("init", `lo = ${lo}, hi = ${hi}.`, view(i, lo, hi));
      while (lo < hi) {
        const sum = nums[i] + nums[lo] + nums[hi];
        t.step("sum", `${nums[i]} + ${nums[lo]} + ${nums[hi]} = ${sum}.`, view(i, lo, hi, sum));
        if (sum < 0) {
          lo++;
          t.step("lo", "Too small: lo++.", view(i, lo, hi));
        } else if (sum > 0) {
          hi--;
          t.step("hi", "Too big: hi--.", view(i, lo, hi));
        } else {
          res.push([nums[i], nums[lo], nums[hi]]);
          t.step("add", `Zero sum. Add [${nums[i]},${nums[lo]},${nums[hi]}].`, view(i, lo, hi, sum, true));
          while (lo < hi && nums[lo] === nums[lo + 1]) lo++;
          while (lo < hi && nums[hi] === nums[hi - 1]) hi--;
          t.step("dedupe", "Skip past equal values.", view(i, lo, hi));
          lo++;
          hi--;
          t.step("move", "Move both pointers inward.", view(i, lo, hi));
        }
      }
    }
    t.step("ret", `Return ${res.length} triplet(s).`, view());
    return res;
  },
});

export default defineProblem<Input>({
  description:
    "Return all unique triplets [a, b, c] from nums with a + b + c = 0. The result must not contain duplicate triplets.",
  input: { default: "nums = [-1,0,1,2,-1,-4]", parse: (a) => ({ nums: a.ints("nums") }) },
  examples: [
    { input: "nums = [-1,0,1,2,-1,-4]", output: [[-1, -1, 2], [-1, 0, 1]] },
    { input: "nums = [0,1,1]", output: [] },
    { input: "nums = [0,0,0,0]", output: [[0, 0, 0]] },
    { input: "nums = [-2,0,0,2,2]", output: [[-2, 0, 2]] },
  ],
  normalize: (v) =>
    (v as number[][])
      .map((r) => [...r].sort((a, b) => a - b))
      .sort((a, b) => a.join().localeCompare(b.join())),
  solutions: [bruteForce, hashSet, twoPointers],
});

import { arr, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  nums1: number[];
  nums2: number[];
}

const merge = defineSolution<Input>({
  id: "merge",
  name: "Merge Until the Middle",
  time: "O(m + n)",
  space: "O(1)",
  idea: "Walk both arrays like the merge step of merge sort, but stop once the middle element(s) have been passed.",
  code: code(`
    function findMedianSortedArrays(a: number[], b: number[]): number {
      const total = a.length + b.length;
      let i = 0, j = 0, prev = 0, cur = 0;
      for (let k = 0; k <= total >> 1; k++) { //@step
        prev = cur;
        cur = j >= b.length || (i < a.length && a[i] <= b[j]) ? a[i++] : b[j++]; //@take
      }
      return total % 2 ? cur : (prev + cur) / 2; //@ret
    }
  `),
  run({ nums1: a, nums2: b }, t) {
    const total = a.length + b.length;
    let i = 0,
      j = 0,
      prev = 0,
      cur = 0;
    const view = (fromA?: boolean) => [
      vars({ k: i + j, target: total >> 1, prev, cur }),
      arr("nums1", a, { tones: tones(...a.map((_, k) => [k < i ? k : null, "muted"] as [number | null, Tone]), [fromA ? i - 1 : null, "active"]), pointers: { i } }),
      arr("nums2", b, { tones: tones(...b.map((_, k) => [k < j ? k : null, "muted"] as [number | null, Tone]), [fromA === false ? j - 1 : null, "active"]), pointers: { j } }),
    ];
    for (let k = 0; k <= total >> 1; k++) {
      prev = cur;
      const fromA = j >= b.length || (i < a.length && a[i] <= b[j]);
      cur = fromA ? a[i++] : b[j++];
      t.step("take", `Merged element #${k} is ${cur}.`, view(fromA));
    }
    const res = total % 2 ? cur : (prev + cur) / 2;
    t.step("ret", total % 2 ? `Odd total: median = ${cur}.` : `Even total: median = (${prev} + ${cur}) / 2 = ${res}.`, view());
    return res;
  },
});

const partition = defineSolution<Input>({
  id: "binary-search-partition",
  name: "Binary Search the Partition",
  time: "O(log min(m, n))",
  space: "O(1)",
  idea: "Cut both arrays so the left halves together hold half the elements. Binary-search the cut in the shorter array until every left value is ≤ every right value; the median sits at the cut.",
  code: code(`
    function findMedianSortedArrays(a: number[], b: number[]): number {
      if (a.length > b.length) [a, b] = [b, a];
      const m = a.length, n = b.length, half = (m + n + 1) >> 1;
      let lo = 0, hi = m; //@init
      while (lo <= hi) {
        const i = (lo + hi) >> 1, j = half - i; //@cut
        const aL = i ? a[i - 1] : -Infinity, aR = i < m ? a[i] : Infinity;
        const bL = j ? b[j - 1] : -Infinity, bR = j < n ? b[j] : Infinity;
        if (aL <= bR && bL <= aR) //@check
          return (m + n) % 2 ? Math.max(aL, bL) : (Math.max(aL, bL) + Math.min(aR, bR)) / 2; //@ret
        if (aL > bR) hi = i - 1; //@left
        else lo = i + 1; //@right
      }
      return 0;
    }
  `),
  run({ nums1, nums2 }, t) {
    let a = nums1,
      b = nums2;
    if (a.length > b.length) [a, b] = [b, a];
    const m = a.length,
      n = b.length,
      half = (m + n + 1) >> 1;
    let lo = 0,
      hi = m;
    const side = (len: number, cut: number, tone: Tone) => tones(...Array.from({ length: len }, (_, k) => [k, k < cut ? tone : "muted"] as [number, Tone]));
    const view = (i?: number, j?: number, tone: Tone = "compare") => [
      vars({ lo, hi, i, j, half }),
      arr("shorter (a)", a, { tones: i !== undefined ? side(m, i, tone) : {}, pointers: { cut: i !== undefined && i < m ? i : null } }),
      arr("longer (b)", b, { tones: j !== undefined ? side(n, j, tone) : {}, pointers: { cut: j !== undefined && j < n ? j : null } }),
    ];
    t.step("init", `Binary search the cut in a over [0, ${m}]. Left halves must hold ${half} values.`, view());
    while (lo <= hi) {
      const i = (lo + hi) >> 1,
        j = half - i;
      const aL = i ? a[i - 1] : -Infinity,
        aR = i < m ? a[i] : Infinity;
      const bL = j ? b[j - 1] : -Infinity,
        bR = j < n ? b[j] : Infinity;
      t.step("cut", `Cut a before index ${i} and b before index ${j}. aL=${aL}, aR=${aR}, bL=${bL}, bR=${bR}.`, view(i, j));
      if (aL <= bR && bL <= aR) {
        const res = (m + n) % 2 ? Math.max(aL, bL) : (Math.max(aL, bL) + Math.min(aR, bR)) / 2;
        t.step("check", "Every left value ≤ every right value. Valid partition.", view(i, j, "success"));
        t.step("ret", (m + n) % 2 ? `Median = max(aL, bL) = ${res}.` : `Median = (max(aL, bL) + min(aR, bR)) / 2 = ${res}.`, view(i, j, "success"));
        return res;
      }
      if (aL > bR) {
        hi = i - 1;
        t.step("left", `aL ${aL} > bR ${bR}: too much of a on the left. Move the cut left.`, view(i, j, "danger"));
      } else {
        lo = i + 1;
        t.step("right", `bL ${bL} > aR ${aR}: too little of a on the left. Move the cut right.`, view(i, j, "danger"));
      }
    }
    return 0;
  },
});

export default defineProblem<Input>({
  description: "Given two sorted arrays nums1 and nums2, return the median of the two arrays combined. The overall run time should be O(log(m + n)).",
  input: { default: "nums1 = [1,3,8,9,15], nums2 = [7,11,18,19,21,25]", parse: (a) => ({ nums1: a.ints("nums1"), nums2: a.ints("nums2") }) },
  examples: [
    { input: "nums1 = [1,3], nums2 = [2]", output: 2 },
    { input: "nums1 = [1,2], nums2 = [3,4]", output: 2.5 },
    { input: "nums1 = [], nums2 = [1]", output: 1 },
    { input: "nums1 = [1,3,8,9,15], nums2 = [7,11,18,19,21,25]", output: 11 },
  ],
  solutions: [merge, partition],
});

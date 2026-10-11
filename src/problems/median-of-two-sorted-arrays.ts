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
  approach: [
    {
      title: "Merge step by step",
      detail: "Take the smaller front element, as in merge sort.",
      at: "take",
    },
    {
      title: "Stop at the middle",
      detail: "Only ⌊total / 2⌋ + 1 elements need merging.",
      at: "take",
      nth: -1,
    },
    {
      title: "Median",
      detail: "Odd total: the last element taken. Even: the average of the last two. O(m + n).",
      at: "ret",
    },
  ],
  code: code(`
    function findMedianSortedArrays(nums1: number[], nums2: number[]): number {
      const total = nums1.length + nums2.length;
      const middle = Math.floor(total / 2);
      let i = 0; // next unused index in nums1
      let j = 0; // next unused index in nums2
      let previous = 0;
      let current = 0;
      // Merge just far enough to reach the middle element.
      for (let count = 0; count <= middle; count++) { //@step
        previous = current;
        const takeFromNums1 = j >= nums2.length || (i < nums1.length && nums1[i] <= nums2[j]);
        if (takeFromNums1) { //@take
          current = nums1[i];
          i++;
        } else {
          current = nums2[j];
          j++;
        }
      }
      if (total % 2 === 1) return current; //@ret
      return (previous + current) / 2;
    }
  `),
  run({ nums1: a, nums2: b }, t) {
    const total = a.length + b.length;
    let i = 0,
      j = 0,
      prev = 0,
      cur = 0;
    const view = (fromA?: boolean) => [
      vars({ count: i + j, middle: total >> 1, previous: prev, current: cur }),
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
  approach: [
    {
      title: "Cut the shorter array",
      detail: "The left halves of both arrays must together hold ⌈(m + n) / 2⌉ elements, so choosing the cut in the short array fixes the cut in the long one.",
      at: "init",
    },
    {
      title: "Try a cut",
      detail: "Look at the four values around the two cuts.",
      at: "cut",
    },
    {
      title: "Move the cut",
      detail: "If longLeft > shortRight, too few short elements are on the left, so move right. If shortLeft > longRight, move left.",
      at: "right",
    },
    {
      title: "Valid partition",
      detail: "Every left value is ≤ every right value.",
      at: "check",
    },
    {
      title: "Median at the cut",
      detail: "Odd total: max of the left side. Even: the average of max(left) and min(right). O(log min(m, n)).",
      at: "ret",
    },
  ],
  code: code(`
    function findMedianSortedArrays(nums1: number[], nums2: number[]): number {
      // Binary search over the shorter array.
      const short = nums1.length <= nums2.length ? nums1 : nums2;
      const long = nums1.length <= nums2.length ? nums2 : nums1;
      const m = short.length;
      const n = long.length;
      const leftSize = Math.floor((m + n + 1) / 2); // how many elements go in the left half
      let low = 0; //@init
      let high = m;
      while (low <= high) {
        // Take shortCut items from short and longCut items from long for the left half.
        const shortCut = Math.floor((low + high) / 2); //@cut
        const longCut = leftSize - shortCut;
        const shortLeft = shortCut > 0 ? short[shortCut - 1] : -Infinity;
        const shortRight = shortCut < m ? short[shortCut] : Infinity;
        const longLeft = longCut > 0 ? long[longCut - 1] : -Infinity;
        const longRight = longCut < n ? long[longCut] : Infinity;
        if (shortLeft <= longRight && longLeft <= shortRight) { //@check
          // Every left-half value is <= every right-half value: found the split.
          const leftMax = Math.max(shortLeft, longLeft);
          const rightMin = Math.min(shortRight, longRight);
          return (m + n) % 2 === 1 ? leftMax : (leftMax + rightMin) / 2; //@ret
        }
        if (shortLeft > longRight) {
          high = shortCut - 1; // took too many from short //@left
        } else {
          low = shortCut + 1; // took too few from short //@right
        }
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
      vars({ low: lo, high: hi, shortCut: i, longCut: j, leftSize: half }),
      arr("short", a, { tones: i !== undefined ? side(m, i, tone) : {}, pointers: { cut: i !== undefined && i < m ? i : null } }),
      arr("long", b, { tones: j !== undefined ? side(n, j, tone) : {}, pointers: { cut: j !== undefined && j < n ? j : null } }),
    ];
    t.step("init", `Binary search the cut in short over [0, ${m}]. The left half must hold ${half} values.`, view());
    while (lo <= hi) {
      const i = (lo + hi) >> 1,
        j = half - i;
      const aL = i ? a[i - 1] : -Infinity,
        aR = i < m ? a[i] : Infinity;
      const bL = j ? b[j - 1] : -Infinity,
        bR = j < n ? b[j] : Infinity;
      t.step("cut", `Cut short before index ${i} and long before index ${j}. shortLeft=${aL}, shortRight=${aR}, longLeft=${bL}, longRight=${bR}.`, view(i, j));
      if (aL <= bR && bL <= aR) {
        const res = (m + n) % 2 ? Math.max(aL, bL) : (Math.max(aL, bL) + Math.min(aR, bR)) / 2;
        t.step("check", "Every left value ≤ every right value. Valid partition.", view(i, j, "success"));
        t.step("ret", (m + n) % 2 ? `Median = leftMax = ${res}.` : `Median = (leftMax + rightMin) / 2 = ${res}.`, view(i, j, "success"));
        return res;
      }
      if (aL > bR) {
        hi = i - 1;
        t.step("left", `shortLeft ${aL} > longRight ${bR}: too much of short on the left. Move the cut left.`, view(i, j, "danger"));
      } else {
        lo = i + 1;
        t.step("right", `longLeft ${bL} > shortRight ${aR}: too little of short on the left. Move the cut right.`, view(i, j, "danger"));
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

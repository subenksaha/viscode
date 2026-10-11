import { arr, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  nums: number[];
}

// -0 shows up when multiplying zeros by negatives; LeetCode expects 0.
const clean = (xs: number[]) => xs.map((x) => (Object.is(x, -0) ? 0 : x));

const bruteForce = defineSolution<Input>({
  id: "brute-force",
  name: "Brute Force",
  time: "O(n²)",
  space: "O(1)",
  idea: "For each index, multiply every other element.",
  code: code(`
    function productExceptSelf(nums: number[]): number[] {
      const answer = new Array(nums.length).fill(1); //@init
      for (let i = 0; i < nums.length; i++) { //@i
        for (let j = 0; j < nums.length; j++) { //@j
          if (j !== i) answer[i] *= nums[j]; //@mul
        }
      }
      return answer; //@ret
    }
  `),
  run({ nums }, t) {
    const out = new Array(nums.length).fill(1);
    const view = (i?: number, j?: number) => [
      arr("nums", nums, { tones: tones([i, "muted"], [j !== i ? j : null, "compare"]), pointers: { i, j } }),
      arr("answer", out, { tones: tones([i, "active"]) }),
    ];
    t.step("init", "Fill out with 1s.", view());
    for (let i = 0; i < nums.length; i++) {
      t.step("i", `Compute answer[${i}].`, view(i));
      for (let j = 0; j < nums.length; j++) {
        if (j !== i) {
          out[i] *= nums[j];
          t.step("mul", `answer[${i}] *= ${nums[j]} → ${out[i]}.`, view(i, j));
        } else t.step("j", `Skip j = i.`, view(i, j));
      }
    }
    t.step("ret", "Return out.", view());
    return clean(out);
  },
});

const prefixSuffix = defineSolution<Input>({
  id: "prefix-suffix",
  name: "Prefix & Suffix Arrays",
  time: "O(n)",
  space: "O(n)",
  idea: "out[i] = (product of everything left of i) × (product of everything right of i). Build both arrays, then multiply.",
  code: code(`
    function productExceptSelf(nums: number[]): number[] {
      const n = nums.length;
      const before = new Array(n).fill(1); // before[i] = product of everything left of i //@init
      const after = new Array(n).fill(1);  // after[i] = product of everything right of i
      for (let i = 1; i < n; i++) before[i] = before[i - 1] * nums[i - 1]; //@pre
      for (let i = n - 2; i >= 0; i--) after[i] = after[i + 1] * nums[i + 1]; //@suf
      const answer: number[] = [];
      for (let i = 0; i < n; i++) answer.push(before[i] * after[i]); //@combine
      return answer;
    }
  `),
  run({ nums }, t) {
    const n = nums.length;
    const pre = new Array(n).fill(1),
      suf = new Array(n).fill(1);
    const out: (number | null)[] = new Array(n).fill(null);
    const view = (i?: number, src?: number) => [
      arr("nums", nums, { tones: tones([src, "compare"]) }),
      arr("before", pre, { tones: tones([i, "active"]) }),
      arr("after", suf, { tones: tones([i, "active"]) }),
      arr("answer", out, { tones: tones([i, "success"]) }),
    ];
    t.step("init", "Both arrays start at 1.", view());
    for (let i = 1; i < n; i++) {
      pre[i] = pre[i - 1] * nums[i - 1];
      t.step("pre", `before[${i}] = before[${i - 1}] × nums[${i - 1}] = ${pre[i]}.`, view(i, i - 1));
    }
    for (let i = n - 2; i >= 0; i--) {
      suf[i] = suf[i + 1] * nums[i + 1];
      t.step("suf", `after[${i}] = after[${i + 1}] × nums[${i + 1}] = ${suf[i]}.`, view(i, i + 1));
    }
    for (let i = 0; i < n; i++) {
      out[i] = pre[i] * suf[i];
      t.step("combine", `answer[${i}] = ${pre[i]} × ${suf[i]} = ${out[i]}.`, view(i));
    }
    return clean(out as number[]);
  },
});

const constantSpace = defineSolution<Input>({
  id: "running-products",
  name: "Running Products, O(1) Extra Space",
  time: "O(n)",
  space: "O(1)",
  idea: "Store prefix products in the output, then sweep right to left with a running suffix product.",
  code: code(`
    function productExceptSelf(nums: number[]): number[] {
      const n = nums.length;
      const answer = new Array(n).fill(1); //@init
      // First pass: answer[i] = product of everything left of i.
      for (let i = 1; i < n; i++) answer[i] = answer[i - 1] * nums[i - 1]; //@pre
      // Second pass: multiply in the product of everything right of i.
      let productAfter = 1; //@sufinit
      for (let i = n - 1; i >= 0; i--) { //@loop
        answer[i] *= productAfter; //@mul
        productAfter *= nums[i]; //@grow
      }
      return answer; //@ret
    }
  `),
  run({ nums }, t) {
    const n = nums.length,
      out = new Array(n).fill(1);
    let suffix: number | undefined;
    const view = (i?: number, src?: number) => [
      vars({ productAfter: suffix }),
      arr("nums", nums, { tones: tones([src, "compare"]) }),
      arr("answer", out, { tones: tones([i, "active"]), pointers: { i } }),
    ];
    t.step("init", "out starts as all 1s.", view());
    for (let i = 1; i < n; i++) {
      out[i] = out[i - 1] * nums[i - 1];
      t.step("pre", `answer[${i}] = product before it = ${out[i]}.`, view(i, i - 1));
    }
    suffix = 1;
    t.step("sufinit", "suffix = 1 (nothing to the right of the last index).", view());
    for (let i = n - 1; i >= 0; i--) {
      t.step("loop", `i = ${i}.`, view(i));
      out[i] *= suffix;
      t.step("mul", `answer[${i}] *= ${suffix} → ${out[i]}.`, view(i));
      suffix *= nums[i];
      t.step("grow", `suffix *= ${nums[i]} → ${suffix}.`, view(i, i));
    }
    t.step("ret", "Return out.", view());
    return clean(out);
  },
});

const division = defineSolution<Input>({
  id: "division",
  name: "Total Product ÷ Self (Zero-aware)",
  time: "O(n)",
  space: "O(1)",
  idea: "Multiply all non-zero values and count zeros. Two or more zeros make everything 0; exactly one zero leaves only that index non-zero. (LeetCode asks you not to use division, but it is a valid approach to know.)",
  code: code(`
    function productExceptSelf(nums: number[]): number[] {
      let product = 1; // product of all non-zero numbers //@init
      let zeros = 0;
      for (const num of nums) { //@scan
        if (num === 0) zeros++;
        else product *= num;
      }
      const answer: number[] = [];
      for (const num of nums) { //@map
        if (zeros > 1) {
          answer.push(0); // every product includes a zero //@many
        } else if (zeros === 1) {
          answer.push(num === 0 ? product : 0); // only the zero's slot is non-zero //@one
        } else {
          answer.push(product / num); //@div
        }
      }
      return answer;
    }
  `),
  run({ nums }, t) {
    let product = 1,
      zeros = 0;
    const out: (number | null)[] = new Array(nums.length).fill(null);
    const view = (i?: number) => [
      vars({ product, zeros }),
      arr("nums", nums, { tones: tones([i, "active"]), pointers: { i } }),
      arr("answer", out, { tones: tones([i, "success"]) }),
    ];
    t.step("init", "product = 1, zeros = 0.", view());
    nums.forEach((x, i) => {
      if (x === 0) zeros++;
      else product *= x;
      t.step("scan", x === 0 ? "Zero: count it." : `product *= ${x} → ${product}.`, view(i));
    });
    t.step("map", "Build the output.", view());
    nums.forEach((x, i) => {
      if (zeros > 1) {
        out[i] = 0;
        t.step("many", "Two or more zeros: every product is 0.", view(i));
      } else if (zeros === 1) {
        out[i] = x === 0 ? product : 0;
        t.step("one", x === 0 ? `This is the zero: out = ${product}.` : "Another index holds the zero: 0.", view(i));
      } else {
        out[i] = product / x;
        t.step("div", `${product} ÷ ${x} = ${out[i]}.`, view(i));
      }
    });
    return clean(out as number[]);
  },
});

export default defineProblem<Input>({
  description:
    "Return an array answer where answer[i] is the product of all elements of nums except nums[i], in O(n) time without using division.",
  input: { default: "nums = [1,2,3,4]", parse: (a) => ({ nums: a.ints("nums") }) },
  examples: [
    { input: "nums = [1,2,3,4]", output: [24, 12, 8, 6] },
    { input: "nums = [-1,1,0,-3,3]", output: [0, 0, 9, 0, 0] },
  ],
  solutions: [bruteForce, division, prefixSuffix, constantSpace],
});

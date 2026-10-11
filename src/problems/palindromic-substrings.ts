import { arr, grid, rc, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  s: string;
}

const bruteForce = defineSolution<Input>({
  id: "brute-force",
  name: "Brute Force",
  time: "O(n³)",
  space: "O(1)",
  idea: "Test every substring for being a palindrome and count the hits.",
  approach: [
    {
      title: "Every substring",
      detail: "Check all n(n+1)/2 substrings.",
      at: "init",
    },
    {
      title: "Palindrome test",
      detail: "Two pointers from both ends. Every success counts.",
      at: "hit",
    },
    {
      title: "Non-palindromes",
      detail: "\"aaab\" fails because 'a' ≠ 'b' at the ends. Each test is O(n), so O(n³) overall.",
      at: "check",
    },
  ],
  code: code(`
    function countSubstrings(s: string): number {
      let count = 0; //@init
      for (let i = 0; i < s.length; i++) {
        for (let j = i; j < s.length; j++) { //@check
          let left = i;
          let right = j;
          while (left < right && s[left] === s[right]) {
            left++;
            right--;
          }
          const isPalindrome = left >= right;
          if (isPalindrome) count++; //@hit
        }
      }
      return count; //@ret
    }
  `),
  run({ s }, t) {
    let count = 0;
    const chars = [...s];
    t.step("init", "count = 0.", [arr("s", chars)]);
    for (let i = 0; i < s.length; i++)
      for (let j = i; j < s.length; j++) {
        let l = i,
          r = j;
        while (l < r && s[l] === s[r]) {
          l++;
          r--;
        }
        const ok = l >= r;
        if (ok) count++;
        t.step(ok ? "hit" : "check", `"${s.slice(i, j + 1)}" ${ok ? "is" : "is not"} a palindrome. count = ${count}.`, () => [vars({ count }), arr("s", chars, { window: [i, j], tones: ok ? tones([i, "success"], [j, "success"]) : {} })]);
      }
    t.step("ret", `Return ${count}.`, [vars({ count })]);
    return count;
  },
});

const expand = defineSolution<Input>({
  id: "expand-center",
  name: "Expand Around Center",
  time: "O(n²)",
  space: "O(1)",
  idea: "Every successful expansion step from one of the 2n − 1 centers is exactly one palindrome. Count them.",
  approach: [
    {
      title: "Each center",
      detail: "Try odd centers (a character) and even centers (a gap).",
      at: "center",
    },
    {
      title: "Each successful expansion is one palindrome",
      detail: "Growing one step means s[left..right] is a new palindrome, so count++.",
      at: "grow",
      nth: 3,
    },
    {
      title: "Total",
      detail: "O(n²) time, O(1) space.",
      at: "ret",
    },
  ],
  code: code(`
    function countSubstrings(s: string): number {
      let count = 0;
      // Each step outward that still matches is one more palindrome.
      function expand(left: number, right: number) {
        while (left >= 0 && right < s.length && s[left] === s[right]) { //@grow
          count++;
          left--;
          right++;
        }
      }
      for (let center = 0; center < s.length; center++) { //@center
        expand(center, center); // odd length
        expand(center, center + 1); // even length
      }
      return count; //@ret
    }
  `),
  run({ s }, t) {
    let count = 0;
    const chars = [...s];
    const expandAt = (l: number, r: number) => {
      while (l >= 0 && r < s.length && s[l] === s[r]) {
        count++;
        const L = l,
          R = r;
        t.step("grow", `"${s.slice(L, R + 1)}" is a palindrome. count = ${count}.`, () => [vars({ count }), arr("s", chars, { window: [L, R] })]);
        l--;
        r++;
      }
    };
    for (let i = 0; i < s.length; i++) {
      t.step("center", `Centers at ${i} and ${i}|${i + 1}.`, () => [vars({ count }), arr("s", chars, { tones: tones([i, "active"]) })]);
      expandAt(i, i);
      expandAt(i, i + 1);
    }
    t.step("ret", `Return ${count}.`, [vars({ count })]);
    return count;
  },
});

const dp = defineSolution<Input>({
  id: "dp",
  name: "DP Table",
  time: "O(n²)",
  space: "O(n²)",
  idea: "dp[i][j] = s[i..j] is a palindrome: the ends match and the inside is a palindrome. Count the true cells.",
  approach: [
    {
      title: "Fill from the bottom row up",
      detail: "isPal[i][j] needs isPal[i+1][j−1], the row below, so iterate i from n−1 down to 0.",
      at: "row",
    },
    {
      title: "Recurrence",
      detail: "The ends match and the inside is a palindrome (or has length ≤ 2).",
      at: "cell",
      nth: 5,
    },
    {
      title: "Count the true cells",
      detail: "Each true cell is one palindromic substring.",
      at: "ret",
    },
  ],
  code: code(`
    function countSubstrings(s: string): number {
      const n = s.length;
      // isPal[i][j] = is s[i..j] a palindrome? Filled from the bottom row up.
      const isPal = Array.from({ length: n }, () => new Array(n).fill(false));
      let count = 0;
      for (let i = n - 1; i >= 0; i--) { //@row
        for (let j = i; j < n; j++) {
          const innerIsPal = j - i < 2 || isPal[i + 1][j - 1];
          isPal[i][j] = s[i] === s[j] && innerIsPal; //@cell
          if (isPal[i][j]) count++;
        }
      }
      return count; //@ret
    }
  `),
  run({ s }, t) {
    const n = s.length;
    const dpT: (string | null)[][] = Array.from({ length: n }, () => new Array(n).fill(null));
    let count = 0;
    const chars = [...s];
    const view = (i?: number, j?: number) => [
      vars({ count }),
      grid("dp[i][j]", dpT, {
        rowLabels: chars,
        colLabels: chars,
        tones: i !== undefined && j !== undefined ? tones([rc(i, j), dpT[i][j] === "T" ? "success" : "danger"], [j - i >= 2 ? rc(i + 1, j - 1) : null, "compare"]) : {},
      }),
    ];
    for (let i = n - 1; i >= 0; i--) {
      t.step("row", `Row i = ${i}.`, () => view());
      for (let j = i; j < n; j++) {
        const ok = s[i] === s[j] && (j - i < 2 || dpT[i + 1][j - 1] === "T");
        dpT[i][j] = ok ? "T" : "F";
        if (ok) count++;
        t.step("cell", `"${s.slice(i, j + 1)}" → ${ok ? "T" : "F"}. count = ${count}.`, () => view(i, j));
      }
    }
    t.step("ret", `Return ${count}.`, view());
    return count;
  },
});

export default defineProblem<Input>({
  description: "Return the number of palindromic substrings in s. Substrings at different positions count separately.",
  input: { default: 's = "aaab"', parse: (a) => ({ s: a.str("s") }) },
  examples: [
    { input: 's = "abc"', output: 3 },
    { input: 's = "aaa"', output: 6 },
  ],
  solutions: [bruteForce, dp, expand],
});

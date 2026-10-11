import { arr, grid, rc, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  s: string;
}

const isPal = (s: string, i: number, j: number) => {
  while (i < j) if (s[i++] !== s[j--]) return false;
  return true;
};

const bruteForce = defineSolution<Input>({
  id: "brute-force",
  name: "Brute Force",
  time: "O(n³)",
  space: "O(1)",
  idea: "Check every substring with a two-pointer palindrome test and keep the longest.",
  approach: [
    {
      title: "Start with one character",
      detail: "Any single character is a palindrome.",
      at: "init",
    },
    {
      title: "Only test longer substrings",
      detail: "For each i, start j at i + best.length. Shorter substrings can't improve the answer.",
      at: "check",
    },
    {
      title: "Two-pointer check",
      detail: "Compare from both ends inward. A full match replaces best. Worst case O(n³).",
      at: "best",
    },
  ],
  code: code(`
    function longestPalindrome(s: string): string {
      function isPalindrome(start: number, end: number): boolean {
        while (start < end) {
          if (s[start] !== s[end]) return false;
          start++;
          end--;
        }
        return true;
      }
      let best = s[0]; //@init
      for (let i = 0; i < s.length; i++) {
        // Only check substrings longer than the best one found so far.
        for (let j = i + best.length; j < s.length; j++) { //@check
          if (isPalindrome(i, j)) best = s.slice(i, j + 1); //@best
        }
      }
      return best; //@ret
    }
  `),
  run({ s }, t) {
    let best = s[0];
    const chars = [...s];
    t.step("init", `best = "${best}".`, [arr("s", chars)]);
    for (let i = 0; i < s.length; i++)
      for (let j = i + best.length; j < s.length; j++) {
        const ok = isPal(s, i, j);
        if (ok) best = s.slice(i, j + 1);
        t.step(ok ? "best" : "check", ok ? `"${s.slice(i, j + 1)}" is a palindrome: new best.` : `"${s.slice(i, j + 1)}" is not a palindrome.`, () => [vars({ best: `"${best}"` }), arr("s", chars, { window: [i, j], tones: tones([ok ? i : null, "success"], [ok ? j : null, "success"]) })]);
      }
    t.step("ret", `Return "${best}".`, [vars({ best: `"${best}"` })]);
    return best;
  },
});

const expand = defineSolution<Input>({
  id: "expand-center",
  name: "Expand Around Center",
  time: "O(n²)",
  space: "O(1)",
  idea: "Every palindrome mirrors around a center: a character (odd length) or a gap between two characters (even length). Expand outward from each of the 2n − 1 centers.",
  approach: [
    {
      title: "2n − 1 centers",
      detail: "Every palindrome mirrors around a character (odd length) or a gap between two characters (even length).",
      at: "center",
    },
    {
      title: "Expand while the ends match",
      detail: "Push left and right outward as long as s[left] === s[right].",
      at: "grow",
      nth: 2,
    },
    {
      title: "Record the longest",
      detail: "The palindrome found is s[left+1..right−1]. Keep the longest. O(n²) time, O(1) space.",
      at: "best",
    },
  ],
  code: code(`
    function longestPalindrome(s: string): string {
      let bestStart = 0; //@init
      let bestEnd = 0;
      // Grow outward from the center while both ends match.
      function expand(left: number, right: number) {
        while (left >= 0 && right < s.length && s[left] === s[right]) { //@grow
          left--;
          right++;
        }
        // The palindrome is s[left + 1 .. right - 1].
        const length = right - left - 1;
        if (length > bestEnd - bestStart + 1) { //@best
          bestStart = left + 1;
          bestEnd = right - 1;
        }
      }
      for (let center = 0; center < s.length; center++) { //@center
        expand(center, center); // odd length, like "aba"
        expand(center, center + 1); // even length, like "abba"
      }
      return s.slice(bestStart, bestEnd + 1); //@ret
    }
  `),
  run({ s }, t) {
    let lo = 0,
      hi = 0;
    const chars = [...s];
    const view = (l: number, r: number) => [
      vars({ best: `"${s.slice(lo, hi + 1)}"` }),
      arr("s", chars, { window: l + 1 <= r - 1 ? [l + 1, r - 1] : null, tones: tones([l >= 0 ? l : null, "compare"], [r < s.length ? r : null, "compare"]), pointers: { left: l >= 0 ? l : null, right: r < s.length ? r : null } }),
    ];
    t.step("init", "best = first character.", view(0, 0));
    const expandAt = (l: number, r: number) => {
      while (l >= 0 && r < s.length && s[l] === s[r]) {
        l--;
        r++;
        const L = l,
          R = r;
        t.step("grow", `'${s[L + 1]}' = '${s[R - 1]}': expand.`, () => view(L, R));
      }
      if (r - l - 1 > hi - lo + 1) {
        lo = l + 1;
        hi = r - 1;
        t.step("best", `New best: "${s.slice(lo, hi + 1)}".`, () => view(l, r));
      }
    };
    for (let i = 0; i < s.length; i++) {
      t.step("center", `Center at ${i} (odd), then between ${i} and ${i + 1} (even).`, () => view(i, i));
      expandAt(i, i);
      expandAt(i, i + 1);
    }
    t.step("ret", `Return "${s.slice(lo, hi + 1)}".`, [vars({ best: `"${s.slice(lo, hi + 1)}"` })]);
    return s.slice(lo, hi + 1);
  },
});

const dp = defineSolution<Input>({
  id: "dp",
  name: "DP Table",
  time: "O(n²)",
  space: "O(n²)",
  idea: "dp[i][j] is true when s[i..j] is a palindrome: the ends match and the inside s[i+1..j−1] is a palindrome (or has length < 2). Fill by increasing length.",
  approach: [
    {
      title: "Single characters",
      detail: "isPal[i][i] = true.",
      at: "diag",
    },
    {
      title: "Grow by length",
      detail: "Process substrings in increasing length so the inner substring s[i+1..j−1] is always already decided.",
      at: "len",
    },
    {
      title: "Ends match and the inside is a palindrome",
      detail: "isPal[i][j] = s[i] === s[j] && (length 2 || isPal[i+1][j−1]).",
      at: "cell",
      nth: 4,
    },
    {
      title: "Track the longest",
      detail: "Remember the start and length of the longest true cell. O(n²) time and space.",
      at: "best",
    },
  ],
  code: code(`
    function longestPalindrome(s: string): string {
      const n = s.length;
      // isPal[i][j] = is s[i..j] a palindrome?
      const isPal = Array.from({ length: n }, () => new Array(n).fill(false));
      let bestStart = 0;
      let bestLength = 1;
      for (let i = 0; i < n; i++) isPal[i][i] = true; //@diag
      for (let length = 2; length <= n; length++) { //@len
        for (let i = 0; i + length - 1 < n; i++) {
          const j = i + length - 1;
          const innerIsPal = length === 2 || isPal[i + 1][j - 1];
          isPal[i][j] = s[i] === s[j] && innerIsPal; //@cell
          if (isPal[i][j] && length > bestLength) { //@best
            bestStart = i;
            bestLength = length;
          }
        }
      }
      return s.slice(bestStart, bestStart + bestLength); //@ret
    }
  `),
  run({ s }, t) {
    const n = s.length;
    const dpT: (string | null)[][] = Array.from({ length: n }, () => new Array(n).fill(null));
    let lo = 0,
      len = 1;
    const chars = [...s];
    const view = (i?: number, j?: number) => [
      vars({ best: `"${s.slice(lo, lo + len)}"` }),
      grid("dp[i][j]: is s[i..j] a palindrome?", dpT, {
        rowLabels: chars,
        colLabels: chars,
        tones: i !== undefined && j !== undefined ? tones([rc(i, j), dpT[i][j] === "T" ? "success" : "danger"], [j - i >= 2 ? rc(i + 1, j - 1) : null, "compare"]) : {},
      }),
    ];
    for (let i = 0; i < n; i++) dpT[i][i] = "T";
    t.step("diag", "Single characters are palindromes.", view());
    for (let L = 2; L <= n; L++) {
      t.step("len", `Length ${L}.`, () => view());
      for (let i = 0; i + L - 1 < n; i++) {
        const j = i + L - 1;
        const ok = s[i] === s[j] && (L === 2 || dpT[i + 1][j - 1] === "T");
        dpT[i][j] = ok ? "T" : "F";
        t.step("cell", `s[${i}] = '${s[i]}', s[${j}] = '${s[j]}'${L > 2 ? `, inside is ${dpT[i + 1][j - 1]}` : ""} → ${ok ? "T" : "F"}.`, () => view(i, j));
        if (ok && L > len) {
          lo = i;
          len = L;
          t.step("best", `New best: "${s.slice(lo, lo + len)}".`, () => view(i, j));
        }
      }
    }
    t.step("ret", `Return "${s.slice(lo, lo + len)}".`, view());
    return s.slice(lo, lo + len);
  },
});

export default defineProblem<Input>({
  description: "Return the longest palindromic substring of s.",
  input: { default: 's = "babad"', parse: (a) => ({ s: a.str("s") }) },
  examples: [
    { input: 's = "cbbd"', output: "bb" },
    { input: 's = "a"', output: "a" },
    { input: 's = "forgeeksskeegfor"', output: "geeksskeeg" },
  ],
  solutions: [bruteForce, dp, expand],
});

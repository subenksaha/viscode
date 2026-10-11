import { arr, grid, range, rc, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  s: string;
}

const fmtParts = (res: string[][]) => res.map((p) => p.join(" | "));

const backtrack = defineSolution<Input>({
  id: "backtracking",
  name: "Backtracking with Two-pointer Checks",
  time: "O(n · 2ⁿ)",
  space: "O(n)",
  idea: "From position start, try every end so that s[start..end] is a palindrome, cut it off, and recurse on the rest. Each check walks inward from both ends.",
  code: code(`
    function partition(s: string): string[][] {
      const result: string[][] = [];
      const path: string[] = [];
      function isPalindrome(left: number, right: number): boolean {
        while (left < right) {
          if (s[left] !== s[right]) return false;
          left++;
          right--;
        }
        return true;
      }
      function cutFrom(start: number) {
        if (start === s.length) { //@done
          result.push([...path]);
          return;
        }
        for (let end = start; end < s.length; end++) {
          if (!isPalindrome(start, end)) continue; //@check
          path.push(s.slice(start, end + 1)); //@cut
          cutFrom(end + 1);
          path.pop(); //@undo
        }
      }
      cutFrom(0);
      return result; //@ret
    }
  `),
  run({ s }, t) {
    const res: string[][] = [],
      path: string[] = [];
    const isPal = (l: number, r: number) => {
      while (l < r) if (s[l++] !== s[r--]) return false;
      return true;
    };
    const view = (start: number, end?: number, tone: Tone = "active") => [
      vars({ path: path.join(" | ") || "—" }),
      arr("s", [...s], { tones: tones(...range(0, start - 1, "muted"), ...(end !== undefined ? range(start, end, tone) : [])), pointers: { start: start < s.length ? start : null, end } }),
      arr("partitions", fmtParts(res), { indexLabels: false, tones: tones([res.length - 1, "success"]) }),
    ];
    const dfs = (start: number) => {
      if (start === s.length) {
        res.push([...path]);
        t.step("done", `Reached the end: record ${path.join(" | ")}.`, () => view(start));
        return;
      }
      for (let end = start; end < s.length; end++) {
        if (!isPal(start, end)) {
          t.step("check", `"${s.slice(start, end + 1)}" is not a palindrome.`, () => view(start, end, "danger"));
          continue;
        }
        path.push(s.slice(start, end + 1));
        t.step("cut", `Cut off palindrome "${path.at(-1)}".`, () => view(start, end, "success"));
        dfs(end + 1);
        path.pop();
        t.step("undo", `Undo "${s.slice(start, end + 1)}".`, () => view(start, end));
      }
    };
    dfs(0);
    t.step("ret", `${res.length} partitions.`, view(0));
    return res;
  },
});

const dpTable = defineSolution<Input>({
  id: "dp-table",
  name: "Palindrome Table + Backtracking",
  time: "O(n · 2ⁿ)",
  space: "O(n²)",
  idea: "Precompute pal[i][j] = (s[i] = s[j]) and pal[i+1][j−1], so every palindrome check during the backtracking is a table lookup.",
  code: code(`
    function partition(s: string): string[][] {
      const n = s.length;
      // isPal[i][j] = is s[i..j] a palindrome? Filled from the bottom row up.
      const isPal = Array.from({ length: n }, () => new Array(n).fill(false));
      for (let i = n - 1; i >= 0; i--) {
        for (let j = i; j < n; j++) {
          const innerIsPal = j - i < 2 || isPal[i + 1][j - 1];
          isPal[i][j] = s[i] === s[j] && innerIsPal; //@fill
        }
      }
      const result: string[][] = [];
      const path: string[] = [];
      function cutFrom(start: number) {
        if (start === n) { //@done
          result.push([...path]);
          return;
        }
        for (let end = start; end < n; end++) {
          if (isPal[start][end]) { //@lookup
            path.push(s.slice(start, end + 1));
            cutFrom(end + 1);
            path.pop();
          }
        }
      }
      cutFrom(0);
      return result; //@ret
    }
  `),
  run({ s }, t) {
    const n = s.length;
    const pal: (boolean | null)[][] = Array.from({ length: n }, () => new Array(n).fill(null));
    const show = () => pal.map((row) => row.map((v) => (v === null ? "" : v ? "T" : "·")));
    const labels = [...s].map((c, i) => `${i}:${c}`);
    for (let i = n - 1; i >= 0; i--)
      for (let j = i; j < n; j++) {
        pal[i][j] = s[i] === s[j] && (j - i < 2 || !!pal[i + 1][j - 1]);
        t.step("fill", `pal[${i}][${j}] ("${s.slice(i, j + 1)}") = ${pal[i][j]}.`, () => [grid("pal[i][j]", show(), { rowLabels: labels, colLabels: labels, tones: { [rc(i, j)]: pal[i][j] ? "success" : "active" } })]);
      }
    const res: string[][] = [],
      path: string[] = [];
    const dfs = (start: number) => {
      if (start === n) {
        res.push([...path]);
        t.step("done", `Record ${path.join(" | ")}.`, () => [vars({ path: path.join(" | ") }), arr("partitions", fmtParts(res), { indexLabels: false, tones: tones([res.length - 1, "success"]) })]);
        return;
      }
      for (let end = start; end < n; end++)
        if (pal[start][end]) {
          path.push(s.slice(start, end + 1));
          t.step("lookup", `pal[${start}][${end}] is true: cut "${path.at(-1)}".`, () => [
            vars({ path: path.join(" | ") }),
            grid("pal[i][j]", show(), { rowLabels: labels, colLabels: labels, tones: { [rc(start, end)]: "active" } }),
          ]);
          dfs(end + 1);
          path.pop();
        }
    };
    dfs(0);
    t.step("ret", `${res.length} partitions.`, [arr("partitions", fmtParts(res), { indexLabels: false })]);
    return res;
  },
});

export default defineProblem<Input>({
  description: "Partition a string s so that every substring of the partition is a palindrome. Return all possible palindrome partitionings.",
  input: { default: 's = "aabb"', parse: (a) => ({ s: a.str("s") }) },
  examples: [
    { input: 's = "aab"', output: [["a", "a", "b"], ["aa", "b"]] },
    { input: 's = "a"', output: [["a"]] },
    { input: 's = "efe"', output: [["e", "f", "e"], ["efe"]] },
  ],
  normalize: (v) => (v as string[][]).map((p) => p.join("|")).sort(),
  solutions: [backtrack, dpTable],
});

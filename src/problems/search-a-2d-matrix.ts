import { grid, rc, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  matrix: number[][];
  target: number;
}

const staircase = defineSolution<Input>({
  id: "staircase",
  name: "Staircase from the Top-Right",
  time: "O(m + n)",
  space: "O(1)",
  idea: "Start at the top-right corner. If the value is too big, everything below it in that column is bigger too, so move left; if too small, move down.",
  code: code(`
    function searchMatrix(matrix: number[][], target: number): boolean {
      let r = 0, c = matrix[0].length - 1; //@init
      while (r < matrix.length && c >= 0) {
        const v = matrix[r][c]; //@look
        if (v === target) return true; //@found
        if (v > target) c--; //@left
        else r++; //@down
      }
      return false; //@none
    }
  `),
  run({ matrix, target }, t) {
    let r = 0,
      c = matrix[0].length - 1;
    const path: string[] = [];
    const view = (tone: Tone = "active") => {
      const tn: Record<string, Tone> = {};
      path.forEach((k) => (tn[k] = "muted"));
      if (r < matrix.length && c >= 0) tn[rc(r, c)] = tone;
      return [vars({ target, r, c }), grid("matrix", matrix, { tones: tn })];
    };
    t.step("init", "Start at the top-right corner.", view());
    while (r < matrix.length && c >= 0) {
      const v = matrix[r][c];
      if (v === target) {
        t.step("found", `Found ${target} at (${r}, ${c}).`, view("success"));
        return true;
      }
      t.step("look", `${v} ${v > target ? ">" : "<"} ${target}.`, view());
      path.push(rc(r, c));
      if (v > target) {
        c--;
        t.step("left", "Too big: the rest of this column is bigger. Move left.", view());
      } else {
        r++;
        t.step("down", "Too small: the rest of this row is smaller. Move down.", view());
      }
    }
    t.step("none", "Walked off the matrix. Not found.", view());
    return false;
  },
});

const flatBinary = defineSolution<Input>({
  id: "flat-binary-search",
  name: "Binary Search on the Flattened Matrix",
  time: "O(log(m·n))",
  space: "O(1)",
  idea: "Rows are sorted and each row starts after the previous ends, so the matrix is one sorted array of m·n values. Index k maps to (⌊k/n⌋, k mod n).",
  code: code(`
    function searchMatrix(matrix: number[][], target: number): boolean {
      const m = matrix.length, n = matrix[0].length;
      let lo = 0, hi = m * n - 1; //@init
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const v = matrix[Math.floor(mid / n)][mid % n]; //@mid
        if (v === target) return true; //@found
        if (v < target) lo = mid + 1; //@right
        else hi = mid - 1; //@left
      }
      return false; //@none
    }
  `),
  run({ matrix, target }, t) {
    const m = matrix.length,
      n = matrix[0].length;
    let lo = 0,
      hi = m * n - 1;
    const view = (mid?: number, tone: Tone = "active") => {
      const tn: Record<string, Tone> = {};
      for (let k = 0; k < m * n; k++) {
        const key = rc(Math.floor(k / n), k % n);
        tn[key] = k >= lo && k <= hi ? "window" : "muted";
      }
      if (mid !== undefined) tn[rc(Math.floor(mid / n), mid % n)] = tone;
      return [vars({ target, lo, hi, mid }), grid("matrix", matrix, { tones: tn })];
    };
    t.step("init", `Search flat indices 0..${m * n - 1}.`, view());
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const v = matrix[Math.floor(mid / n)][mid % n];
      if (v === target) {
        t.step("found", `mid ${mid} → (${Math.floor(mid / n)}, ${mid % n}) = ${v}. Found.`, view(mid, "success"));
        return true;
      }
      t.step("mid", `mid ${mid} → (${Math.floor(mid / n)}, ${mid % n}) = ${v}.`, view(mid));
      if (v < target) {
        lo = mid + 1;
        t.step("right", `${v} < ${target}: search the right half.`, view());
      } else {
        hi = mid - 1;
        t.step("left", `${v} > ${target}: search the left half.`, view());
      }
    }
    t.step("none", "Range is empty. Not found.", view());
    return false;
  },
});

export default defineProblem<Input>({
  description: "Each row of an m×n matrix is sorted, and each row's first value is greater than the previous row's last. Return true if target is in the matrix, in O(log(m·n)) time.",
  input: { default: "matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 16", parse: (a) => ({ matrix: a.matrix<number>("matrix"), target: a.int("target") }) },
  examples: [
    { input: "matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3", output: true },
    { input: "matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 13", output: false },
    { input: "matrix = [[1]], target = 1", output: true },
  ],
  solutions: [staircase, flatBinary],
});

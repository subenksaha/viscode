import { arr, grid, rc, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  matrix: number[][];
}

function view(matrix: number[][], done: Set<string>, cur: [number, number] | null, out: number[], extra: Record<string, unknown> = {}) {
  const tn: Record<string, Tone> = {};
  done.forEach((k) => (tn[k] = "visited"));
  if (cur) tn[rc(...cur)] = "active";
  return [vars(extra), grid("matrix", matrix, { tones: tn }), arr("output", out)];
}

const boundaries = defineSolution<Input>({
  id: "boundaries",
  name: "Shrinking Boundaries",
  time: "O(m·n)",
  space: "O(1)",
  idea: "Keep top, bottom, left and right walls. Walk the top row, the right column, the bottom row and the left column, pulling each wall inward after its side is done.",
  approach: [
    {
      title: "Four walls",
      detail: "top, bottom, left and right bound the part not yet visited.",
      at: "init",
    },
    {
      title: "Top row, left to right",
      detail: "Read the top row, then move top down.",
      at: "top",
    },
    {
      title: "Right column, top to bottom",
      detail: "Read the right column, then move right in.",
      at: "right",
    },
    {
      title: "Bottom row and left column, if any remain",
      detail: "Check the walls again first. A single remaining row or column must not be read twice.",
      at: "bottom",
    },
    {
      title: "Next ring",
      detail: "Each ring peels off one layer until the walls cross.",
      at: "ret",
    },
  ],
  code: code(`
    function spiralOrder(matrix: number[][]): number[] {
      const result: number[] = [];
      let top = 0; //@init
      let bottom = matrix.length - 1;
      let left = 0;
      let right = matrix[0].length - 1;
      while (top <= bottom && left <= right) { //@loop
        for (let col = left; col <= right; col++) result.push(matrix[top][col]); //@top
        top++;
        for (let row = top; row <= bottom; row++) result.push(matrix[row][right]); //@right
        right--;
        if (top <= bottom) { //@bottom
          for (let col = right; col >= left; col--) result.push(matrix[bottom][col]);
        }
        bottom--;
        if (left <= right) { //@left
          for (let row = bottom; row >= top; row--) result.push(matrix[row][left]);
        }
        left++;
      }
      return result; //@ret
    }
  `),
  run({ matrix }, t) {
    const out: number[] = [];
    const done = new Set<string>();
    let top = 0,
      bottom = matrix.length - 1,
      left = 0,
      right = matrix[0].length - 1;
    const take = (r: number, c: number, label: string) => {
      out.push(matrix[r][c]);
      done.add(rc(r, c));
      t.step(label, `Take ${matrix[r][c]} at (${r}, ${c}).`, () => view(matrix, done, [r, c], out, { top, bottom, left, right }));
    };
    t.step("init", "Walls start at the edges.", view(matrix, done, null, out, { top, bottom, left, right }));
    while (top <= bottom && left <= right) {
      t.step("loop", "Next ring.", () => view(matrix, done, null, out, { top, bottom, left, right }));
      for (let c = left; c <= right; c++) take(top, c, "top");
      top++;
      for (let r = top; r <= bottom; r++) take(r, right, "right");
      right--;
      if (top <= bottom) for (let c = right; c >= left; c--) take(bottom, c, "bottom");
      bottom--;
      if (left <= right) for (let r = bottom; r >= top; r--) take(r, left, "left");
      left++;
    }
    t.step("ret", `Return [${out}].`, view(matrix, done, null, out));
    return out;
  },
});

const simulate = defineSolution<Input>({
  id: "direction-simulation",
  name: "Direction Simulation",
  time: "O(m·n)",
  space: "O(m·n)",
  idea: "Walk right, down, left, up in turn. Turn clockwise whenever the next cell is outside the grid or already visited.",
  approach: [
    {
      title: "Start heading right",
      detail: "Directions cycle right → down → left → up.",
      at: "init",
    },
    {
      title: "Take the cell",
      detail: "Record the value and mark the cell visited.",
      at: "take",
    },
    {
      title: "Turn when blocked",
      detail: "If the next cell is off the grid or already visited, rotate clockwise. This needs an O(m·n) visited grid.",
      at: "turn",
    },
    {
      title: "Done after m·n cells",
      detail: "Every cell is taken exactly once.",
      at: "ret",
    },
  ],
  code: code(`
    function spiralOrder(matrix: number[][]): number[] {
      const rows = matrix.length;
      const cols = matrix[0].length;
      const result: number[] = [];
      const visited = matrix.map((line) => line.map(() => false));
      const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]]; // right, down, left, up
      let row = 0; //@init
      let col = 0;
      let direction = 0;
      for (let count = 0; count < rows * cols; count++) { //@loop
        result.push(matrix[row][col]); //@take
        visited[row][col] = true;
        const nextRow = row + directions[direction][0];
        const nextCol = col + directions[direction][1];
        const blocked = nextRow < 0 || nextCol < 0 || nextRow >= rows || nextCol >= cols || visited[nextRow][nextCol];
        if (blocked) direction = (direction + 1) % 4; // turn clockwise //@turn
        row += directions[direction][0]; //@move
        col += directions[direction][1];
      }
      return result; //@ret
    }
  `),
  run({ matrix }, t) {
    const m = matrix.length,
      n = matrix[0].length,
      out: number[] = [];
    const seen = matrix.map((row) => row.map(() => false));
    const done = new Set<string>();
    const dirs = [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ];
    const names = ["right", "down", "left", "up"];
    let r = 0,
      c = 0,
      d = 0;
    t.step("init", "Start at (0, 0) heading right.", view(matrix, done, [0, 0], out, { dir: names[d] }));
    for (let k = 0; k < m * n; k++) {
      out.push(matrix[r][c]);
      seen[r][c] = true;
      done.add(rc(r, c));
      t.step("take", `Take ${matrix[r][c]}.`, () => view(matrix, done, [r, c], out, { dir: names[d] }));
      const [nr, nc] = [r + dirs[d][0], c + dirs[d][1]];
      if (nr < 0 || nc < 0 || nr >= m || nc >= n || seen[nr][nc]) {
        d = (d + 1) % 4;
        if (k < m * n - 1) t.step("turn", `Blocked. Turn to head ${names[d]}.`, () => view(matrix, done, [r, c], out, { dir: names[d] }));
      }
      r += dirs[d][0];
      c += dirs[d][1];
    }
    t.step("ret", `Return [${out}].`, view(matrix, done, null, out));
    return out;
  },
});

export default defineProblem<Input>({
  description: "Return all elements of an m × n matrix in spiral order, going clockwise from the top-left corner.",
  input: { default: "matrix = [[1,2,3,4],[5,6,7,8],[9,10,11,12]]", parse: (a) => ({ matrix: a.matrix<number>("matrix") }) },
  examples: [
    { input: "matrix = [[1,2,3],[4,5,6],[7,8,9]]", output: [1, 2, 3, 6, 9, 8, 7, 4, 5] },
    { input: "matrix = [[1,2,3,4],[5,6,7,8],[9,10,11,12]]", output: [1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7] },
    { input: "matrix = [[1],[2],[3]]", output: [1, 2, 3] },
  ],
  solutions: [boundaries, simulate],
});

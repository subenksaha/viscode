import { arr, grid, rc, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  image: number[][];
  sr: number;
  sc: number;
  color: number;
}

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

function view(image: number[][], painted: Set<string>, cur?: [number, number], extra: Record<string, unknown> = {}) {
  const tn: Record<string, Tone> = {};
  painted.forEach((k) => (tn[k] = "success"));
  if (cur) tn[rc(...cur)] = "active";
  return [vars(extra), grid("image", image, { tones: tn })];
}

const dfs = defineSolution<Input>({
  id: "dfs",
  name: "Recursive DFS",
  time: "O(m·n)",
  space: "O(m·n)",
  idea: "Remember the starting color. Recolor the start pixel, then recurse into each 4-directional neighbor that still has the starting color.",
  approach: [
    {
      title: "Remember the original color",
      detail: "Only pixels with this color that are connected to the start get repainted. If it already equals the new color, return immediately to avoid infinite recursion.",
      at: "start",
    },
    {
      title: "Paint and spread",
      detail: "Recolor the pixel, then recurse in four directions. Painting first doubles as the \"visited\" mark.",
      at: "paint",
    },
    {
      title: "Stop at other colors and edges",
      detail: "Out-of-bounds or differently colored pixels end a branch.",
      at: "paint",
      nth: -1,
    },
    {
      title: "Done",
      detail: "Each pixel is painted at most once: O(m·n).",
      at: "ret",
    },
  ],
  code: code(`
    function floodFill(image: number[][], sr: number, sc: number, color: number): number[][] {
      const originalColor = image[sr][sc]; //@start
      if (originalColor === color) return image; //@same
      function fill(row: number, col: number) {
        const outside = row < 0 || col < 0 || row >= image.length || col >= image[0].length;
        if (outside || image[row][col] !== originalColor) return;
        image[row][col] = color; //@paint
        fill(row + 1, col);
        fill(row - 1, col);
        fill(row, col + 1);
        fill(row, col - 1);
      }
      fill(sr, sc);
      return image; //@ret
    }
  `),
  run({ image, sr, sc, color }, t) {
    const start = image[sr][sc];
    const painted = new Set<string>();
    t.step("start", `Starting pixel (${sr}, ${sc}) has color ${start}.`, () => view(image, painted, [sr, sc], { start, color }));
    if (start === color) {
      t.step("same", "It already has the new color. Nothing to do.", () => view(image, painted));
      return image;
    }
    const fill = (r: number, c: number) => {
      if (r < 0 || c < 0 || r >= image.length || c >= image[0].length || image[r][c] !== start) return;
      image[r][c] = color;
      painted.add(rc(r, c));
      t.step("paint", `Paint (${r}, ${c}) with ${color}.`, () => view(image, painted, [r, c], { start, color }));
      for (const [dr, dc] of DIRS) fill(r + dr, c + dc);
    };
    fill(sr, sc);
    t.step("ret", `Done. Painted ${painted.size} pixel(s).`, () => view(image, painted));
    return image;
  },
});

const bfs = defineSolution<Input>({
  id: "bfs",
  name: "BFS with a Queue",
  time: "O(m·n)",
  space: "O(m·n)",
  idea: "Same idea, iteratively: paint a pixel as soon as it is queued so it is never queued twice.",
  approach: [
    {
      title: "Paint the start, queue it",
      detail: "Same visited trick: painted pixels no longer match the original color.",
      at: "init",
    },
    {
      title: "Expand a pixel",
      detail: "Look at its four neighbors.",
      at: "pop",
    },
    {
      title: "Paint when queuing",
      detail: "Painting on enqueue guarantees no pixel enters the queue twice.",
      at: "push",
    },
    {
      title: "Done",
      detail: "The queue empties once the connected region is fully painted.",
      at: "ret",
    },
  ],
  code: code(`
    function floodFill(image: number[][], sr: number, sc: number, color: number): number[][] {
      const originalColor = image[sr][sc];
      if (originalColor === color) return image; //@same
      image[sr][sc] = color;
      const queue = [[sr, sc]]; //@init
      const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      while (queue.length > 0) {
        const [row, col] = queue.shift()!; //@pop
        for (const [rowStep, colStep] of directions) {
          const nextRow = row + rowStep;
          const nextCol = col + colStep;
          const inside = nextRow >= 0 && nextCol >= 0 && nextRow < image.length && nextCol < image[0].length;
          if (inside && image[nextRow][nextCol] === originalColor) { //@push
            image[nextRow][nextCol] = color;
            queue.push([nextRow, nextCol]);
          }
        }
      }
      return image; //@ret
    }
  `),
  run({ image, sr, sc, color }, t) {
    const start = image[sr][sc];
    const painted = new Set<string>();
    if (start === color) {
      t.step("same", "Starting pixel already has the new color.", () => view(image, painted, [sr, sc]));
      return image;
    }
    image[sr][sc] = color;
    painted.add(rc(sr, sc));
    const queue: [number, number][] = [[sr, sc]];
    const v = (cur?: [number, number]) => [...view(image, painted, cur, { start, color }), arr("queue", queue.map((q) => `(${q})`), { indexLabels: false })];
    t.step("init", `Paint (${sr}, ${sc}) and queue it.`, () => v([sr, sc]));
    while (queue.length) {
      const [r, c] = queue.shift()!;
      t.step("pop", `Expand (${r}, ${c}).`, () => v([r, c]));
      for (const [dr, dc] of DIRS) {
        const x = r + dr,
          y = c + dc;
        if (image[x]?.[y] === start) {
          image[x][y] = color;
          painted.add(rc(x, y));
          queue.push([x, y]);
          t.step("push", `Neighbor (${x}, ${y}) matches. Paint and queue it.`, () => v([x, y]));
        }
      }
    }
    t.step("ret", "Queue is empty. Done.", () => v());
    return image;
  },
});

export default defineProblem<Input>({
  description: "Given an image as a grid of colors, a starting pixel (sr, sc) and a color, recolor the starting pixel and every pixel 4-directionally connected to it that has the same original color.",
  input: {
    default: "image = [[1,1,1,0],[1,1,0,0],[1,0,1,1],[0,1,1,1]], sr = 1, sc = 1, color = 2",
    parse: (a) => ({ image: a.matrix<number>("image"), sr: a.int("sr"), sc: a.int("sc"), color: a.int("color") }),
  },
  examples: [
    { input: "image = [[1,1,1],[1,1,0],[1,0,1]], sr = 1, sc = 1, color = 2", output: [[2, 2, 2], [2, 2, 0], [2, 0, 1]] },
    { input: "image = [[0,0,0],[0,0,0]], sr = 0, sc = 0, color = 0", output: [[0, 0, 0], [0, 0, 0]] },
  ],
  solutions: [dfs, bfs],
});

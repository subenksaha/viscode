import { arr, grid, rc, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  grid: number[][];
}

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

function orangeTones(g: number[][], hi: [number, number][] = [], hiTone: Tone = "active") {
  const tn: Record<string, Tone> = {};
  g.forEach((row, r) => row.forEach((v, c) => v && (tn[rc(r, c)] = v === 2 ? "danger" : "success")));
  hi.forEach(([r, c]) => (tn[rc(r, c)] = hiTone));
  return tn;
}

const simulate = defineSolution<Input>({
  id: "simulate-minutes",
  name: "Simulate Minute by Minute",
  time: "O((m·n)²)",
  space: "O(m·n)",
  idea: "Each minute, scan the whole grid for fresh oranges next to a rotten one and rot them together. Stop when a minute changes nothing.",
  approach: [
    {
      title: "One minute at a time",
      detail: "Each minute, find every fresh orange next to a rotten one.",
      at: "minute",
    },
    {
      title: "Collect first, then rot",
      detail: "Collect all of them before changing anything, so newly rotten oranges don't spread within the same minute.",
      at: "scan",
    },
    {
      title: "Rot together",
      detail: "Apply all changes at once.",
      at: "rot",
    },
    {
      title: "Stop when nothing changes",
      detail: "If fresh oranges remain at that point, they can't be reached: −1. Rescanning the grid every minute makes this O((m·n)²).",
      at: "stop",
    },
  ],
  code: code(`
    function orangesRotting(grid: number[][]): number {
      const rows = grid.length;
      const cols = grid[0].length;
      const isRotten = (row: number, col: number) =>
        row >= 0 && col >= 0 && row < rows && col < cols && grid[row][col] === 2;
      for (let minutes = 0; ; minutes++) { //@minute
        // Find every fresh orange that touches a rotten one.
        const toRot: number[][] = [];
        for (let row = 0; row < rows; row++) { //@scan
          for (let col = 0; col < cols; col++) {
            if (grid[row][col] !== 1) continue;
            const touchesRotten =
              isRotten(row + 1, col) || isRotten(row - 1, col) || isRotten(row, col + 1) || isRotten(row, col - 1);
            if (touchesRotten) toRot.push([row, col]);
          }
        }
        if (toRot.length === 0) { //@stop
          const freshLeft = grid.some((line) => line.includes(1));
          return freshLeft ? -1 : minutes;
        }
        for (const [row, col] of toRot) grid[row][col] = 2; //@rot
      }
    }
  `),
  run({ grid: g }, t) {
    for (let minutes = 0; ; minutes++) {
      t.step("minute", `Minute ${minutes}.`, [vars({ minutes }), grid("grid", g, { tones: orangeTones(g) })]);
      const toRot: [number, number][] = [];
      g.forEach((row, r) =>
        row.forEach((v, c) => {
          if (v === 1 && DIRS.some(([dr, dc]) => g[r + dr]?.[c + dc] === 2)) toRot.push([r, c]);
        }),
      );
      t.step("scan", toRot.length ? `${toRot.length} fresh orange(s) touch a rotten one.` : "No fresh orange touches a rotten one.", [vars({ minutes }), grid("grid", g, { tones: orangeTones(g, toRot, "window") })]);
      if (!toRot.length) {
        const res = g.flat().includes(1) ? -1 : minutes;
        t.step("stop", res < 0 ? "Some fresh oranges can never rot. Return −1." : `All rotten after ${minutes} minute(s).`, [grid("grid", g, { tones: orangeTones(g) })]);
        return res;
      }
      for (const [r, c] of toRot) g[r][c] = 2;
      t.step("rot", "They all rot at once.", [vars({ minutes: minutes + 1 }), grid("grid", g, { tones: orangeTones(g, toRot, "active") })]);
    }
  },
});

const bfs = defineSolution<Input>({
  id: "multi-source-bfs",
  name: "Multi-source BFS",
  time: "O(m·n)",
  space: "O(m·n)",
  idea: "Queue every rotten orange at minute 0 and BFS level by level. Each level is one minute. Count fresh oranges so you know if any are left unreachable.",
  approach: [
    {
      title: "Seed all rotten oranges",
      detail: "Count the fresh ones too, to detect unreachable oranges later.",
      at: "seed",
    },
    {
      title: "One BFS level per minute",
      detail: "Every orange rotten at minute t spreads to its neighbors at minute t + 1.",
      at: "level",
    },
    {
      title: "Rot fresh neighbors",
      detail: "Mark them rotten, decrement fresh, and queue them for the next level.",
      at: "rot",
    },
    {
      title: "Advance the clock",
      detail: "The next level is the newly rotten set.",
      at: "tick",
    },
    {
      title: "Answer",
      detail: "If fresh > 0, some orange was never reached: −1. Otherwise return the minutes. O(m·n).",
      at: "ret",
    },
  ],
  code: code(`
    function orangesRotting(grid: number[][]): number {
      const rows = grid.length;
      const cols = grid[0].length;
      const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      let rotten: number[][] = [];
      let fresh = 0;
      for (let row = 0; row < rows; row++) { //@seed
        for (let col = 0; col < cols; col++) {
          if (grid[row][col] === 2) rotten.push([row, col]);
          else if (grid[row][col] === 1) fresh++;
        }
      }
      let minutes = 0;
      while (rotten.length > 0 && fresh > 0) { //@level
        const newlyRotten: number[][] = [];
        for (const [row, col] of rotten) {
          for (const [rowStep, colStep] of directions) {
            const nextRow = row + rowStep;
            const nextCol = col + colStep;
            const inside = nextRow >= 0 && nextCol >= 0 && nextRow < rows && nextCol < cols;
            if (inside && grid[nextRow][nextCol] === 1) { //@rot
              grid[nextRow][nextCol] = 2;
              fresh--;
              newlyRotten.push([nextRow, nextCol]);
            }
          }
        }
        rotten = newlyRotten; //@tick
        minutes++;
      }
      return fresh > 0 ? -1 : minutes; //@ret
    }
  `),
  run({ grid: g }, t) {
    let queue: [number, number][] = [],
      fresh = 0,
      minutes = 0;
    g.forEach((row, r) => row.forEach((v, c) => (v === 2 ? queue.push([r, c]) : v === 1 && fresh++)));
    const view = (hi: [number, number][] = [], tone: Tone = "active") => [
      vars({ minutes, fresh }),
      grid("grid", g, { tones: orangeTones(g, hi, tone) }),
      arr("frontier", queue.map((q) => `(${q})`), { indexLabels: false }),
    ];
    t.step("seed", `${queue.length} rotten orange(s) start the BFS; ${fresh} fresh.`, view(queue, "compare"));
    while (queue.length && fresh) {
      t.step("level", `Minute ${minutes + 1}: spread from ${queue.length} orange(s).`, view(queue, "compare"));
      const next: [number, number][] = [];
      for (const [r, c] of queue)
        for (const [dr, dc] of DIRS) {
          const x = r + dr,
            y = c + dc;
          if (g[x]?.[y] !== 1) continue;
          g[x][y] = 2;
          fresh--;
          next.push([x, y]);
          t.step("rot", `(${r}, ${c}) rots (${x}, ${y}). ${fresh} fresh left.`, view([[x, y]]));
        }
      queue = next;
      minutes++;
      t.step("tick", `End of minute ${minutes}.`, view(queue, "compare"));
    }
    const res = fresh ? -1 : minutes;
    t.step("ret", fresh ? `${fresh} fresh orange(s) can't be reached. Return −1.` : `Return ${minutes}.`, view());
    return res;
  },
});

export default defineProblem<Input>({
  description: "In a grid, 0 is empty, 1 is a fresh orange and 2 is a rotten one. Every minute, fresh oranges next to a rotten one rot. Return the minutes until no fresh orange remains, or −1 if that is impossible.",
  input: { default: "grid = [[2,1,1,0],[1,1,0,1],[0,1,1,1]]", parse: (a) => ({ grid: a.matrix<number>("grid") }) },
  examples: [
    { input: "grid = [[2,1,1],[1,1,0],[0,1,1]]", output: 4 },
    { input: "grid = [[2,1,1],[0,1,1],[1,0,1]]", output: -1 },
    { input: "grid = [[0,2]]", output: 0 },
  ],
  solutions: [simulate, bfs],
});

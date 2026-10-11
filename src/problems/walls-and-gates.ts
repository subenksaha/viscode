import { arr, grid, rc } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  rooms: number[][];
}

const INF = 2147483647;
const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

const show = (rooms: number[][]) => rooms.map((row) => row.map((v) => (v === INF ? "∞" : v === -1 ? "▇" : v)));
const roomView = (rooms: number[][], cur?: [number, number], tone: Tone = "active", extra: ReturnType<typeof arr>[] = []) => {
  const tn: Record<string, Tone> = {};
  rooms.forEach((row, r) => row.forEach((v, c) => (v === 0 ? (tn[rc(r, c)] = "success") : v === -1 ? (tn[rc(r, c)] = "muted") : v !== INF && (tn[rc(r, c)] = "visited"))));
  if (cur) tn[rc(...cur)] = tone;
  return [grid("rooms (▇ wall, 0 gate, ∞ empty)", show(rooms), { tones: tn }), ...extra];
};

const perGate = defineSolution<Input>({
  id: "dfs-per-gate",
  name: "DFS from Each Gate",
  time: "O(g · m·n)",
  space: "O(m·n)",
  idea: "From every gate, DFS outward writing distance d into each room, but only continue where d improves on what the room already holds.",
  approach: [
    {
      title: "DFS from each gate",
      detail: "Write distance d into each room reached.",
      at: "gate",
    },
    {
      title: "Only improve",
      detail: "Stop if the room already holds a smaller or equal distance from another gate. Walls (−1) stop the search too.",
      at: "write",
    },
    {
      title: "Cost",
      detail: "Rooms can be rewritten by several gates, so O(g · m·n).",
    },
  ],
  code: code(`
    function wallsAndGates(rooms: number[][]): void {
      const rows = rooms.length;
      const cols = rooms[0].length;
      // Spread out from a gate, writing distances, but stop where a closer gate already reached.
      function fill(row: number, col: number, distance: number) {
        const outside = row < 0 || col < 0 || row >= rows || col >= cols;
        if (outside || rooms[row][col] < distance) return; // walls are -1, so they stop here too //@stop
        rooms[row][col] = distance; //@write
        fill(row + 1, col, distance + 1);
        fill(row - 1, col, distance + 1);
        fill(row, col + 1, distance + 1);
        fill(row, col - 1, distance + 1);
      }
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (rooms[row][col] === 0) fill(row, col, 0); //@gate
        }
      }
    }
  `),
  run({ rooms }, t) {
    const m = rooms.length,
      n = rooms[0].length;
    const dfs = (r: number, c: number, d: number) => {
      if (r < 0 || c < 0 || r >= m || c >= n || rooms[r][c] < d) return;
      const before = rooms[r][c];
      rooms[r][c] = d;
      if (d > 0) t.step("write", `(${r}, ${c}): ${before === INF ? "∞" : before} → ${d}.`, () => roomView(rooms, [r, c]));
      for (const [dr, dc] of DIRS) dfs(r + dr, c + dc, d + 1);
    };
    for (let r = 0; r < m; r++)
      for (let c = 0; c < n; c++)
        if (rooms[r][c] === 0) {
          t.step("gate", `Gate at (${r}, ${c}). Spread distances from it.`, () => roomView(rooms, [r, c], "success"));
          dfs(r, c, 0);
        }
    return rooms;
  },
});

const multiBfs = defineSolution<Input>({
  id: "multi-source-bfs",
  name: "Multi-source BFS",
  time: "O(m·n)",
  space: "O(m·n)",
  idea: "Start a BFS from all gates at once. BFS reaches each room first along a shortest path, so each empty room is written exactly once with its final distance.",
  approach: [
    {
      title: "Seed every gate",
      detail: "All gates start at distance 0 together.",
      at: "seed",
    },
    {
      title: "Expand in order",
      detail: "BFS pops rooms in non-decreasing distance order.",
      at: "pop",
    },
    {
      title: "Fill once",
      detail: "An empty room is written the first time it is reached, by the nearest gate. Each cell is processed once.",
      at: "fill",
    },
  ],
  code: code(`
    function wallsAndGates(rooms: number[][]): void {
      const EMPTY = 2147483647;
      const rows = rooms.length;
      const cols = rooms[0].length;
      const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      // Start a BFS from every gate at once.
      const queue: number[][] = [];
      for (let row = 0; row < rows; row++) { //@seed
        for (let col = 0; col < cols; col++) {
          if (rooms[row][col] === 0) queue.push([row, col]);
        }
      }
      while (queue.length > 0) {
        const [row, col] = queue.shift()!; //@pop
        for (const [rowStep, colStep] of directions) {
          const nextRow = row + rowStep;
          const nextCol = col + colStep;
          const inside = nextRow >= 0 && nextCol >= 0 && nextRow < rows && nextCol < cols;
          if (inside && rooms[nextRow][nextCol] === EMPTY) {
            rooms[nextRow][nextCol] = rooms[row][col] + 1; //@fill
            queue.push([nextRow, nextCol]);
          }
        }
      }
    }
  `),
  run({ rooms }, t) {
    const m = rooms.length,
      n = rooms[0].length;
    const queue: [number, number][] = [];
    for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) if (rooms[r][c] === 0) queue.push([r, c]);
    const qv = () => [arr("queue", queue.map((q) => `(${q})`), { indexLabels: false })];
    t.step("seed", `Start from all ${queue.length} gates.`, () => roomView(rooms, undefined, "active", qv()));
    while (queue.length) {
      const [r, c] = queue.shift()!;
      t.step("pop", `Expand (${r}, ${c}) at distance ${rooms[r][c]}.`, () => roomView(rooms, [r, c], "active", qv()));
      for (const [x, y] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]])
        if (x >= 0 && y >= 0 && x < m && y < n && rooms[x][y] === INF) {
          rooms[x][y] = rooms[r][c] + 1;
          queue.push([x, y]);
          t.step("fill", `(${x}, ${y}) is ${rooms[x][y]} steps from the nearest gate.`, () => roomView(rooms, [x, y], "compare", qv()));
        }
    }
    return rooms;
  },
});

export default defineProblem<Input>({
  description: "Fill each empty room (2147483647) of a grid with the distance to its nearest gate (0). Walls (-1) block movement; unreachable rooms stay 2147483647. Modify rooms in place.",
  input: {
    default: "rooms = [[2147483647,-1,0,2147483647],[2147483647,2147483647,2147483647,-1],[2147483647,-1,2147483647,-1],[0,-1,2147483647,2147483647]]",
    parse: (a) => ({ rooms: a.matrix<number>("rooms") }),
  },
  examples: [
    {
      input: "rooms = [[2147483647,-1,0,2147483647],[2147483647,2147483647,2147483647,-1],[2147483647,-1,2147483647,-1],[0,-1,2147483647,2147483647]]",
      output: [[3, -1, 0, 1], [2, 2, 1, -1], [1, -1, 2, -1], [0, -1, 3, 4]],
    },
    { input: "rooms = [[-1]]", output: [[-1]] },
    { input: "rooms = [[0,-1],[-1,2147483647]]", output: [[0, -1], [-1, 2147483647]] },
  ],
  solutions: [perGate, multiBfs],
});

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
  code: code(`
    function wallsAndGates(rooms: number[][]): void {
      const m = rooms.length, n = rooms[0].length;
      const dfs = (r: number, c: number, d: number) => {
        if (r < 0 || c < 0 || r >= m || c >= n || rooms[r][c] < d) return; //@stop
        rooms[r][c] = d; //@write
        dfs(r + 1, c, d + 1); dfs(r - 1, c, d + 1); dfs(r, c + 1, d + 1); dfs(r, c - 1, d + 1);
      };
      for (let r = 0; r < m; r++) for (let c = 0; c < n; c++)
        if (rooms[r][c] === 0) dfs(r, c, 0); //@gate
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
  code: code(`
    function wallsAndGates(rooms: number[][]): void {
      const m = rooms.length, n = rooms[0].length, queue: number[][] = [];
      for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) if (rooms[r][c] === 0) queue.push([r, c]); //@seed
      while (queue.length) {
        const [r, c] = queue.shift()!; //@pop
        for (const [x, y] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]])
          if (x >= 0 && y >= 0 && x < m && y < n && rooms[x][y] === 2147483647) {
            rooms[x][y] = rooms[r][c] + 1; queue.push([x, y]); //@fill
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

import { arr, map, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tracer } from "@/core/trace";

interface Input {
  ops: string[];
  args: number[][][];
}

const key = (x: number, y: number) => `${x},${y}`;

/** Replays the ops; `count` differs per solution. */
function simulate({ ops, args }: Input, t: Tracer, countFn: (q: number[], points: number[][], cnt: Map<string, number>, label: string, out: (number | null)[]) => number) {
  const points: number[][] = [];
  const cnt = new Map<string, number>();
  const out: (number | null)[] = [];
  ops.forEach((op, k) => {
    const p = args[k][0];
    const label = p ? `${op}([${p}])` : op;
    if (op === "DetectSquares") {
      out.push(null);
      t.step("ctor", "No points yet.", [vars({ op: label })]);
    } else if (op === "add") {
      points.push(p);
      cnt.set(key(p[0], p[1]), (cnt.get(key(p[0], p[1])) ?? 0) + 1);
      out.push(null);
      t.step("add", `Add (${p}).`, [vars({ op: label }), map("point counts", cnt, tones([key(p[0], p[1]), "success"])), arr("output", out.map((o) => o ?? "null"), { indexLabels: false })]);
    } else out.push(countFn(p, points, cnt, label, out));
  });
  return out;
}

const scanList = defineSolution<Input>({
  id: "scan-all",
  name: "Diagonal from the Point List",
  time: "O(n²) per count",
  space: "O(n)",
  idea: "Treat every stored point as the corner diagonal to the query. A valid diagonal forms a square with equal, non-zero side lengths; count the other two corners by scanning the list.",
  approach: [
    {
      title: "Store points",
      detail: "Duplicates count separately.",
      at: "add",
    },
    {
      title: "Pick a diagonal",
      detail: "A stored point that differs from the query by the same non-zero amount in x and y is a diagonal corner.",
      at: "diag",
    },
    {
      title: "Count the other corners",
      detail: "Count (x, cornerY) and (cornerX, y) by scanning. Multiply the counts.",
      at: "corners",
    },
    {
      title: "Total",
      detail: "O(n²) per query.",
      at: "ret",
    },
  ],
  code: code(`
    class DetectSquares {
      points: number[][] = []; //@ctor

      add(point: number[]) {
        this.points.push(point); //@add
      }

      countAt(x: number, y: number): number {
        return this.points.filter((point) => point[0] === x && point[1] === y).length;
      }

      count(query: number[]): number {
        const [x, y] = query;
        let total = 0;
        // Treat each stored point as the corner diagonally opposite the query.
        for (const [cornerX, cornerY] of this.points) { //@diag
          const isDiagonal = Math.abs(cornerX - x) === Math.abs(cornerY - y) && cornerX !== x;
          if (!isDiagonal) continue;
          const corner1 = this.countAt(x, cornerY);
          const corner2 = this.countAt(cornerX, y); //@corners
          total += corner1 * corner2;
        }
        return total; //@ret
      }
    }
  `),
  run: (input, t) =>
    simulate(input, t, ([x, y], points, cnt, label, out) => {
      let total = 0;
      points.forEach(([px, py], i) => {
        const diag = Math.abs(px - x) === Math.abs(py - y) && px !== x;
        if (!diag) {
          t.step("diag", `(${px},${py}) is not diagonal to (${x},${y}).`, () => [vars({ op: label, total }), arr("points", points.map((p) => `(${p})`), { indexLabels: false, tones: tones([i, "muted"]) })]);
          return;
        }
        const a = points.filter(([qx, qy]) => qx === x && qy === py).length;
        const b = points.filter(([qx, qy]) => qx === px && qy === y).length;
        total += a * b;
        t.step("corners", `Diagonal (${px},${py}): ${a} × (${x},${py}) and ${b} × (${px},${y}) → +${a * b}.`, () => [
          vars({ op: label, total }),
          arr("points", points.map((p) => `(${p})`), { indexLabels: false, tones: tones([i, "active"]) }),
        ]);
      });
      t.step("ret", `${total} square${total === 1 ? "" : "s"}.`, [vars({ op: label, total }), arr("output", [...out, total].map((o) => o ?? "null"), { indexLabels: false })]);
      return total;
    }),
});

const countMap = defineSolution<Input>({
  id: "count-map",
  name: "Point Counts + Distinct Diagonals",
  time: "O(n) per count",
  space: "O(n)",
  idea: "Store how many times each point was added. For a query, loop over distinct points as the diagonal and multiply the three corner counts: diagonal × (x, py) × (px, y).",
  approach: [
    {
      title: "Count per point",
      detail: "A map from \"x,y\" to how many times it was added.",
      at: "add",
    },
    {
      title: "Diagonals over distinct points",
      detail: "For each diagonal: count × count(x, py) × count(px, y).",
      at: "corners",
    },
    {
      title: "Total",
      detail: "O(distinct points) per query.",
      at: "ret",
    },
  ],
  code: code(`
    class DetectSquares {
      pointCount = new Map<string, number>(); // "x,y" -> how many times it was added //@ctor

      add(point: number[]) {
        const key = point[0] + "," + point[1];
        this.pointCount.set(key, (this.pointCount.get(key) ?? 0) + 1); //@add
      }

      countAt(x: number, y: number): number {
        return this.pointCount.get(x + "," + y) ?? 0;
      }

      count(query: number[]): number {
        const [x, y] = query;
        let total = 0;
        // Treat each stored point as the corner diagonally opposite the query.
        for (const [key, count] of this.pointCount) {
          const [cornerX, cornerY] = key.split(",").map(Number);
          const isDiagonal = Math.abs(cornerX - x) === Math.abs(cornerY - y) && cornerX !== x;
          if (!isDiagonal) continue; //@diag
          total += count * this.countAt(x, cornerY) * this.countAt(cornerX, y); //@corners
        }
        return total; //@ret
      }
    }
  `),
  run: (input, t) =>
    simulate(input, t, ([x, y], _points, cnt, label, out) => {
      let total = 0;
      for (const [k, c] of cnt) {
        const [px, py] = k.split(",").map(Number);
        if (Math.abs(px - x) !== Math.abs(py - y) || px === x) continue;
        const a = cnt.get(key(x, py)) ?? 0,
          b = cnt.get(key(px, y)) ?? 0;
        total += c * a * b;
        t.step("corners", `Diagonal (${k}) ×${c}, corner (${x},${py}) ×${a}, corner (${px},${y}) ×${b} → +${c * a * b}.`, () => [
          vars({ op: label, total }),
          map("point counts", cnt, tones([k, "active"], [key(x, py), a ? "compare" : "danger"], [key(px, y), b ? "compare" : "danger"])),
        ]);
      }
      t.step("ret", `${total} square${total === 1 ? "" : "s"}.`, [vars({ op: label, total }), arr("output", [...out, total].map((o) => o ?? "null"), { indexLabels: false })]);
      return total;
    }),
});

export default defineProblem<Input>({
  description: "Design a structure that adds points (duplicates allowed) and, for a query point, counts the ways to choose three stored points that form an axis-aligned square of positive area with it. Input is a LeetCode-style list of operations.",
  input: {
    default: 'ops = ["DetectSquares","add","add","add","count","count","add","count"], args = [[],[[3,10]],[[11,2]],[[3,2]],[[11,10]],[[14,8]],[[11,2]],[[11,10]]]',
    parse: (a) => {
      const ops = a.strs("ops");
      const args = a.matrix<number[]>("args");
      if (ops.length !== args.length) throw new Error("ops and args must have the same length");
      return { ops, args };
    },
  },
  examples: [
    {
      input: 'ops = ["DetectSquares","add","add","add","count","count","add","count"], args = [[],[[3,10]],[[11,2]],[[3,2]],[[11,10]],[[14,8]],[[11,2]],[[11,10]]]',
      output: [null, null, null, null, 1, 0, null, 2],
    },
  ],
  solutions: [scanList, countMap],
});

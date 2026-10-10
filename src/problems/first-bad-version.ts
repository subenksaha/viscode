import { arr, range, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  n: number;
  bad: number;
}

const versions = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

const linear = defineSolution<Input>({
  id: "linear",
  name: "Linear Scan",
  time: "O(n)",
  space: "O(1)",
  idea: "Call isBadVersion on 1, 2, 3, … and return the first one that is bad.",
  code: code(`
    function solution(isBadVersion: (v: number) => boolean) {
      return (n: number): number => {
        for (let v = 1; v <= n; v++) //@loop
          if (isBadVersion(v)) return v; //@found
        return n;
      };
    }
  `),
  run({ n, bad }, t) {
    const vs = versions(n);
    for (let v = 1; v <= n; v++) {
      const hit = v >= bad;
      t.step(hit ? "found" : "loop", hit ? `isBadVersion(${v}) = true. Return ${v}.` : `isBadVersion(${v}) = false.`, [
        vars({ calls: v }),
        arr("versions", vs, { tones: tones(...range(0, v - 2, "success"), [v - 1, hit ? "danger" : "active"]), indexLabels: false }),
      ]);
      if (hit) return v;
    }
    return n;
  },
});

const binary = defineSolution<Input>({
  id: "binary-search",
  name: "Binary Search for the Boundary",
  time: "O(log n)",
  space: "O(1)",
  idea: "Versions go good, good, …, bad, bad. Binary search for the first bad one: if mid is bad the answer is at or left of mid, otherwise it is right of mid.",
  code: code(`
    function solution(isBadVersion: (v: number) => boolean) {
      return (n: number): number => {
        let lo = 1, hi = n; //@init
        while (lo < hi) { //@loop
          const mid = lo + ((hi - lo) >> 1); //@mid
          if (isBadVersion(mid)) hi = mid; //@bad
          else lo = mid + 1; //@good
        }
        return lo; //@ret
      };
    }
  `),
  run({ n, bad }, t) {
    const vs = versions(n);
    let lo = 1,
      hi = n,
      calls = 0;
    const known: [number, "success" | "danger"][] = [];
    const view = (mid?: number) => [
      vars({ calls }),
      arr("versions", vs, {
        tones: tones(...range(0, lo - 2, "muted"), ...range(hi, n - 1, "muted"), ...known, [mid !== undefined ? mid - 1 : null, "active"]),
        pointers: { lo: lo - 1, hi: hi - 1, mid: mid !== undefined ? mid - 1 : undefined },
        window: [lo - 1, hi - 1],
        indexLabels: false,
      }),
    ];
    t.step("init", `The first bad version is somewhere in [1, ${n}].`, view());
    while (lo < hi) {
      t.step("loop", `Search [${lo}, ${hi}].`, view());
      const mid = lo + ((hi - lo) >> 1);
      t.step("mid", `Ask isBadVersion(${mid}).`, view(mid));
      calls++;
      if (mid >= bad) {
        known.push([mid - 1, "danger"]);
        hi = mid;
        t.step("bad", `${mid} is bad: the first bad one is at or before ${mid}.`, view());
      } else {
        known.push([mid - 1, "success"]);
        lo = mid + 1;
        t.step("good", `${mid} is good: the first bad one is after ${mid}.`, view());
      }
    }
    t.step("ret", `lo = hi = ${lo}. Return ${lo} after ${calls} call(s).`, view());
    return lo;
  },
});

export default defineProblem<Input>({
  description: "Versions 1..n are released in order and every version after a bad one is also bad. Using isBadVersion(v), find the first bad version with as few calls as possible. Here `bad` is the hidden first bad version.",
  input: {
    default: "n = 16, bad = 11",
    parse: (a) => {
      const n = a.int("n"),
        bad = a.int("bad");
      if (bad < 1 || bad > n) throw new Error("bad must be between 1 and n");
      return { n, bad };
    },
  },
  examples: [
    { input: "n = 5, bad = 4", output: 4 },
    { input: "n = 1, bad = 1", output: 1 },
  ],
  solutions: [linear, binary],
});

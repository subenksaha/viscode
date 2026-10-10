import { arr, range, tones, vars } from "@/core/panels";
import { parseOps } from "@/core/input";
import { code, defineProblem, defineSolution, type Tracer } from "@/core/trace";
import type { Panel } from "@/core/types";

interface Input {
  ops: string[];
  args: (string | number)[][];
}

type Entry = [number, string];

/** Runs the op list; `get` decides how to search one key's (timestamp-sorted) history. */
function simulate({ ops, args }: Input, t: Tracer, get: (hist: Entry[], ts: number, view: (extra?: Panel[]) => Panel[]) => string) {
  const store = new Map<string, Entry[]>();
  const out: (string | null)[] = [];
  ops.forEach((op, k) => {
    const label = `${op}(${args[k].map((x) => JSON.stringify(x)).join(", ")})`;
    const view = (extra: Panel[] = []) => [
      vars({ op: label }),
      ...[...store].map(([key, hist]) => arr(`"${key}" history`, hist.map(([ts, v]) => `${ts}:${v}`), { indexLabels: false })),
      ...extra,
      arr("output", out.map((o) => (o === null ? "null" : `"${o}"`)), { indexLabels: false }),
    ];
    if (op === "TimeMap") {
      out.push(null);
      t.step("ctor", "Empty store.", view());
    } else if (op === "set") {
      const [key, value, ts] = args[k] as [string, string, number];
      if (!store.has(key)) store.set(key, []);
      store.get(key)!.push([ts, value]);
      out.push(null);
      t.step("set", `Append (${ts}, "${value}") to "${key}". Timestamps only grow, so the history stays sorted.`, view());
    } else {
      const [key, ts] = args[k] as [string, number];
      const res = get(store.get(key) ?? [], ts, (extra = []) => view(extra));
      out.push(res);
      t.step("ret", `get returns "${res}".`, view());
    }
  });
  return out;
}

const linear = defineSolution<Input>({
  id: "linear-scan",
  name: "Scan History Backwards",
  time: "set O(1), get O(n)",
  space: "O(n)",
  idea: "Store each key's (timestamp, value) pairs in arrival order. For get, walk backwards until a timestamp ≤ the query.",
  code: code(`
    class TimeMap {
      store = new Map<string, [number, string][]>(); //@ctor
      set(key: string, value: string, timestamp: number): void {
        if (!this.store.has(key)) this.store.set(key, []);
        this.store.get(key)!.push([timestamp, value]); //@set
      }
      get(key: string, timestamp: number): string {
        const hist = this.store.get(key) ?? [];
        for (let i = hist.length - 1; i >= 0; i--) //@scan
          if (hist[i][0] <= timestamp) return hist[i][1]; //@found
        return ""; //@ret
      }
    }
  `),
  run: (input, t) =>
    simulate(input, t, (hist, ts, view) => {
      for (let i = hist.length - 1; i >= 0; i--) {
        const ok = hist[i][0] <= ts;
        t.step(ok ? "found" : "scan", ok ? `${hist[i][0]} ≤ ${ts}: answer "${hist[i][1]}".` : `${hist[i][0]} > ${ts}: keep going back.`, () =>
          view([arr("history", hist.map(([s, v]) => `${s}:${v}`), { tones: tones(...range(i + 1, hist.length - 1, "muted"), [i, ok ? "success" : "active"]), pointers: { i } })]),
        );
        if (ok) return hist[i][1];
      }
      t.step("scan", `No timestamp ≤ ${ts}.`, () => view());
      return "";
    }),
});

const binary = defineSolution<Input>({
  id: "binary-search",
  name: "Binary Search on Timestamps",
  time: "set O(1), get O(log n)",
  space: "O(n)",
  idea: "Each key's history is already sorted by timestamp. Binary search for the last timestamp ≤ the query.",
  code: code(`
    class TimeMap {
      store = new Map<string, [number, string][]>(); //@ctor
      set(key: string, value: string, timestamp: number): void {
        if (!this.store.has(key)) this.store.set(key, []);
        this.store.get(key)!.push([timestamp, value]); //@set
      }
      get(key: string, timestamp: number): string {
        const hist = this.store.get(key) ?? [];
        let lo = 0, hi = hist.length - 1, ans = ""; //@init
        while (lo <= hi) { //@loop
          const mid = (lo + hi) >> 1;
          if (hist[mid][0] <= timestamp) { ans = hist[mid][1]; lo = mid + 1; } //@ok
          else hi = mid - 1; //@too-late
        }
        return ans; //@ret
      }
    }
  `),
  run: (input, t) =>
    simulate(input, t, (hist, ts, view) => {
      let lo = 0,
        hi = hist.length - 1,
        ans = "";
      const v = (mid?: number) =>
        view([
          vars({ timestamp: ts, ans: `"${ans}"` }),
          arr("history", hist.map(([s, val]) => `${s}:${val}`), {
            tones: tones(...range(0, lo - 1, "muted"), ...range(hi + 1, hist.length - 1, "muted"), [mid, "active"]),
            pointers: { lo, mid, hi },
            window: lo <= hi ? [lo, hi] : null,
          }),
        ]);
      t.step("init", `Binary search for the last timestamp ≤ ${ts}.`, () => v());
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        t.step("loop", `mid = ${mid}: timestamp ${hist[mid][0]}.`, () => v(mid));
        if (hist[mid][0] <= ts) {
          ans = hist[mid][1];
          lo = mid + 1;
          t.step("ok", `${hist[mid][0]} ≤ ${ts}: candidate "${ans}". Look for a later one.`, () => v());
        } else {
          hi = mid - 1;
          t.step("too-late", `${hist[mid][0]} > ${ts}: go left.`, () => v());
        }
      }
      return ans;
    }),
});

export default defineProblem<Input>({
  description: "Design a time-based key-value store. set(key, value, timestamp) stores a value; get(key, timestamp) returns the value with the largest stored timestamp ≤ timestamp, or \"\". Timestamps passed to set are strictly increasing.",
  input: {
    default: 'ops = ["TimeMap","set","set","set","get","get","get","get"], args = [[],["foo","bar",1],["foo","baz",4],["foo","qux",9],["foo",1],["foo",3],["foo",7],["foo",10]]',
    parse: (a) => parseOps<string | number>(a),
  },
  examples: [
    {
      input: 'ops = ["TimeMap","set","get","get","set","get","get"], args = [[],["foo","bar",1],["foo",1],["foo",3],["foo","bar2",4],["foo",4],["foo",5]]',
      output: [null, null, "bar", "bar", null, "bar2", "bar2"],
    },
    { input: 'ops = ["TimeMap","set","get"], args = [[],["a","x",5],["a",2]]', output: [null, null, ""] },
  ],
  solutions: [linear, binary],
});

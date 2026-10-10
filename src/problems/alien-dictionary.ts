import { arr, edgeKey, graph, map, text, tones } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tracer } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  words: string[];
}

/** Compare adjacent words; the first differing letter gives an edge. Null means invalid (prefix after longer word). */
function buildEdges(words: string[], t: Tracer) {
  const letters = [...new Set(words.join(""))];
  const adj = new Map(letters.map((c) => [c, new Set<string>()]));
  const edges: [string, string][] = [];
  const view = (i?: number, k?: number, edge?: [string, string]) => [
    arr("words", words, { tones: tones([i, "active"], [i !== undefined ? i + 1 : null, "compare"]) }),
    ...(i !== undefined && k !== undefined
      ? [arr(`"${words[i]}" vs "${words[i + 1]}"`, [...words[i]], { tones: tones([k, "danger"]) })]
      : []),
    graph("letter order", letters, edges, { directed: true, edgeTones: edge ? tones([edgeKey(...edge), "active"]) : {} }),
  ];
  t.step("letters", "Collect every letter as a node.", view());
  for (let i = 0; i + 1 < words.length; i++) {
    const [a, b] = [words[i], words[i + 1]];
    const k = [...a].findIndex((ch, j) => ch !== b[j]);
    if (k === -1 || k >= b.length) {
      if (a.length > b.length) {
        t.step("prefix", `"${b}" is a prefix of "${a}" but comes after it. Invalid order.`, view(i));
        return null;
      }
      t.step("compare", `"${a}" is a prefix of "${b}": no information.`, view(i));
      continue;
    }
    const edge: [string, string] = [a[k], b[k]];
    if (!adj.get(a[k])!.has(b[k])) {
      adj.get(a[k])!.add(b[k]);
      edges.push(edge);
    }
    t.step("compare", `First difference at position ${k}: '${a[k]}' comes before '${b[k]}'.`, view(i, k, edge));
  }
  return { letters, adj, edges };
}

const bfs = defineSolution<Input>({
  id: "kahn",
  name: "Kahn's Algorithm (BFS)",
  time: "O(C)",
  space: "O(U + E)",
  idea: "Adjacent words reveal one ordering edge at their first differing letter. Topologically sort the letters. If some letter never reaches in-degree 0, there is a cycle and no valid order.",
  code: code(`
    function alienOrder(words: string[]): string {
      const adj = new Map<string, Set<string>>(), indeg = new Map<string, number>();
      for (const ch of words.join("")) { adj.set(ch, new Set()); indeg.set(ch, 0); } //@letters
      for (let i = 0; i + 1 < words.length; i++) { //@compare
        const [a, b] = [words[i], words[i + 1]];
        const k = [...a].findIndex((ch, j) => ch !== b[j]);
        if (k === -1 || k >= b.length) { if (a.length > b.length) return ""; continue; } //@prefix
        if (!adj.get(a[k])!.has(b[k])) { adj.get(a[k])!.add(b[k]); indeg.set(b[k], indeg.get(b[k])! + 1); }
      }
      const queue = [...indeg].filter(([, d]) => d === 0).map(([ch]) => ch); //@seed
      let order = "";
      while (queue.length) { //@loop
        const ch = queue.shift()!; order += ch; //@take
        for (const next of adj.get(ch)!) {
          indeg.set(next, indeg.get(next)! - 1);
          if (indeg.get(next) === 0) queue.push(next); //@ready
        }
      }
      return order.length === adj.size ? order : ""; //@ret
    }
  `),
  run({ words }, t) {
    const built = buildEdges(words, t);
    if (!built) return "";
    const { letters, adj, edges } = built;
    const indeg = new Map(letters.map((c) => [c, 0]));
    edges.forEach(([, b]) => indeg.set(b, indeg.get(b)! + 1));
    const queue = letters.filter((c) => indeg.get(c) === 0);
    let order = "";
    const view = (cur?: string) => {
      const tn: Record<string, Tone> = {};
      for (const ch of order) tn[ch] = "success";
      queue.forEach((q) => (tn[q] = "compare"));
      if (cur) tn[cur] = "active";
      return [
        graph("letter order", letters, edges, { directed: true, tones: tn }),
        map("in-degree", indeg, tones([cur, "active"])),
        arr("queue", queue, { indexLabels: false }),
        text("order", order),
      ];
    };
    t.step("seed", `Letters with no incoming edges: [${queue}].`, view());
    while (queue.length) {
      t.step("loop", `Queue: [${queue}].`, view());
      const ch = queue.shift()!;
      order += ch;
      t.step("take", `Append '${ch}'.`, view(ch));
      for (const next of adj.get(ch)!) {
        indeg.set(next, indeg.get(next)! - 1);
        if (indeg.get(next) === 0) {
          queue.push(next);
          t.step("ready", `'${next}' has no more letters before it. Enqueue.`, view(ch));
        }
      }
    }
    const ok = order.length === adj.size;
    t.step("ret", ok ? `Order: "${order}".` : "Not every letter was placed: there is a cycle. Return \"\".", view());
    return ok ? order : "";
  },
});

const dfs = defineSolution<Input>({
  id: "dfs",
  name: "DFS Post-order",
  time: "O(C)",
  space: "O(U + E)",
  idea: "Build the same graph. DFS each letter; after visiting everything that must come after it, prepend the letter. A gray (in-progress) letter seen again means a cycle.",
  code: code(`
    function alienOrder(words: string[]): string {
      const adj = new Map<string, Set<string>>();
      for (const ch of words.join("")) adj.set(ch, new Set()); //@letters
      for (let i = 0; i + 1 < words.length; i++) { //@compare
        const [a, b] = [words[i], words[i + 1]];
        const k = [...a].findIndex((ch, j) => ch !== b[j]);
        if (k === -1 || k >= b.length) { if (a.length > b.length) return ""; continue; } //@prefix
        adj.get(a[k])!.add(b[k]);
      }
      const state = new Map<string, number>(); // 1 = visiting, 2 = done
      const out: string[] = [];
      function visit(ch: string): boolean {
        if (state.get(ch) === 1) return false; //@cycle
        if (state.get(ch) === 2) return true; //@done
        state.set(ch, 1); //@enter
        for (const next of adj.get(ch)!) if (!visit(next)) return false;
        state.set(ch, 2); out.push(ch); //@exit
        return true;
      }
      for (const ch of adj.keys()) if (!visit(ch)) return ""; //@start
      return out.reverse().join(""); //@ret
    }
  `),
  run({ words }, t) {
    const built = buildEdges(words, t);
    if (!built) return "";
    const { letters, adj, edges } = built;
    const state = new Map<string, number>();
    const out: string[] = [];
    const view = (cur?: string, bad = false) => {
      const tn: Record<string, Tone> = {};
      state.forEach((s, ch) => (tn[ch] = s === 1 ? "active" : "success"));
      if (cur && bad) tn[cur] = "danger";
      return [graph("letter order", letters, edges, { directed: true, tones: tn }), text("finished (reverse post-order)", [...out].reverse().join(""))];
    };
    const visit = (ch: string): boolean => {
      if (state.get(ch) === 1) {
        t.step("cycle", `'${ch}' is already on the current path: cycle.`, () => view(ch, true));
        return false;
      }
      if (state.get(ch) === 2) {
        t.step("done", `'${ch}' is already placed.`, () => view(ch));
        return true;
      }
      state.set(ch, 1);
      t.step("enter", `Visit '${ch}'.`, () => view(ch));
      for (const next of adj.get(ch)!) if (!visit(next)) return false;
      state.set(ch, 2);
      out.push(ch);
      t.step("exit", `Everything after '${ch}' is placed. Put '${ch}' in front.`, () => view(ch));
      return true;
    };
    for (const ch of letters) {
      if (state.has(ch)) continue;
      t.step("start", `Start DFS at '${ch}'.`, () => view(ch));
      if (!visit(ch)) {
        t.step("ret", 'Cycle found. Return "".', view());
        return "";
      }
    }
    const res = out.reverse().join("");
    t.step("ret", `Order: "${res}".`, view());
    return res;
  },
});

export default defineProblem<Input>({
  description:
    "words is sorted lexicographically by an unknown alien alphabet. Return a string of its letters in a valid order, or \"\" if no order is consistent.",
  input: { default: 'words = ["wrt","wrf","er","ett","rftt"]', parse: (a) => ({ words: a.strs("words") }) },
  examples: [
    { input: 'words = ["wrt","wrf","er","ett","rftt"]', output: "wertf" },
    { input: 'words = ["z","x"]', output: "zx" },
    { input: 'words = ["z","x","z"]', output: "" },
    { input: 'words = ["abc","ab"]', output: "" },
  ],
  solutions: [bfs, dfs],
});

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
  approach: [
    {
      title: "Letters become nodes",
      detail: "Every letter that appears is a node, even if no rule mentions it.",
      at: "letters",
    },
    {
      title: "Adjacent words give one edge",
      detail: "The first position where two neighboring words differ tells us the earlier word's letter comes first. Nothing after that position says anything.",
      at: "compare",
    },
    {
      title: "Invalid prefix case",
      detail: "If a longer word comes before its own prefix (e.g. \"abc\" before \"ab\"), no alphabet can explain it, so return \"\".",
    },
    {
      title: "Topological sort",
      detail: "Start from letters with in-degree 0. Take one, append it, and release its successors.",
      at: "take",
    },
    {
      title: "Detect cycles",
      detail: "If some letters never reach in-degree 0, they lie on a cycle and no order exists.",
      at: "ret",
    },
  ],
  code: code(`
    function alienOrder(words: string[]): string {
      // lettersAfter.get(x) = letters that must come after x
      const lettersAfter = new Map<string, Set<string>>();
      const inDegree = new Map<string, number>();
      for (const word of words) { //@letters
        for (const letter of word) {
          if (!lettersAfter.has(letter)) {
            lettersAfter.set(letter, new Set());
            inDegree.set(letter, 0);
          }
        }
      }

      for (let i = 0; i + 1 < words.length; i++) { //@compare
        const word = words[i];
        const nextWord = words[i + 1];
        let pos = 0;
        while (pos < word.length && pos < nextWord.length && word[pos] === nextWord[pos]) {
          pos++;
        }
        if (pos === word.length || pos === nextWord.length) { //@prefix
          // One word is a prefix of the other. A longer word can't come before its prefix.
          if (word.length > nextWord.length) return "";
          continue;
        }
        const before = word[pos];
        const after = nextWord[pos];
        if (!lettersAfter.get(before)!.has(after)) {
          lettersAfter.get(before)!.add(after);
          inDegree.set(after, inDegree.get(after)! + 1);
        }
      }

      const queue: string[] = [];
      for (const [letter, degree] of inDegree) { //@seed
        if (degree === 0) queue.push(letter);
      }
      let order = "";
      while (queue.length > 0) { //@loop
        const letter = queue.shift()!; //@take
        order += letter;
        for (const nextLetter of lettersAfter.get(letter)!) {
          inDegree.set(nextLetter, inDegree.get(nextLetter)! - 1);
          if (inDegree.get(nextLetter) === 0) queue.push(nextLetter); //@ready
        }
      }
      const usedEveryLetter = order.length === lettersAfter.size;
      return usedEveryLetter ? order : ""; //@ret
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
  approach: [
    {
      title: "Build the graph",
      detail: "Same edges: the first differing letters of adjacent words.",
      at: "compare",
    },
    {
      title: "Enter a letter",
      detail: "Mark it visiting and recurse into every letter that must come after it.",
      at: "enter",
    },
    {
      title: "Post-order placement",
      detail: "When everything after a letter has been placed, add it to the finished list. Reversed, that list is a valid order.",
      at: "exit",
    },
    {
      title: "Cycle check",
      detail: "Reaching a letter still marked visiting means a cycle, so the answer is \"\".",
      at: "ret",
    },
  ],
  code: code(`
    function alienOrder(words: string[]): string {
      // lettersAfter.get(x) = letters that must come after x
      const lettersAfter = new Map<string, Set<string>>();
      for (const word of words) { //@letters
        for (const letter of word) {
          if (!lettersAfter.has(letter)) lettersAfter.set(letter, new Set());
        }
      }

      for (let i = 0; i + 1 < words.length; i++) { //@compare
        const word = words[i];
        const nextWord = words[i + 1];
        let pos = 0;
        while (pos < word.length && pos < nextWord.length && word[pos] === nextWord[pos]) {
          pos++;
        }
        if (pos === word.length || pos === nextWord.length) { //@prefix
          // One word is a prefix of the other. A longer word can't come before its prefix.
          if (word.length > nextWord.length) return "";
          continue;
        }
        lettersAfter.get(word[pos])!.add(nextWord[pos]);
      }

      const state = new Map<string, "visiting" | "done">();
      const finished: string[] = [];
      function visit(letter: string): boolean {
        if (state.get(letter) === "visiting") return false; //@cycle
        if (state.get(letter) === "done") return true; //@done
        state.set(letter, "visiting"); //@enter
        for (const nextLetter of lettersAfter.get(letter)!) {
          if (!visit(nextLetter)) return false;
        }
        state.set(letter, "done"); //@exit
        finished.push(letter);
        return true;
      }

      for (const letter of lettersAfter.keys()) { //@start
        if (!visit(letter)) return "";
      }
      return finished.reverse().join(""); //@ret
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

import { arr, edgeKey, graph, map, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  beginWord: string;
  endWord: string;
  wordList: string[];
}

const neighbors = (w: string, dict: Set<string>) => {
  const out: string[] = [];
  for (let i = 0; i < w.length; i++)
    for (let c = 97; c <= 122; c++) {
      const v = w.slice(0, i) + String.fromCharCode(c) + w.slice(i + 1);
      if (v !== w && dict.has(v)) out.push(v);
    }
  return out;
};

/** Word graph (one-letter edges) for drawing; small inputs only. */
function wordGraph(words: string[]) {
  const edges: [string, string][] = [];
  for (let i = 0; i < words.length; i++)
    for (let j = i + 1; j < words.length; j++) {
      let diff = 0;
      for (let k = 0; k < words[i].length && diff < 2; k++) if (words[i][k] !== words[j][k]) diff++;
      if (diff === 1) edges.push([words[i], words[j]]);
    }
  return edges;
}

const bfs = defineSolution<Input>({
  id: "bfs",
  name: "BFS over One-letter Changes",
  time: "O(N · L · 26)",
  space: "O(N)",
  idea: "Words are nodes and one-letter changes are edges. BFS from beginWord finds the shortest chain. Generate neighbors by trying all 26 letters at each position, and delete words from the dictionary once queued.",
  code: code(`
    function ladderLength(beginWord: string, endWord: string, wordList: string[]): number {
      const dict = new Set(wordList);
      if (!dict.has(endWord)) return 0; //@missing
      let level = [beginWord], steps = 1; //@init
      while (level.length) { //@level
        const next: string[] = [];
        for (const w of level) //@word
          for (let i = 0; i < w.length; i++)
            for (const c of "abcdefghijklmnopqrstuvwxyz") {
              const v = w.slice(0, i) + c + w.slice(i + 1);
              if (v === endWord) return steps + 1; //@found
              if (dict.delete(v)) next.push(v); //@enqueue
            }
        level = next; steps++;
      }
      return 0; //@ret
    }
  `),
  run({ beginWord, endWord, wordList }, t) {
    const dict = new Set(wordList);
    const all = [...new Set([beginWord, ...wordList])];
    const edges = wordGraph(all);
    const dist = new Map<string, number>([[beginWord, 1]]);
    const parent = new Map<string, string>();
    const view = (cur?: string, nb?: string, done = false) => {
      const tn: Record<string, Tone> = {};
      dist.forEach((_, w) => (tn[w] = "visited"));
      if (cur) tn[cur] = "active";
      if (nb) tn[nb] = done ? "success" : "compare";
      tn[endWord] ??= "window";
      const et: Record<string, Tone> = {};
      if (cur && nb) et[edgeKey(cur, nb)] = et[edgeKey(nb, cur)] = done ? "success" : "active";
      return [graph("words (edge = one letter apart)", all, edges, { tones: tn, edgeTones: et }), map("steps to reach", dist)];
    };
    if (!dict.has(endWord)) {
      t.step("missing", `"${endWord}" is not in the word list. Return 0.`, () => view());
      return 0;
    }
    let level = [beginWord],
      steps = 1;
    t.step("init", `Start at "${beginWord}" (chain length 1).`, () => view(beginWord));
    while (level.length) {
      t.step("level", `Level ${steps}: [${level.join(", ")}].`, () => [...view(), arr("level", level, { indexLabels: false })]);
      const next: string[] = [];
      for (const w of level) {
        t.step("word", `Try every one-letter change of "${w}".`, () => view(w));
        for (const v of neighbors(w, new Set([...dict, endWord]))) {
          if (v === endWord) {
            dist.set(v, steps + 1);
            parent.set(v, w);
            t.step("found", `"${w}" → "${v}" reaches the end word. Chain length ${steps + 1}.`, () => view(w, v, true));
            return steps + 1;
          }
          if (dict.delete(v)) {
            next.push(v);
            dist.set(v, steps + 1);
            parent.set(v, w);
            t.step("enqueue", `"${v}" is a new word. Queue it at length ${steps + 1}.`, () => view(w, v));
          }
        }
      }
      level = next;
      steps++;
    }
    t.step("ret", "Ran out of words. Return 0.", () => view());
    return 0;
  },
});

const bidirectional = defineSolution<Input>({
  id: "bidirectional-bfs",
  name: "Bidirectional BFS",
  time: "O(N · L · 26)",
  space: "O(N)",
  idea: "Grow one frontier from each end and always expand the smaller one. The search ends when a generated word lies in the other frontier. This explores far fewer words when branching is large.",
  code: code(`
    function ladderLength(beginWord: string, endWord: string, wordList: string[]): number {
      const dict = new Set(wordList);
      if (!dict.has(endWord)) return 0; //@missing
      let front = new Set([beginWord]), back = new Set([endWord]), steps = 1; //@init
      dict.delete(endWord);
      while (front.size && back.size) { //@level
        if (front.size > back.size) [front, back] = [back, front]; //@swap
        const next = new Set<string>();
        for (const w of front)
          for (let i = 0; i < w.length; i++)
            for (const c of "abcdefghijklmnopqrstuvwxyz") {
              const v = w.slice(0, i) + c + w.slice(i + 1);
              if (back.has(v)) return steps + 1; //@meet
              if (dict.delete(v)) next.add(v); //@expand
            }
        front = next; steps++;
      }
      return 0; //@ret
    }
  `),
  run({ beginWord, endWord, wordList }, t) {
    const dict = new Set(wordList);
    const all = [...new Set([beginWord, ...wordList])];
    const edges = wordGraph(all);
    const fromBegin = new Set([beginWord]),
      fromEnd = new Set([endWord]);
    let front = new Set([beginWord]),
      back = new Set([endWord]),
      steps = 1;
    const view = (cur?: string, nb?: string, meet = false) => {
      const tn: Record<string, Tone> = {};
      fromBegin.forEach((w) => (tn[w] = "compare"));
      fromEnd.forEach((w) => (tn[w] = "window"));
      if (cur) tn[cur] = "active";
      if (nb) tn[nb] = meet ? "success" : "active";
      const et: Record<string, Tone> = {};
      if (cur && nb) et[edgeKey(cur, nb)] = et[edgeKey(nb, cur)] = meet ? "success" : "active";
      return [
        vars({ steps }),
        graph("words (two colors = two searches)", all, edges, { tones: tn, edgeTones: et }),
        arr("front", [...front], { indexLabels: false }),
        arr("back", [...back], { indexLabels: false }),
      ];
    };
    if (!dict.has(endWord)) {
      t.step("missing", `"${endWord}" is not in the word list. Return 0.`, () => view());
      return 0;
    }
    dict.delete(endWord);
    t.step("init", "One frontier from each end.", () => view());
    while (front.size && back.size) {
      if (front.size > back.size) {
        [front, back] = [back, front];
        t.step("swap", "Expand the smaller frontier.", () => view());
      } else t.step("level", `Expand the frontier of size ${front.size}.`, () => view());
      const side = front.has(beginWord) || [...front].some((w) => fromBegin.has(w)) ? fromBegin : fromEnd;
      const next = new Set<string>();
      for (const w of front)
        for (const v of neighbors(w, new Set([...dict, ...back]))) {
          if (back.has(v)) {
            t.step("meet", `"${w}" → "${v}" joins the two searches. Chain length ${steps + 1}.`, () => view(w, v, true));
            return steps + 1;
          }
          if (dict.delete(v)) {
            next.add(v);
            side.add(v);
            t.step("expand", `Reach "${v}" from "${w}".`, () => view(w, v));
          }
        }
      front = next;
      steps++;
    }
    t.step("ret", "A frontier emptied out. Return 0.", () => view());
    return 0;
  },
});

export default defineProblem<Input>({
  description: "Transform beginWord into endWord by changing one letter at a time, where every intermediate word must be in wordList. Return the number of words in the shortest such sequence, or 0 if none exists.",
  input: {
    default: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]',
    parse: (a) => ({ beginWord: a.str("beginWord"), endWord: a.str("endWord"), wordList: a.strs("wordList") }),
  },
  examples: [
    { input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]', output: 5 },
    { input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log"]', output: 0 },
    { input: 'beginWord = "a", endWord = "c", wordList = ["a","b","c"]', output: 2 },
  ],
  solutions: [bfs, bidirectional],
});

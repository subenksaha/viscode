import { arr, map, range, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  s: string;
  wordDict: string[];
}

const memo = defineSolution<Input>({
  id: "memo",
  name: "Top-down Memoization",
  time: "O(n³)",
  space: "O(n)",
  idea: "can(i): does s[i..] split into dictionary words? Try every word that matches at i and recurse on the rest. Cache each start index.",
  code: code(`
    function wordBreak(s: string, wordDict: string[]): boolean {
      const memo = new Map<number, boolean>();
      function can(i: number): boolean {
        if (i === s.length) return true; //@base
        if (memo.has(i)) return memo.get(i)!; //@hit
        for (const w of wordDict) //@try
          if (s.startsWith(w, i) && can(i + w.length)) { memo.set(i, true); return true; } //@match
        memo.set(i, false); //@fail
        return false;
      }
      return can(0); //@ret
    }
  `),
  run({ s, wordDict }, t) {
    const cache = new Map<number, boolean>();
    const view = (i: number, w?: string, ok?: boolean) => [
      vars({ i, word: w }),
      arr("s", [...s], {
        tones: tones(...range(0, i - 1, "visited"), ...(w ? range(i, i + w.length - 1, ok ? "success" : "danger") : [])),
        pointers: { i },
      }),
      map("memo (start → can split)", cache),
    ];
    const can = (i: number): boolean => {
      if (i === s.length) {
        t.step("base", "Reached the end: the split works.", () => view(i));
        return true;
      }
      if (cache.has(i)) {
        t.step("hit", `can(${i}) is cached as ${cache.get(i)}.`, () => view(i));
        return cache.get(i)!;
      }
      for (const w of wordDict) {
        const fits = s.startsWith(w, i);
        t.step("try", fits ? `"${w}" matches at ${i}. Recurse on the rest.` : `"${w}" does not match at ${i}.`, () => view(i, w, fits));
        if (fits && can(i + w.length)) {
          cache.set(i, true);
          t.step("match", `can(${i}) = true.`, () => view(i, w, true));
          return true;
        }
      }
      cache.set(i, false);
      t.step("fail", `No word works from ${i}: can(${i}) = false.`, () => view(i));
      return false;
    };
    const res = can(0);
    t.step("ret", `Return ${res}.`, () => view(0));
    return res;
  },
});

const bottomUp = defineSolution<Input>({
  id: "bottom-up",
  name: "Bottom-up DP",
  time: "O(n² · k)",
  space: "O(n)",
  idea: "dp[i] = s[0..i) can be segmented. dp[i] is true if some j < i has dp[j] true and s[j..i) is a dictionary word.",
  code: code(`
    function wordBreak(s: string, wordDict: string[]): boolean {
      const dict = new Set(wordDict);
      const dp = new Array(s.length + 1).fill(false);
      dp[0] = true; //@init
      for (let i = 1; i <= s.length; i++) //@i
        for (let j = 0; j < i; j++) //@j
          if (dp[j] && dict.has(s.slice(j, i))) { dp[i] = true; break; } //@hit
      return dp[s.length]; //@ret
    }
  `),
  run({ s, wordDict }, t) {
    const dict = new Set(wordDict);
    const dp = new Array(s.length + 1).fill(false);
    dp[0] = true;
    const view = (i?: number, j?: number, ok?: boolean) => [
      vars({ piece: i !== undefined && j !== undefined ? s.slice(j, i) : undefined }),
      arr("s", [...s], { tones: i !== undefined && j !== undefined ? tones(...range(j, i - 1, ok ? "success" : "compare")) : {} }),
      arr("dp", dp.map((v) => (v ? "T" : "F")), { tones: tones([j, "compare"], [i, ok ? "success" : "active"]) }),
    ];
    t.step("init", "dp[0] = true: the empty prefix is always segmentable.", view());
    for (let i = 1; i <= s.length; i++) {
      t.step("i", `Can the prefix s[0..${i}) = "${s.slice(0, i)}" be split?`, () => view(i));
      for (let j = 0; j < i; j++) {
        const ok = dp[j] && dict.has(s.slice(j, i));
        if (!dp[j]) continue;
        if (ok) {
          dp[i] = true;
          t.step("hit", `dp[${j}] is true and "${s.slice(j, i)}" is a word, so dp[${i}] = true.`, () => view(i, j, true));
          break;
        }
        t.step("j", `dp[${j}] is true but "${s.slice(j, i)}" is not a word.`, () => view(i, j));
      }
    }
    t.step("ret", `Return dp[${s.length}] = ${dp[s.length]}.`, view(s.length));
    return dp[s.length];
  },
});

const bfs = defineSolution<Input>({
  id: "bfs",
  name: "BFS over Start Indices",
  time: "O(n² · k)",
  space: "O(n)",
  idea: "Treat each index as a node with an edge i → i + len(w) when word w matches at i. Is index n reachable from 0?",
  code: code(`
    function wordBreak(s: string, wordDict: string[]): boolean {
      const queue = [0], seen = new Set([0]); //@init
      while (queue.length) { //@loop
        const i = queue.shift()!; //@pop
        for (const w of wordDict) {
          if (!s.startsWith(w, i)) continue;
          const next = i + w.length;
          if (next === s.length) return true; //@done
          if (!seen.has(next)) { seen.add(next); queue.push(next); } //@push
        }
      }
      return false; //@ret
    }
  `),
  run({ s, wordDict }, t) {
    const queue = [0],
      seen = new Set([0]);
    const view = (i?: number, w?: string) => [
      arr("s", [...s], { tones: tones(...[...seen].map((k) => [k, "visited"] as [number, "visited"]), ...(i !== undefined && w ? range(i, i + w.length - 1, "success") : []), [i, "active"]), pointers: { i } }),
      arr("queue", queue, { indexLabels: false }),
    ];
    t.step("init", "Start from index 0.", view());
    while (queue.length) {
      t.step("loop", `Queue: [${queue}].`, view());
      const i = queue.shift()!;
      t.step("pop", `Visit index ${i}.`, view(i));
      for (const w of wordDict) {
        if (!s.startsWith(w, i)) continue;
        const next = i + w.length;
        if (next === s.length) {
          t.step("done", `"${w}" reaches the end. Return true.`, () => view(i, w));
          return true;
        }
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
          t.step("push", `"${w}" leads to index ${next}.`, () => view(i, w));
        }
      }
    }
    t.step("ret", "The end is unreachable. Return false.", view());
    return false;
  },
});

export default defineProblem<Input>({
  description: "Return true if s can be split into a sequence of one or more words from wordDict. Words may be reused.",
  input: {
    default: 's = "applepenapple", wordDict = ["apple","pen"]',
    parse: (a) => ({ s: a.str("s"), wordDict: a.strs("wordDict") }),
  },
  examples: [
    { input: 's = "leetcode", wordDict = ["leet","code"]', output: true },
    { input: 's = "applepenapple", wordDict = ["apple","pen"]', output: true },
    { input: 's = "catsandog", wordDict = ["cats","dog","sand","and","cat"]', output: false },
  ],
  solutions: [memo, bottomUp, bfs],
});

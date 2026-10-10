import { arr, map, naryTree, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  ops: string[];
  args: string[][];
}

const fmtOut = (out: (boolean | null)[]) => out.map((o) => (o === null ? "null" : String(o)));

const byLength = defineSolution<Input>({
  id: "bucket-by-length",
  name: "Words Bucketed by Length",
  time: "O(n·L) per search",
  space: "O(total chars)",
  idea: "Store words grouped by length. A search compares the pattern with every stored word of the same length, letting '.' match anything.",
  code: code(`
    class WordDictionary {
      byLen = new Map<number, string[]>(); //@ctor
      addWord(word: string): void {
        if (!this.byLen.has(word.length)) this.byLen.set(word.length, []);
        this.byLen.get(word.length)!.push(word); //@add
      }
      search(p: string): boolean {
        for (const w of this.byLen.get(p.length) ?? []) //@cmp
          if ([...p].every((c, i) => c === "." || c === w[i])) return true; //@hit
        return false; //@miss
      }
    }
  `),
  run({ ops, args }, t) {
    const byLen = new Map<number, string[]>();
    const out: (boolean | null)[] = [];
    const view = (op: string, hi?: string, tone: Tone = "active") => [
      vars({ op }),
      map("words by length", [...byLen].map(([k, v]) => [String(k), v.join(", ")] as [string, string]), tones([hi, tone])),
      arr("output", fmtOut(out), { indexLabels: false }),
    ];
    ops.forEach((op, k) => {
      const w = args[k][0];
      const label = `${op}(${w !== undefined ? `"${w}"` : ""})`;
      if (op === "WordDictionary") {
        out.push(null);
        t.step("ctor", "Empty dictionary.", view(label));
      } else if (op === "addWord") {
        if (!byLen.has(w.length)) byLen.set(w.length, []);
        byLen.get(w.length)!.push(w);
        out.push(null);
        t.step("add", `Add "${w}" to the length-${w.length} bucket.`, view(label, String(w.length)));
      } else {
        const bucket = byLen.get(w.length) ?? [];
        let found = false;
        for (const cand of bucket) {
          const ok = [...w].every((c, i) => c === "." || c === cand[i]);
          if (ok) {
            found = true;
            out.push(true);
            t.step("hit", `"${w}" matches "${cand}".`, view(label, String(w.length), "success"));
            break;
          }
          t.step("cmp", `"${w}" does not match "${cand}".`, view(label, String(w.length)));
        }
        if (!found) {
          out.push(false);
          t.step("miss", `No word of length ${w.length} matches "${w}".`, view(label, String(w.length), "danger"));
        }
      }
    });
    return out;
  },
});

interface Node {
  ch: string;
  end: boolean;
  kids: Map<string, Node>;
}
const node = (ch: string): Node => ({ ch, end: false, kids: new Map() });

const trie = defineSolution<Input>({
  id: "trie-dfs",
  name: "Trie + DFS on Wildcards",
  time: "O(L) add, O(26^dots · L) search",
  space: "O(total chars)",
  idea: "Insert words into a trie. Searching follows one child per letter; at a '.', it tries every child and succeeds if any branch matches the rest.",
  code: code(`
    class WordDictionary {
      root = new TrieNode(); //@ctor
      addWord(word: string): void {
        let n = this.root;
        for (const c of word) n = n.kids.get(c) ?? n.kids.set(c, new TrieNode()).get(c)!; //@add
        n.end = true; //@end
      }
      search(word: string, i = 0, n = this.root): boolean {
        if (i === word.length) return n.end; //@leaf
        if (word[i] === ".") //@dot
          return [...n.kids.values()].some((k) => this.search(word, i + 1, k));
        const next = n.kids.get(word[i]); //@letter
        return !!next && this.search(word, i + 1, next);
      }
    }
  `),
  run({ ops, args }, t) {
    const root = node("");
    const out: (boolean | null)[] = [];
    const view = (op: string, word: string, i: number, path: Node[], tone: Tone = "active") => [
      vars({ op }),
      arr("word", [...word], { tones: tones([i < word.length ? i : null, tone]) }),
      naryTree("trie (* = end of word)", root, (n) => [...n.kids.values()].sort((a, b) => a.ch.localeCompare(b.ch)), (n) => (n === root ? "·" : n.ch + (n.end ? "*" : "")), {
        tones: path.map((n, k) => [n, k === path.length - 1 ? tone : "success"] as [Node, Tone]),
      }),
      arr("output", fmtOut(out), { indexLabels: false }),
    ];
    ops.forEach((op, k) => {
      const w = args[k][0];
      const label = `${op}(${w !== undefined ? `"${w}"` : ""})`;
      if (op === "WordDictionary") {
        out.push(null);
        t.step("ctor", "Empty trie.", view(label, "", 0, [root]));
        return;
      }
      if (op === "addWord") {
        let n = root;
        const path = [root];
        for (let i = 0; i < w.length; i++) {
          if (!n.kids.has(w[i])) n.kids.set(w[i], node(w[i]));
          n = n.kids.get(w[i])!;
          path.push(n);
          t.step("add", `Walk/create '${w[i]}'.`, () => view(label, w, i, path));
        }
        n.end = true;
        out.push(null);
        t.step("end", `Mark the end of "${w}".`, () => view(label, w, w.length, path, "success"));
        return;
      }
      const search = (i: number, n: Node, path: Node[]): boolean => {
        if (i === w.length) {
          t.step("leaf", n.end ? "Reached the end on a word end: match." : "Reached the end, but no word ends here.", () => view(label, w, i, path, n.end ? "success" : "danger"));
          return n.end;
        }
        if (w[i] === ".") {
          t.step("dot", `'.' at ${i}: try each of ${n.kids.size} children.`, () => view(label, w, i, path));
          for (const kid of [...n.kids.values()]) if (search(i + 1, kid, [...path, kid])) return true;
          return false;
        }
        const next = n.kids.get(w[i]);
        t.step("letter", next ? `Follow '${w[i]}'.` : `No child '${w[i]}'. Dead end.`, () => view(label, w, i, next ? [...path, next] : path, next ? "active" : "danger"));
        return !!next && search(i + 1, next, [...path, next]);
      };
      out.push(search(0, root, [root]));
    });
    return out;
  },
});

export default defineProblem<Input>({
  description: "Design a structure that supports addWord(word) and search(word), where the search pattern may contain '.' to match any single letter. Input is a LeetCode-style list of operations.",
  input: {
    default:
      'ops = ["WordDictionary","addWord","addWord","addWord","search","search","search","search"], args = [[],["bad"],["dad"],["mad"],["pad"],["bad"],[".ad"],["b.."]]',
    parse: (a) => {
      const ops = a.strs("ops");
      const args = a.matrix<string>("args");
      if (ops.length !== args.length) throw new Error("ops and args must have the same length");
      return { ops, args };
    },
  },
  examples: [
    {
      input: 'ops = ["WordDictionary","addWord","addWord","addWord","search","search","search","search"], args = [[],["bad"],["dad"],["mad"],["pad"],["bad"],[".ad"],["b.."]]',
      output: [null, null, null, null, false, true, true, true],
    },
    {
      input: 'ops = ["WordDictionary","addWord","search","search","search"], args = [[],["a"],["."],["a."],[".."]]',
      output: [null, null, true, false, false],
    },
  ],
  solutions: [byLength, trie],
});

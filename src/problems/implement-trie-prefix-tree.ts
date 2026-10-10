import { arr, naryTree, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution, type Tracer } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  ops: string[];
  args: string[][];
}

interface TrieNode {
  ch: string;
  end: boolean;
  /** Children in display order. */
  kids: () => TrieNode[];
  get: (c: string) => TrieNode | undefined;
  add: (c: string) => TrieNode;
}

function mapNode(ch: string): TrieNode {
  const children = new Map<string, TrieNode>();
  return {
    ch,
    end: false,
    kids: () => [...children.values()].sort((a, b) => a.ch.localeCompare(b.ch)),
    get: (c) => children.get(c),
    add: (c) => {
      const n = mapNode(c);
      children.set(c, n);
      return n;
    },
  };
}

function arrayNode(ch: string): TrieNode {
  const children: (TrieNode | undefined)[] = new Array(26);
  return {
    ch,
    end: false,
    kids: () => children.filter((c): c is TrieNode => !!c),
    get: (c) => children[c.charCodeAt(0) - 97],
    add: (c) => (children[c.charCodeAt(0) - 97] = arrayNode(c)),
  };
}

/** Replays the LeetCode op list against a trie built from `make`, tracing every character step. */
function simulate({ ops, args }: Input, t: Tracer, make: (ch: string) => TrieNode) {
  const root = make("");
  const out: (boolean | null)[] = [];
  const view = (op: string, word: string, i: number, path: TrieNode[], tone: Tone = "active") => [
    vars({ op: `${op}("${word}")` }),
    arr("word", [...word], { tones: tones(...[...word].map((_, k) => [k < i ? k : null, "success"] as [number | null, "success"]), [i < word.length ? i : null, tone]) }),
    naryTree("trie (* = end of word)", root, (n) => n.kids(), (n) => (n === root ? "·" : n.ch + (n.end ? "*" : "")), {
      tones: path.map((n, k) => [n, k === path.length - 1 ? tone : "success"] as [TrieNode, Tone]),
    }),
    arr("output", out.map((o) => (o === null ? "null" : String(o))), { indexLabels: false }),
  ];
  ops.forEach((op, k) => {
    if (op === "Trie") {
      out.push(null);
      t.step("ctor", "Create an empty trie.", view(op, "", 0, [root]));
      return;
    }
    const word = args[k][0];
    let n = root;
    const path = [root];
    if (op === "insert") {
      for (let i = 0; i < word.length; i++) {
        const c = word[i];
        const existed = !!n.get(c);
        n = n.get(c) ?? n.add(c);
        path.push(n);
        t.step("insert-step", existed ? `'${c}' already exists. Follow it.` : `Create a node for '${c}'.`, () => view(op, word, i, path));
      }
      n.end = true;
      out.push(null);
      t.step("insert-end", `Mark the end of "${word}".`, () => view(op, word, word.length, path, "success"));
      return;
    }
    let ok = true;
    for (let i = 0; i < word.length; i++) {
      const next = n.get(word[i]);
      if (!next) {
        ok = false;
        t.step("walk", `No child '${word[i]}'. Stop.`, () => view(op, word, i, path, "danger"));
        break;
      }
      n = next;
      path.push(n);
      t.step("walk", `Follow '${word[i]}'.`, () => view(op, word, i, path));
    }
    const res = op === "search" ? ok && n.end : ok;
    out.push(res);
    t.step(op === "search" ? "search-end" : "prefix-end", op === "search" ? (ok ? (n.end ? `"${word}" ends here: true.` : `"${word}" is only a prefix: false.`) : "Path missing: false.") : ok ? `Prefix "${word}" exists: true.` : "Prefix missing: false.", () => view(op, word, word.length, path, res ? "success" : "danger"));
  });
  return out;
}

const withMap = defineSolution<Input>({
  id: "hash-map-children",
  name: "Hash Map Children",
  time: "O(L) per op",
  space: "O(total chars)",
  idea: "Each node maps a character to its child node and flags whether a word ends there. insert creates missing nodes; search and startsWith just walk.",
  code: code(`
    class TrieNode { kids = new Map<string, TrieNode>(); end = false; }
    class Trie {
      root = new TrieNode(); //@ctor
      insert(word: string): void {
        let n = this.root;
        for (const c of word) { //@insert-step
          if (!n.kids.has(c)) n.kids.set(c, new TrieNode());
          n = n.kids.get(c)!;
        }
        n.end = true; //@insert-end
      }
      private walk(s: string): TrieNode | null {
        let n: TrieNode | undefined = this.root;
        for (const c of s) if (!(n = n.kids.get(c))) return null; //@walk
        return n;
      }
      search(word: string): boolean { return this.walk(word)?.end ?? false; } //@search-end
      startsWith(prefix: string): boolean { return this.walk(prefix) !== null; } //@prefix-end
    }
  `),
  run: (input, t) => simulate(input, t, mapNode),
});

const withArray = defineSolution<Input>({
  id: "array-children",
  name: "Fixed 26-slot Array Children",
  time: "O(L) per op",
  space: "O(26 · nodes)",
  idea: "For lowercase words, store children in an array indexed by letter. Lookups are direct, but every node reserves 26 slots.",
  code: code(`
    class TrieNode { kids: (TrieNode | undefined)[] = new Array(26); end = false; }
    const idx = (c: string) => c.charCodeAt(0) - 97;
    class Trie {
      root = new TrieNode(); //@ctor
      insert(word: string): void {
        let n = this.root;
        for (const c of word) n = n.kids[idx(c)] ??= new TrieNode(); //@insert-step
        n.end = true; //@insert-end
      }
      private walk(s: string): TrieNode | null {
        let n = this.root;
        for (const c of s) { const k = n.kids[idx(c)]; if (!k) return null; n = k; } //@walk
        return n;
      }
      search(word: string): boolean { return this.walk(word)?.end ?? false; } //@search-end
      startsWith(prefix: string): boolean { return this.walk(prefix) !== null; } //@prefix-end
    }
  `),
  run: (input, t) => simulate(input, t, arrayNode),
});

export default defineProblem<Input>({
  description: "Implement a trie with insert(word), search(word) (is the whole word stored?) and startsWith(prefix) (is any stored word prefixed by it?). Input is a LeetCode-style list of operations.",
  input: {
    default:
      'ops = ["Trie","insert","insert","search","search","startsWith","insert","search","startsWith"], args = [[],["apple"],["apt"],["apple"],["app"],["app"],["app"],["app"],["b"]]',
    parse: (a) => {
      const ops = a.strs("ops");
      const args = a.matrix<string>("args");
      if (ops.length !== args.length) throw new Error("ops and args must have the same length");
      return { ops, args };
    },
  },
  examples: [
    {
      input: 'ops = ["Trie","insert","search","search","startsWith","insert","search"], args = [[],["apple"],["apple"],["app"],["app"],["app"],["app"]]',
      output: [null, null, true, false, true, null, true],
    },
  ],
  solutions: [withMap, withArray],
});

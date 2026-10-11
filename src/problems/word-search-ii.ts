import { arr, grid, rc, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  board: string[][];
  words: string[];
}

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

function boardView(board: string[][], path: [number, number][], found: string[], extra: Record<string, unknown>, tone: Tone = "active") {
  const tn: Record<string, Tone> = {};
  path.forEach(([r, c], i) => (tn[rc(r, c)] = i === path.length - 1 ? tone : "compare"));
  return [vars(extra), grid("board", board, { tones: tn }), arr("found", found, { indexLabels: false, tones: { [found.length - 1]: "success" } })];
}

const perWord = defineSolution<Input>({
  id: "word-by-word",
  name: "Word Search per Word",
  time: "O(W · m·n · 4^L)",
  space: "O(L)",
  idea: "Run the classic Word Search backtracking once for every word: start from each cell, extend the path one matching letter at a time, and mark cells while they are in use.",
  code: code(`
    function findWords(board: string[][], words: string[]): string[] {
      const rows = board.length;
      const cols = board[0].length;
      // Can we spell word[index..] starting at (row, col)?
      function spell(word: string, index: number, row: number, col: number): boolean {
        if (index === word.length) return true; //@done
        const outside = row < 0 || col < 0 || row >= rows || col >= cols;
        if (outside || board[row][col] !== word[index]) return false;
        const letter = board[row][col];
        board[row][col] = "#"; // mark as used on this path //@visit
        const found =
          spell(word, index + 1, row + 1, col) ||
          spell(word, index + 1, row - 1, col) ||
          spell(word, index + 1, row, col + 1) ||
          spell(word, index + 1, row, col - 1);
        board[row][col] = letter; // restore //@undo
        return found;
      }
      const result: string[] = [];
      for (const word of words) { //@word
        let found = false;
        for (let row = 0; row < rows && !found; row++) {
          for (let col = 0; col < cols && !found; col++) {
            found = spell(word, 0, row, col);
          }
        }
        if (found) result.push(word); //@found
      }
      return result; //@ret
    }
  `),
  run({ board, words }, t) {
    const m = board.length,
      n = board[0].length;
    const res: string[] = [];
    const path: [number, number][] = [];
    for (const w of words) {
      t.step("word", `Look for "${w}".`, () => boardView(board, [], res, { word: w }));
      const dfs = (i: number, r: number, c: number): boolean => {
        if (i === w.length) return true;
        if (r < 0 || c < 0 || r >= m || c >= n || board[r][c] !== w[i]) return false;
        const ch = board[r][c];
        board[r][c] = "#";
        path.push([r, c]);
        t.step("visit", `Match '${ch}' (letter ${i + 1} of "${w}") at (${r}, ${c}).`, () => boardView(board, path, res, { word: w, matched: w.slice(0, i + 1) }));
        let ok = false;
        for (const [dr, dc] of DIRS) if ((ok = dfs(i + 1, r + dr, c + dc))) break;
        board[r][c] = ch;
        path.pop();
        if (!ok) t.step("undo", `Backtrack from (${r}, ${c}).`, () => boardView(board, path, res, { word: w }));
        return ok;
      };
      let hit = false;
      for (let r = 0; r < m && !hit; r++) for (let c = 0; c < n && !hit; c++) hit = dfs(0, r, c);
      if (hit) {
        res.push(w);
        t.step("found", `"${w}" is on the board.`, () => boardView(board, [], res, { word: w }, "success"));
      } else t.step("word", `"${w}" is not on the board.`, () => boardView(board, [], res, { word: w }));
    }
    t.step("ret", `Return [${res}].`, () => boardView(board, [], res, {}));
    return res;
  },
});

interface Trie {
  kids: Map<string, Trie>;
  word: string | null;
}

const trieDfs = defineSolution<Input>({
  id: "trie-backtracking",
  name: "Trie + Backtracking",
  time: "O(m·n · 4^L)",
  space: "O(total chars)",
  idea: "Put all words in a trie and run one DFS from every cell, walking the board and the trie together. A path stops as soon as no word has it as a prefix; reaching a stored word records it once.",
  code: code(`
    function findWords(board: string[][], words: string[]): string[] {
      // Trie node: children by letter, and the full word if one ends here.
      type TrieNode = { children: Map<string, TrieNode>; word: string | null };
      const root: TrieNode = { children: new Map(), word: null };
      for (const word of words) { //@build
        let node = root;
        for (const letter of word) {
          if (!node.children.has(letter)) node.children.set(letter, { children: new Map(), word: null });
          node = node.children.get(letter)!;
        }
        node.word = word;
      }
      const result: string[] = [];
      const rows = board.length;
      const cols = board[0].length;
      // Walk the board and the trie together, so all words are searched at once.
      function search(row: number, col: number, node: TrieNode) {
        const outside = row < 0 || col < 0 || row >= rows || col >= cols;
        if (outside) return;
        const letter = board[row][col];
        const next = node.children.get(letter);
        if (next === undefined) return; // no word continues this way (or the cell is used) //@prune
        if (next.word !== null) { //@found
          result.push(next.word);
          next.word = null; // don't report it twice
        }
        board[row][col] = "#"; // mark as used on this path //@visit
        search(row + 1, col, next);
        search(row - 1, col, next);
        search(row, col + 1, next);
        search(row, col - 1, next);
        board[row][col] = letter; // restore //@undo
      }
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) search(row, col, root); //@start
      }
      return result; //@ret
    }
  `),
  run({ board, words }, t) {
    const root: Trie = { kids: new Map(), word: null };
    for (const w of words) {
      let nd = root;
      for (const c of w) {
        if (!nd.kids.has(c)) nd.kids.set(c, { kids: new Map(), word: null });
        nd = nd.kids.get(c)!;
      }
      nd.word = w;
    }
    const m = board.length,
      n = board[0].length;
    const res: string[] = [];
    const path: [number, number][] = [];
    let prefix = "";
    t.step("build", `Insert ${words.length} words into a trie.`, () => boardView(board, [], res, { words: words.join(", ") }));
    const dfs = (r: number, c: number, node: Trie) => {
      if (r < 0 || c < 0 || r >= m || c >= n) return;
      const ch = board[r][c];
      const next = ch !== "#" ? node.kids.get(ch) : undefined;
      if (!next) return;
      path.push([r, c]);
      prefix += ch;
      t.step("visit", `"${prefix}" is a prefix of some word.`, () => boardView(board, path, res, { prefix }));
      if (next.word) {
        res.push(next.word);
        t.step("found", `"${next.word}" is complete. Record it and clear the flag.`, () => boardView(board, path, res, { prefix }, "success"));
        next.word = null;
      }
      board[r][c] = "#";
      for (const [dr, dc] of DIRS) dfs(r + dr, c + dc, next);
      board[r][c] = ch;
      path.pop();
      prefix = prefix.slice(0, -1);
    };
    for (let r = 0; r < m; r++)
      for (let c = 0; c < n; c++) {
        if (!root.kids.has(board[r][c])) {
          t.step("prune", `No word starts with '${board[r][c]}'.`, () => boardView(board, [[r, c]], res, {}, "muted"));
          continue;
        }
        t.step("start", `Start at (${r}, ${c}).`, () => boardView(board, [[r, c]], res, {}));
        dfs(r, c, root);
      }
    t.step("ret", `Return [${res}].`, () => boardView(board, [], res, {}));
    return res;
  },
});

export default defineProblem<Input>({
  description: "Given an m×n board of letters and a list of words, return every word that can be formed from sequentially adjacent (horizontal or vertical) cells, using each cell at most once per word.",
  input: {
    default: 'board = [["o","a","a","n"],["e","t","a","e"],["i","h","k","r"],["i","f","l","v"]], words = ["oath","pea","eat","rain"]',
    parse: (a) => ({ board: a.matrix<string>("board"), words: a.strs("words") }),
  },
  examples: [
    { input: 'board = [["o","a","a","n"],["e","t","a","e"],["i","h","k","r"],["i","f","l","v"]], words = ["oath","pea","eat","rain"]', output: ["eat", "oath"] },
    { input: 'board = [["a","b"],["c","d"]], words = ["abcb"]', output: [] },
    { input: 'board = [["a","b"],["c","d"]], words = ["ab","abdc","ad"]', output: ["ab", "abdc"] },
  ],
  normalize: (v) => [...(v as string[])].sort(),
  solutions: [perWord, trieDfs],
});

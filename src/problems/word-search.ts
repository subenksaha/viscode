import { arr, grid, rc, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution, type Tracer } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  board: string[][];
  word: string;
}

function search(board: string[][], word: string, t: Tracer) {
  const m = board.length,
    n = board[0].length;
  const path: [number, number][] = [];
  const view = (cur?: [number, number], bad = false) => {
    const tn: Record<string, Tone> = {};
    path.forEach(([r, c]) => (tn[rc(r, c)] = "success"));
    if (cur) tn[rc(...cur)] = bad ? "danger" : "active";
    return [grid("board", board, { tones: tn }), arr("word", [...word], { tones: tones(...[...word].map((_, i) => [i < path.length ? i : null, "success"] as [number | null, "success"])) })];
  };
  const dfs = (r: number, c: number, k: number): boolean => {
    if (k === word.length) {
      t.step("found", "Every letter matched.", () => view());
      return true;
    }
    if (r < 0 || c < 0 || r >= m || c >= n || board[r][c] !== word[k]) {
      if (r >= 0 && c >= 0 && r < m && c < n) t.step("miss", `(${r}, ${c}) is '${board[r][c]}', need '${word[k]}'.`, () => view([r, c], true));
      return false;
    }
    path.push([r, c]);
    const ch = board[r][c];
    board[r][c] = "#";
    t.step("mark", `Match '${ch}' at (${r}, ${c}). Mark it used.`, () => view([r, c]));
    const ok = dfs(r + 1, c, k + 1) || dfs(r - 1, c, k + 1) || dfs(r, c + 1, k + 1) || dfs(r, c - 1, k + 1);
    board[r][c] = ch;
    if (!ok) {
      path.pop();
      t.step("undo", `Dead end from (${r}, ${c}). Backtrack.`, () => view([r, c]));
    }
    return ok;
  };
  for (let r = 0; r < m; r++)
    for (let c = 0; c < n; c++) {
      t.step("start", `Try starting at (${r}, ${c}).`, () => view([r, c]));
      if (dfs(r, c, 0)) return true;
    }
  t.step("ret", "No starting cell works. Return false.", () => view());
  return false;
}

const backtracking = defineSolution<Input>({
  id: "backtracking",
  name: "Backtracking DFS",
  time: "O(m·n·3ᴸ)",
  space: "O(L)",
  idea: "From each cell, DFS in four directions matching one letter at a time. Temporarily mark cells on the current path so they are not reused, and restore them on the way back.",
  code: code(`
    function exist(board: string[][], word: string): boolean {
      const rows = board.length;
      const cols = board[0].length;
      // Can we spell word[index..] starting at (row, col)?
      function spell(row: number, col: number, index: number): boolean {
        if (index === word.length) return true; //@found
        const outside = row < 0 || col < 0 || row >= rows || col >= cols;
        if (outside || board[row][col] !== word[index]) return false; //@miss
        const letter = board[row][col];
        board[row][col] = "#"; // mark as used on this path //@mark
        const found =
          spell(row + 1, col, index + 1) ||
          spell(row - 1, col, index + 1) ||
          spell(row, col + 1, index + 1) ||
          spell(row, col - 1, index + 1);
        board[row][col] = letter; // restore //@undo
        return found;
      }
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (spell(row, col, 0)) return true; //@start
        }
      }
      return false; //@ret
    }
  `),
  run: ({ board, word }, t) => search(board, word, t),
});

const pruned = defineSolution<Input>({
  id: "pruned",
  name: "Backtracking + Pruning",
  time: "O(m·n·3ᴸ)",
  space: "O(L)",
  idea: "Two cheap checks first: if the board lacks enough of some letter, fail immediately. If the word's last letter is rarer than its first, search for the reversed word, which cuts off more branches early.",
  code: code(`
    function exist(board: string[][], word: string): boolean {
      // Quick checks before the expensive search.
      const onBoard = new Map<string, number>();
      for (const line of board) {
        for (const letter of line) onBoard.set(letter, (onBoard.get(letter) ?? 0) + 1);
      }
      const needed = new Map<string, number>();
      for (const letter of word) { //@count
        needed.set(letter, (needed.get(letter) ?? 0) + 1);
        if (needed.get(letter)! > (onBoard.get(letter) ?? 0)) return false; // not enough on the board //@prune
      }
      // Start from the rarer end of the word: fewer starting cells to try.
      const countOf = (letter: string) => onBoard.get(letter) ?? 0;
      if (countOf(word[0]) > countOf(word[word.length - 1])) { //@reverse
        word = word.split("").reverse().join("");
      }
      // Then the same backtracking search as before.
      const rows = board.length;
      const cols = board[0].length;
      // Can we spell word[index..] starting at (row, col)?
      function spell(row: number, col: number, index: number): boolean {
        if (index === word.length) return true; //@found
        const outside = row < 0 || col < 0 || row >= rows || col >= cols;
        if (outside || board[row][col] !== word[index]) return false; //@miss
        const letter = board[row][col];
        board[row][col] = "#"; // mark as used on this path //@mark
        const found =
          spell(row + 1, col, index + 1) ||
          spell(row - 1, col, index + 1) ||
          spell(row, col + 1, index + 1) ||
          spell(row, col - 1, index + 1);
        board[row][col] = letter; // restore //@undo
        return found;
      }
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (spell(row, col, 0)) return true; //@start
        }
      }
      return false; //@ret
    }
  `),
  run({ board, word }, t) {
    const count = new Map<string, number>();
    for (const row of board) for (const ch of row) count.set(ch, (count.get(ch) ?? 0) + 1);
    const totals = new Map(count);
    t.step("count", "Count the letters on the board.", [vars(Object.fromEntries(totals)), arr("word", [...word])]);
    for (const ch of word) {
      if (!count.get(ch)) {
        t.step("prune", `The board does not have enough '${ch}'. Return false without searching.`, [vars(Object.fromEntries(count)), arr("word", [...word])]);
        return false;
      }
      count.set(ch, count.get(ch)! - 1);
    }
    const first = totals.get(word[0]) ?? 0,
      last = totals.get(word[word.length - 1]) ?? 0;
    if (first > last) {
      word = [...word].reverse().join("");
      t.step("reverse", `'${word.at(-1)}' appears ${first}× but '${word[0]}' only ${last}×. Search for "${word}" instead.`, [arr("word", [...word])]);
    } else t.step("reverse", "Keep the original direction.", [arr("word", [...word])]);
    return search(board, word, t);
  },
});

export default defineProblem<Input>({
  description: "Return true if word can be traced on the grid through horizontally or vertically adjacent cells, using each cell at most once.",
  input: {
    default: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"',
    parse: (a) => ({ board: a.matrix<string>("board"), word: a.str("word") }),
  },
  examples: [
    { input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"', output: true },
    { input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "SEE"', output: true },
    { input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCB"', output: false },
  ],
  solutions: [backtracking, pruned],
});

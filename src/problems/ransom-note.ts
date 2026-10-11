import { arr, map, range, tones } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  ransomNote: string;
  magazine: string;
}

const removeEach = defineSolution<Input>({
  id: "remove-each",
  name: "Search and Remove",
  time: "O(m·n)",
  space: "O(n)",
  idea: "For each letter of the note, find an unused copy in the magazine and cross it out. If one is missing, the note can't be built.",
  approach: [
    {
      title: "Copy the magazine",
      detail: "Letters are crossed out as they are used.",
      at: "init",
    },
    {
      title: "Find a copy",
      detail: "Search for an unused instance of the note's letter.",
      at: "find",
    },
    {
      title: "Cross it out",
      detail: "Each magazine letter can be used once.",
      at: "use",
    },
    {
      title: "All found",
      detail: "If a letter can't be found, return false. Scanning per letter makes this O(m·n).",
      at: "ret",
    },
  ],
  code: code(`
    function canConstruct(ransomNote: string, magazine: string): boolean {
      const letters = magazine.split(""); //@init
      for (const letter of ransomNote) { //@loop
        const position = letters.indexOf(letter); //@find
        if (position === -1) return false; //@missing
        letters[position] = ""; // used up //@use
      }
      return true; //@ret
    }
  `),
  run({ ransomNote, magazine }, t) {
    const mag = [...magazine];
    const used = new Set<number>();
    const view = (i?: number, k?: number, tone: Tone = "active") => [
      arr("ransomNote", [...ransomNote], { tones: tones(...range(0, (i ?? 0) - 1, "success"), [i, tone]) }),
      arr("magazine", [...magazine], { tones: tones(...[...used].map((u) => [u, "muted"] as [number, Tone]), [k, "success"]) }),
    ];
    t.step("init", "Copy the magazine letters.", view());
    for (let i = 0; i < ransomNote.length; i++) {
      const c = ransomNote[i];
      const k = mag.indexOf(c);
      if (k < 0) {
        t.step("missing", `No unused '${c}' left. Return false.`, view(i, undefined, "danger"));
        return false;
      }
      t.step("find", `Found '${c}' at magazine[${k}].`, view(i, k));
      mag[k] = "";
      used.add(k);
      t.step("use", "Cross it out.", view(i));
    }
    t.step("ret", "Every letter found. Return true.", view(ransomNote.length));
    return true;
  },
});

const counting = defineSolution<Input>({
  id: "count",
  name: "Letter Counts",
  time: "O(m + n)",
  space: "O(1)",
  idea: "Count the magazine's letters once, then spend one count per note letter. A count going below zero means we ran out.",
  approach: [
    {
      title: "Count the magazine",
      detail: "One pass builds a supply count per letter.",
      at: "count",
    },
    {
      title: "Spend per note letter",
      detail: "Decrement the count. Going below zero means the supply ran out.",
      at: "spend",
    },
    {
      title: "Enough of everything",
      detail: "O(m + n) time, at most 26 counters.",
      at: "ret",
    },
  ],
  code: code(`
    function canConstruct(ransomNote: string, magazine: string): boolean {
      const count = new Map<string, number>();
      for (const letter of magazine) count.set(letter, (count.get(letter) ?? 0) + 1); //@count
      for (const letter of ransomNote) { //@loop
        const remaining = (count.get(letter) ?? 0) - 1; //@spend
        if (remaining < 0) return false; //@missing
        count.set(letter, remaining);
      }
      return true; //@ret
    }
  `),
  run({ ransomNote, magazine }, t) {
    const count = new Map<string, number>();
    const view = (i: number | undefined, key?: string, tone: Tone = "active") => [
      arr("ransomNote", [...ransomNote], { tones: tones(...range(0, (i ?? 0) - 1, "success"), [i, tone]) }),
      map("magazine counts", [...count].sort(), tones([key, tone])),
    ];
    for (let k = 0; k < magazine.length; k++) {
      const c = magazine[k];
      count.set(c, (count.get(c) ?? 0) + 1);
    }
    t.step("count", `Count the ${magazine.length} magazine letters.`, view(undefined));
    for (let i = 0; i < ransomNote.length; i++) {
      const c = ransomNote[i];
      const left = (count.get(c) ?? 0) - 1;
      if (left < 0) {
        t.step("missing", `No '${c}' left. Return false.`, view(i, c, "danger"));
        return false;
      }
      count.set(c, left);
      t.step("spend", `Use one '${c}'; ${left} left.`, view(i, c));
    }
    t.step("ret", "Every letter covered. Return true.", view(ransomNote.length));
    return true;
  },
});

export default defineProblem<Input>({
  description: "Return true if ransomNote can be built from the letters of magazine, using each magazine letter at most once.",
  input: { default: 'ransomNote = "aab", magazine = "baca"', parse: (a) => ({ ransomNote: a.str("ransomNote"), magazine: a.str("magazine") }) },
  examples: [
    { input: 'ransomNote = "a", magazine = "b"', output: false },
    { input: 'ransomNote = "aa", magazine = "ab"', output: false },
    { input: 'ransomNote = "aa", magazine = "aab"', output: true },
  ],
  solutions: [removeEach, counting],
});

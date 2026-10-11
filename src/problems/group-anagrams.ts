import { arr, map, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  strs: string[];
}

const sortedKey = defineSolution<Input>({
  id: "sorted-key",
  name: "Sorted String as Key",
  time: "O(n · k log k)",
  space: "O(n · k)",
  idea: "All anagrams sort to the same string. Use it as a hash-map key and collect the words.",
  code: code(`
    function groupAnagrams(strs: string[]): string[][] {
      const groups = new Map<string, string[]>(); //@init
      for (const word of strs) { //@loop
        const key = word.split("").sort().join(""); // anagrams share the same sorted letters //@key
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(word); //@add
      }
      return [...groups.values()]; //@ret
    }
  `),
  run({ strs }, t) {
    const groups = new Map<string, string[]>();
    const view = (i?: number, key?: string) => [vars({ key }), arr("strs", strs, { tones: tones([i, "active"]) }), map("groups", [...groups].map(([k, v]) => [k, v.join(", ")]), tones([key, "success"]))];
    t.step("init", "Empty map.", view());
    strs.forEach((w, i) => {
      t.step("loop", `Word "${w}".`, view(i));
      const key = [...w].sort().join("");
      t.step("key", `Sorted: "${key}".`, view(i, key));
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(w);
      t.step("add", `Add "${w}" to group "${key}".`, view(i, key));
    });
    t.step("ret", `${groups.size} group(s).`, view());
    return [...groups.values()];
  },
});

const countKey = defineSolution<Input>({
  id: "count-key",
  name: "Letter Counts as Key",
  time: "O(n · k)",
  space: "O(n · k)",
  idea: "Anagrams also share the same 26 letter counts. Encoding the counts as a key avoids sorting each word.",
  code: code(`
    function groupAnagrams(strs: string[]): string[][] {
      const groups = new Map<string, string[]>(); //@init
      for (const word of strs) { //@loop
        const letterCounts = new Array(26).fill(0);
        for (const letter of word) {
          const position = letter.charCodeAt(0) - "a".charCodeAt(0);
          letterCounts[position]++;
        }
        const key = letterCounts.join("#"); // anagrams have the same letter counts //@key
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(word); //@add
      }
      return [...groups.values()]; //@ret
    }
  `),
  run({ strs }, t) {
    const groups = new Map<string, string[]>();
    // Show keys compactly as letter counts, e.g. a1e1t1.
    const pretty = (w: string) => {
      const cnt = new Array(26).fill(0);
      for (const ch of w) cnt[ch.charCodeAt(0) - 97]++;
      return cnt.map((c, i) => (c ? String.fromCharCode(97 + i) + c : "")).join("") || "∅";
    };
    const view = (i?: number, key?: string) => [vars({ key }), arr("strs", strs, { tones: tones([i, "active"]) }), map("groups (key = letter counts)", [...groups].map(([k, v]) => [k, v.join(", ")]), tones([key, "success"]))];
    t.step("init", "Empty map.", view());
    strs.forEach((w, i) => {
      t.step("loop", `Word "${w}".`, view(i));
      const key = pretty(w);
      t.step("key", `Count its letters: ${key}.`, view(i, key));
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(w);
      t.step("add", `Add "${w}".`, view(i, key));
    });
    t.step("ret", `${groups.size} group(s).`, view());
    return [...groups.values()];
  },
});

export default defineProblem<Input>({
  description: "Group the strings that are anagrams of each other. The groups may be returned in any order.",
  input: { default: 'strs = ["eat","tea","tan","ate","nat","bat"]', parse: (a) => ({ strs: a.strs("strs") }) },
  examples: [
    { input: 'strs = ["eat","tea","tan","ate","nat","bat"]', output: [["bat"], ["nat", "tan"], ["ate", "eat", "tea"]] },
    { input: 'strs = [""]', output: [[""]] },
    { input: 'strs = ["a"]', output: [["a"]] },
  ],
  normalize: (v) =>
    (v as string[][]).map((g) => [...g].sort()).sort((a, b) => a.join().localeCompare(b.join())),
  solutions: [sortedKey, countKey],
});

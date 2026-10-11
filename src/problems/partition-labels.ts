import { arr, intervals, map, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  s: string;
}

const mergeIntervals = defineSolution<Input>({
  id: "merge-intervals",
  name: "Letter Intervals + Merge",
  time: "O(n)",
  space: "O(26)",
  idea: "Each letter spans [first, last] occurrence. Pieces must contain whole spans, so merge overlapping spans; each merged block is one piece.",
  code: code(`
    function partitionLabels(s: string): number[] {
      // span[letter] = [first index, last index] of that letter
      const span = new Map<string, [number, number]>();
      for (let i = 0; i < s.length; i++) { //@spans
        const letter = s[i];
        if (!span.has(letter)) span.set(letter, [i, i]);
        else span.get(letter)![1] = i;
      }
      const sizes: number[] = [];
      let partStart = 0;
      let partEnd = -1;
      for (const [first, last] of span.values()) { // in order of first appearance
        // This letter starts after the current part ends, so the part is finished.
        if (partEnd >= 0 && first > partEnd) { //@cut
          sizes.push(partEnd - partStart + 1);
          partStart = first;
        }
        partEnd = Math.max(partEnd, last); //@extend
      }
      sizes.push(partEnd - partStart + 1);
      return sizes; //@ret
    }
  `),
  run({ s }, t) {
    const span = new Map<string, [number, number]>();
    [...s].forEach((c, i) => span.set(c, [span.get(c)?.[0] ?? i, i]));
    const spans = [...span.values()];
    const letters = [...span.keys()];
    const res: number[] = [];
    let lo = 0,
      hi = -1;
    const view = (k?: number) => [
      vars({ partStart: lo, partEnd: hi < 0 ? undefined : hi }),
      intervals("letter spans (first → last)", spans, tones(...spans.map((sp, i) => [i, sp[0] < lo ? "muted" : i === k ? "active" : sp[0] <= hi ? "window" : "muted"] as [number, Tone]))),
      arr("letters", letters, { tones: tones([k, "active"]), indexLabels: false }),
      arr("pieces", res, { indexLabels: false }),
    ];
    t.step("spans", "Record where each letter first and last appears.", view());
    spans.forEach(([a, b], k) => {
      if (a > hi && hi >= 0) {
        res.push(hi - lo + 1);
        t.step("cut", `'${letters[k]}' starts after ${hi}: close a piece of size ${hi - lo + 1}.`, view(k));
        lo = a;
      }
      hi = Math.max(hi, b);
      t.step("extend", `'${letters[k]}' spans [${a}, ${b}]. Piece now ends at ${hi}.`, view(k));
    });
    res.push(hi - lo + 1);
    t.step("ret", `Pieces: [${res}].`, view());
    return res;
  },
});

const lastIndex = defineSolution<Input>({
  id: "last-index",
  name: "Last Occurrence + Greedy Scan",
  time: "O(n)",
  space: "O(26)",
  idea: "Record each letter's last index. Scan left to right, stretching the current piece's end to the last index of every letter seen; when i reaches that end, cut.",
  code: code(`
    function partitionLabels(s: string): number[] {
      const lastIndex = new Map<string, number>();
      for (let i = 0; i < s.length; i++) lastIndex.set(s[i], i); //@last
      const sizes: number[] = [];
      let start = 0;
      let end = 0; // the current part must reach at least this far
      for (let i = 0; i < s.length; i++) {
        end = Math.max(end, lastIndex.get(s[i])!); //@stretch
        if (i === end) { //@cut
          sizes.push(end - start + 1);
          start = i + 1;
        }
      }
      return sizes; //@ret
    }
  `),
  run({ s }, t) {
    const last = new Map<string, number>();
    [...s].forEach((c, i) => last.set(c, i));
    const res: number[] = [];
    let start = 0,
      end = 0;
    const done: number[] = [];
    const view = (i?: number, cut = false) => [
      vars({ start, end }),
      arr("s", [...s], { window: i !== undefined ? [start, end] : null, tones: tones(...done.map((d) => [d, "muted"] as [number, Tone]), [i, cut ? "success" : "active"], [i !== undefined ? end : null, "compare"]), pointers: { i, end: i !== undefined ? end : null } }),
      map("last index", last, i !== undefined ? tones([s[i], "active"]) : {}),
      arr("pieces", res, { indexLabels: false }),
    ];
    t.step("last", "Record each letter's last index.", view());
    for (let i = 0; i < s.length; i++) {
      end = Math.max(end, last.get(s[i])!);
      if (i === end) {
        res.push(end - start + 1);
        t.step("cut", `i reached end ${end}: cut a piece of size ${end - start + 1}.`, view(i, true));
        for (let k = start; k <= end; k++) done.push(k);
        start = i + 1;
      } else t.step("stretch", `'${s[i]}' last appears at ${last.get(s[i])}. end = ${end}.`, view(i));
    }
    t.step("ret", `Pieces: [${res}].`, view());
    return res;
  },
});

export default defineProblem<Input>({
  description: "Partition s into as many pieces as possible so that each letter appears in at most one piece. Return the sizes of the pieces, in order.",
  input: { default: 's = "ababcbacadefegdehijhklij"', parse: (a) => ({ s: a.str("s") }) },
  examples: [
    { input: 's = "ababcbacadefegdehijhklij"', output: [9, 7, 8] },
    { input: 's = "eccbbbbdec"', output: [10] },
    { input: 's = "abc"', output: [1, 1, 1] },
  ],
  solutions: [mergeIntervals, lastIndex],
});

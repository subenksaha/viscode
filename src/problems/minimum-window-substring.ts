import { arr, map, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  s: string;
  t: string;
}

const covers = (window: Map<string, number>, need: Map<string, number>) =>
  [...need].every(([ch, n]) => (window.get(ch) ?? 0) >= n);

const bruteForce = defineSolution<Input>({
  id: "brute-force",
  name: "Brute Force",
  time: "O(n² · |t|)",
  space: "O(|t|)",
  idea: "For every start, extend the end until the window contains all of t, then record it if it is the shortest so far.",
  code: code(`
    function minWindow(s: string, t: string): string {
      const need = new Map<string, number>();
      for (const char of t) need.set(char, (need.get(char) ?? 0) + 1); //@need
      let best = "";
      for (let i = 0; i < s.length; i++) { //@i
        const window = new Map<string, number>();
        for (let j = i; j < s.length; j++) { //@j
          window.set(s[j], (window.get(s[j]) ?? 0) + 1);
          let coversT = true;
          for (const [char, count] of need) {
            if ((window.get(char) ?? 0) < count) coversT = false;
          }
          if (coversT) { //@covers
            const isShorter = best === "" || j - i + 1 < best.length;
            if (isShorter) best = s.slice(i, j + 1); //@best
            break;
          }
        }
      }
      return best; //@ret
    }
  `),
  run({ s, t: target }, t) {
    const need = new Map<string, number>();
    for (const ch of target) need.set(ch, (need.get(ch) ?? 0) + 1);
    let best = "";
    const chars = [...s];
    t.step("need", `Count what t needs.`, [map("need", need), arr("s", chars)]);
    for (let i = 0; i < s.length; i++) {
      const win = new Map<string, number>();
      t.step("i", `Start at ${i}.`, () => [vars({ best: `"${best}"` }), arr("s", chars, { pointers: { i } })]);
      for (let j = i; j < s.length; j++) {
        win.set(s[j], (win.get(s[j]) ?? 0) + 1);
        if (covers(win, need)) {
          const better = !best || j - i + 1 < best.length;
          if (better) best = s.slice(i, j + 1);
          t.step("best", `"${s.slice(i, j + 1)}" covers t${better ? ": new best" : ""}.`, () => [vars({ best: `"${best}"` }), arr("s", chars, { window: [i, j], pointers: { i, j } })]);
          break;
        }
        t.step("j", `"${s.slice(i, j + 1)}" does not cover t yet.`, () => [vars({ best: `"${best}"` }), arr("s", chars, { window: [i, j], pointers: { i, j } }), map("window", win)]);
      }
    }
    t.step("ret", `Return "${best}".`, [vars({ best: `"${best}"` })]);
    return best;
  },
});

const slidingWindow = defineSolution<Input>({
  id: "sliding-window",
  name: "Sliding Window with Counts",
  time: "O(|s| + |t|)",
  space: "O(|t|)",
  idea: "Expand right until the window covers t (tracked by a count of satisfied letters). Then shrink from the left as long as it still covers t, recording the smallest window.",
  code: code(`
    function minWindow(s: string, t: string): string {
      const need = new Map<string, number>();
      for (const char of t) need.set(char, (need.get(char) ?? 0) + 1); //@need
      let have = 0; // letters of t whose count the window fully covers
      let left = 0;
      let bestStart = 0;
      let bestLength = Infinity;
      const window = new Map<string, number>();
      for (let right = 0; right < s.length; right++) { //@hi
        const char = s[right];
        window.set(char, (window.get(char) ?? 0) + 1);
        if (window.get(char) === need.get(char)) have++; //@have
        // While the window covers t, record it and try to shrink from the left.
        while (have === need.size) { //@valid
          const length = right - left + 1;
          if (length < bestLength) { //@best
            bestLength = length;
            bestStart = left;
          }
          const removed = s[left];
          left++;
          window.set(removed, window.get(removed)! - 1);
          if (need.has(removed) && window.get(removed)! < need.get(removed)!) have--; //@shrink
        }
      }
      return bestLength === Infinity ? "" : s.slice(bestStart, bestStart + bestLength); //@ret
    }
  `),
  run({ s, t: target }, t) {
    const need = new Map<string, number>();
    for (const ch of target) need.set(ch, (need.get(ch) ?? 0) + 1);
    let have = 0,
      lo = 0,
      bestLo = 0,
      bestLen = Infinity;
    const win = new Map<string, number>();
    const chars = [...s];
    const view = (hi: number) => [
      vars({ have, required: need.size, best: bestLen === Infinity ? '""' : `"${s.slice(bestLo, bestLo + bestLen)}"` }),
      arr("s", chars, { window: lo <= hi ? [lo, hi] : null, tones: tones(...chars.map((ch, i) => [need.has(ch) ? i : null, "compare"] as [number | null, "compare"]), [hi, "active"]), pointers: { left: lo, right: hi } }),
      map("window counts / need", [...need].map(([ch, n]) => [ch, `${win.get(ch) ?? 0} / ${n}`]), tones(...[...need].map(([ch, n]) => [(win.get(ch) ?? 0) >= n ? ch : null, "success"] as [string | null, "success"]))),
    ];
    t.step("need", `t needs ${need.size} distinct letter(s).`, [map("need", need), arr("s", chars)]);
    for (let hi = 0; hi < s.length; hi++) {
      const c = s[hi];
      win.set(c, (win.get(c) ?? 0) + 1);
      t.step("hi", `Bring in '${c}'.`, () => view(hi));
      if (win.get(c) === need.get(c)) {
        have++;
        t.step("have", `'${c}' is now fully covered. have = ${have}.`, () => view(hi));
      }
      while (have === need.size) {
        t.step("valid", `Window "${s.slice(lo, hi + 1)}" covers t.`, () => view(hi));
        if (hi - lo + 1 < bestLen) {
          bestLen = hi - lo + 1;
          bestLo = lo;
          t.step("best", `New best: "${s.slice(lo, hi + 1)}".`, () => view(hi));
        }
        const d = s[lo++];
        win.set(d, win.get(d)! - 1);
        if (need.has(d) && win.get(d)! < need.get(d)!) {
          have--;
          t.step("shrink", `Dropping '${d}' breaks coverage. have = ${have}.`, () => view(hi));
        } else t.step("shrink", `Drop '${d}'. Still covered, so keep shrinking.`, () => view(hi));
      }
    }
    const res = bestLen === Infinity ? "" : s.slice(bestLo, bestLo + bestLen);
    t.step("ret", `Return "${res}".`, [vars({ answer: `"${res}"` })]);
    return res;
  },
});

export default defineProblem<Input>({
  description: "Return the shortest substring of s that contains every character of t (with multiplicity), or \"\" if there is none.",
  input: { default: 's = "ADOBECODEBANC", t = "ABC"', parse: (a) => ({ s: a.str("s"), t: a.str("t") }) },
  examples: [
    { input: 's = "ADOBECODEBANC", t = "ABC"', output: "BANC" },
    { input: 's = "a", t = "a"', output: "a" },
    { input: 's = "a", t = "aa"', output: "" },
  ],
  solutions: [bruteForce, slidingWindow],
});

import { arr, map, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  hand: number[];
  groupSize: number;
}

const sortedCounts = defineSolution<Input>({
  id: "sorted-counts",
  name: "Counts + Smallest-first",
  time: "O(n log n + n·k)",
  space: "O(n)",
  idea: "The smallest card left must start a group. Count the cards, walk the distinct values in increasing order, and for each value still in hand, consume that many runs of k consecutive cards.",
  code: code(`
    function isNStraightHand(hand: number[], k: number): boolean {
      if (hand.length % k) return false;
      const count = new Map<number, number>();
      for (const x of hand) count.set(x, (count.get(x) ?? 0) + 1); //@count
      for (const x of [...count.keys()].sort((a, b) => a - b)) { //@start
        const need = count.get(x)!;
        if (!need) continue;
        for (let v = x; v < x + k; v++) { //@take
          if ((count.get(v) ?? 0) < need) return false; //@fail
          count.set(v, count.get(v)! - need);
        }
      }
      return true; //@ret
    }
  `),
  run({ hand, groupSize: k }, t) {
    if (hand.length % k) {
      t.step("fail", `${hand.length} cards can't split into groups of ${k}.`);
      return false;
    }
    const count = new Map<number, number>();
    for (const x of hand) count.set(x, (count.get(x) ?? 0) + 1);
    const keys = [...count.keys()].sort((a, b) => a - b);
    const view = (hi: number[] = [], bad?: number) => [
      vars({ k }),
      map("count", keys.map((x) => [x, count.get(x)!] as [number, number]), tones(...hi.map((h) => [String(h), "active"] as [string, "active"]), [bad !== undefined ? String(bad) : null, "danger"])),
    ];
    t.step("count", "Count each card value.", view());
    for (const x of keys) {
      const need = count.get(x)!;
      if (!need) continue;
      t.step("start", `${need} group${need > 1 ? "s" : ""} must start at ${x}.`, view([x]));
      for (let v = x; v < x + k; v++) {
        if ((count.get(v) ?? 0) < need) {
          t.step("fail", `Need ${need} × ${v} but only have ${count.get(v) ?? 0}.`, view([], v));
          return false;
        }
        count.set(v, count.get(v)! - need);
      }
      t.step("take", `Use ${need} × [${x}..${x + k - 1}].`, view(Array.from({ length: k }, (_, i) => x + i)));
    }
    t.step("ret", "Every card was placed.", view());
    return true;
  },
});

const sortGreedy = defineSolution<Input>({
  id: "sort-greedy",
  name: "Sort + Build Groups One by One",
  time: "O(n log n + n·k)",
  space: "O(n)",
  idea: "Sort the hand. Repeatedly take the smallest unused card and pull the next k − 1 consecutive values out of the remaining cards; fail if one is missing.",
  code: code(`
    function isNStraightHand(hand: number[], k: number): boolean {
      if (hand.length % k) return false;
      hand.sort((a, b) => a - b); //@sort
      const used = new Array(hand.length).fill(false);
      for (let i = 0; i < hand.length; i++) {
        if (used[i]) continue;
        let want = hand[i], j = i; //@group
        for (let got = 0; got < k; got++, want++) {
          while (j < hand.length && (used[j] || hand[j] < want)) j++;
          if (j === hand.length || hand[j] !== want) return false; //@fail
          used[j] = true; //@use
        }
      }
      return true; //@ret
    }
  `),
  run({ hand, groupSize: k }, t) {
    if (hand.length % k) {
      t.step("fail", `${hand.length} cards can't split into groups of ${k}.`);
      return false;
    }
    hand.sort((a, b) => a - b);
    const group = new Array(hand.length).fill(0);
    let g = 0;
    const palette = ["success", "compare", "visited", "window"] as const;
    const view = (j?: number, bad = false) => [
      vars({ group: g }),
      arr("hand (sorted)", hand, { tones: tones(...group.map((x, i) => [x ? i : null, palette[(x - 1) % palette.length]] as [number | null, (typeof palette)[number]]), [j, bad ? "danger" : "active"]), pointers: { j } }),
    ];
    t.step("sort", "Sort the hand.", view());
    for (let i = 0; i < hand.length; i++) {
      if (group[i]) continue;
      g++;
      let want = hand[i],
        j = i;
      t.step("group", `Group ${g} starts at ${want}.`, view(i));
      for (let got = 0; got < k; got++, want++) {
        while (j < hand.length && (group[j] || hand[j] < want)) j++;
        if (j === hand.length || hand[j] !== want) {
          t.step("fail", `No unused ${want} to continue the run.`, view(j < hand.length ? j : undefined, true));
          return false;
        }
        group[j] = g;
        t.step("use", `Use ${want}.`, view(j));
      }
    }
    t.step("ret", `All cards form ${g} straights.`, view());
    return true;
  },
});

export default defineProblem<Input>({
  description: "Alice wants to rearrange her cards into groups of groupSize consecutive values. Return true if every card can be placed in such a group.",
  input: { default: "hand = [1,2,3,6,2,3,4,7,8], groupSize = 3", parse: (a) => ({ hand: a.ints("hand"), groupSize: a.int("groupSize") }) },
  examples: [
    { input: "hand = [1,2,3,6,2,3,4,7,8], groupSize = 3", output: true },
    { input: "hand = [1,2,3,4,5], groupSize = 4", output: false },
    { input: "hand = [1,1,2,2,3,3], groupSize = 3", output: true },
  ],
  solutions: [sortedCounts, sortGreedy],
});

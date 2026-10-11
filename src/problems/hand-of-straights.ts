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
  approach: [
    {
      title: "Count cards",
      detail: "The smallest remaining card can only be the start of a group.",
      at: "count",
    },
    {
      title: "Start groups at the smallest card",
      detail: "Start as many groups there as there are copies.",
      at: "start",
    },
    {
      title: "Consume runs",
      detail: "Each of the next k values must have at least that many copies.",
      at: "take",
    },
    {
      title: "All placed",
      detail: "O(n log n + n·k).",
      at: "ret",
    },
  ],
  code: code(`
    function isNStraightHand(hand: number[], k: number): boolean {
      if (hand.length % k !== 0) return false;
      const count = new Map<number, number>();
      for (const card of hand) { //@count
        count.set(card, (count.get(card) ?? 0) + 1);
      }
      const distinctCards = [...count.keys()].sort((a, b) => a - b);
      for (const card of distinctCards) { //@start
        // The smallest card left must start a group, so start that many groups here.
        const groupsToStart = count.get(card)!;
        if (groupsToStart === 0) continue;
        for (let value = card; value < card + k; value++) { //@take
          const available = count.get(value) ?? 0;
          if (available < groupsToStart) return false; //@fail
          count.set(value, available - groupsToStart);
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
  approach: [
    {
      title: "Sort",
      detail: "Process cards in ascending order.",
      at: "sort",
    },
    {
      title: "Start a group",
      detail: "The smallest unused card begins a straight.",
      at: "group",
    },
    {
      title: "Find each next value",
      detail: "Pull hand[i] + 1, + 2, … from the unused cards. Fail if one is missing.",
      at: "use",
    },
    {
      title: "Done",
      detail: "Every card is in a straight.",
      at: "ret",
    },
  ],
  code: code(`
    function isNStraightHand(hand: number[], k: number): boolean {
      if (hand.length % k !== 0) return false;
      hand.sort((a, b) => a - b); //@sort
      const used = new Array(hand.length).fill(false);
      for (let i = 0; i < hand.length; i++) {
        if (used[i]) continue;
        // Build the group hand[i], hand[i] + 1, ..., hand[i] + k - 1.
        let j = i; //@group
        for (let offset = 0; offset < k; offset++) {
          const wanted = hand[i] + offset;
          while (j < hand.length && (used[j] || hand[j] < wanted)) j++;
          if (j === hand.length || hand[j] !== wanted) return false; //@fail
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

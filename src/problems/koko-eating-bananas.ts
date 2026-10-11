import { arr, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  piles: number[];
  h: number;
}

const hoursAt = (piles: number[], k: number) => piles.reduce((s, p) => s + Math.ceil(p / k), 0);

const linear = defineSolution<Input>({
  id: "linear",
  name: "Try Every Speed",
  time: "O(n · max(piles))",
  space: "O(1)",
  idea: "Try k = 1, 2, 3, … and return the first speed that finishes all piles within h hours.",
  code: code(`
    function minEatingSpeed(piles: number[], h: number): number {
      for (let speed = 1; ; speed++) { //@try
        let hours = 0;
        for (const pile of piles) hours += Math.ceil(pile / speed); //@hours
        if (hours <= h) return speed; //@ret
      }
    }
  `),
  run({ piles, h }, t) {
    for (let k = 1; ; k++) {
      const hours = hoursAt(piles, k);
      const view = [vars({ speed: k, hours, h }), arr("hours per pile", piles.map((p) => Math.ceil(p / k)), { indexLabels: piles.map(String) })];
      if (hours <= h) {
        t.step("ret", `At k = ${k}, Koko needs ${hours} ≤ ${h} hours. Answer: ${k}.`, view);
        return k;
      }
      t.step("hours", `At k = ${k}, Koko needs ${hours} > ${h} hours. Too slow.`, view);
    }
  },
});

const binary = defineSolution<Input>({
  id: "binary-search",
  name: "Binary Search on the Answer",
  time: "O(n log max(piles))",
  space: "O(1)",
  idea: "Hours needed only go down as k goes up, so binary-search k in [1, max(piles)] for the smallest speed that fits in h hours.",
  code: code(`
    function minEatingSpeed(piles: number[], h: number): number {
      let low = 1; //@init
      let high = Math.max(...piles);
      while (low < high) {
        const speed = Math.floor((low + high) / 2);
        let hours = 0;
        for (const pile of piles) hours += Math.ceil(pile / speed); //@mid
        if (hours <= h) {
          high = speed; // fast enough; try slower //@fits
        } else {
          low = speed + 1; // too slow //@slow
        }
      }
      return low; //@ret
    }
  `),
  run({ piles, h }, t) {
    let lo = 1,
      hi = Math.max(...piles);
    const view = (k?: number, hours?: number) => [
      vars({ low: lo, high: hi, speed: k, hours, h }),
      arr("piles", piles),
      ...(k ? [arr(`hours per pile at k = ${k}`, piles.map((p) => Math.ceil(p / k)), { indexLabels: false })] : []),
    ];
    t.step("init", `Speed is between 1 and the biggest pile, ${hi}.`, view());
    while (lo < hi) {
      const k = (lo + hi) >> 1;
      const hours = hoursAt(piles, k);
      t.step("mid", `Try k = ${k}: ${hours} hours.`, view(k, hours));
      if (hours <= h) {
        hi = k;
        t.step("fits", `${hours} ≤ ${h}: k = ${k} works. Look for something smaller.`, view(k, hours));
      } else {
        lo = k + 1;
        t.step("slow", `${hours} > ${h}: too slow. Go faster.`, view(k, hours));
      }
    }
    t.step("ret", `lo = hi = ${lo}.`, view());
    return lo;
  },
});

export default defineProblem<Input>({
  description: "Koko has piles of bananas and h hours. Each hour she picks a pile and eats k bananas from it (or the whole pile if it has fewer). Return the minimum integer speed k that lets her finish every pile within h hours.",
  input: { default: "piles = [3,6,7,11], h = 8", parse: (a) => ({ piles: a.ints("piles"), h: a.int("h") }) },
  examples: [
    { input: "piles = [3,6,7,11], h = 8", output: 4 },
    { input: "piles = [30,11,23,4,20], h = 5", output: 30 },
    { input: "piles = [30,11,23,4,20], h = 6", output: 23 },
  ],
  solutions: [linear, binary],
});

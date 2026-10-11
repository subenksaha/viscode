import { arr, text, tones } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  s: string;
}

const isAlnum = (c: string) => /[a-z0-9]/i.test(c);

const cleanReverse = defineSolution<Input>({
  id: "clean-reverse",
  name: "Clean and Reverse",
  time: "O(n)",
  space: "O(n)",
  idea: "Keep only letters and digits, lowercase them, and compare the result with its reverse.",
  approach: [
    {
      title: "Normalize",
      detail: "Lowercase everything and strip anything that isn't a letter or digit. Only these characters count.",
      at: "clean",
    },
    {
      title: "Reverse",
      detail: "Build the reversed string.",
      at: "reverse",
    },
    {
      title: "Compare",
      detail: "A palindrome equals its reverse. Simple, but it uses O(n) extra space.",
      at: "ret",
    },
  ],
  code: code(`
    function isPalindrome(s: string): boolean {
      // Keep only letters and digits, all lowercase.
      const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, ""); //@clean
      const reversed = cleaned.split("").reverse().join(""); //@reverse
      return cleaned === reversed; //@ret
    }
  `),
  run({ s }, t) {
    const clean = s.toLowerCase().replace(/[^a-z0-9]/g, "");
    t.step("clean", "Drop non-alphanumerics and lowercase.", [text("input", s), text("clean", clean)]);
    const rev = [...clean].reverse().join("");
    t.step("reverse", "Reverse it.", [text("clean", clean), text("reversed", rev)]);
    t.step("ret", clean === rev ? "They match: palindrome." : "They differ: not a palindrome.", [text("clean", clean), text("reversed", rev)]);
    return clean === rev;
  },
});

const twoPointers = defineSolution<Input>({
  id: "two-pointers",
  name: "Two Pointers, In Place",
  time: "O(n)",
  space: "O(1)",
  idea: "Move left and right toward each other, skipping non-alphanumeric characters, and compare lowercase characters.",
  approach: [
    {
      title: "Pointers at both ends",
      detail: "left starts at the front and right at the back.",
      at: "init",
    },
    {
      title: "Skip characters that don't count",
      detail: "Move a pointer past punctuation and spaces without comparing.",
      at: "skipLo",
    },
    {
      title: "Compare case-insensitively",
      detail: "If the two characters differ, it is not a palindrome.",
      at: "cmp",
    },
    {
      title: "Move inward",
      detail: "Advance both pointers. Meeting in the middle means every pair matched. O(1) space.",
      at: "move",
    },
  ],
  code: code(`
    function isPalindrome(s: string): boolean {
      const isLetterOrDigit = (char: string) => /[a-z0-9]/i.test(char);
      let left = 0; //@init
      let right = s.length - 1;
      while (left < right) { //@loop
        if (!isLetterOrDigit(s[left])) { //@skipLo
          left++;
          continue;
        }
        if (!isLetterOrDigit(s[right])) { //@skipHi
          right--;
          continue;
        }
        if (s[left].toLowerCase() !== s[right].toLowerCase()) return false; //@cmp
        left++; //@move
        right--;
      }
      return true; //@ret
    }
  `),
  run({ s }, t) {
    let lo = 0,
      hi = s.length - 1;
    const chars = [...s].map((c) => (c === " " ? "␣" : c));
    const view = (bad = false) => [arr("s", chars, { tones: tones(...chars.map((c, i) => [!isAlnum(s[i]) ? i : null, "muted"] as [number | null, "muted"]), [lo, bad ? "danger" : "active"], [hi, bad ? "danger" : "compare"]), pointers: { left: lo, right: hi } })];
    t.step("init", "Pointers at both ends.", view());
    while (lo < hi) {
      if (!isAlnum(s[lo])) {
        lo++;
        t.step("skipLo", "Skip a non-alphanumeric on the left.", view());
        continue;
      }
      if (!isAlnum(s[hi])) {
        hi--;
        t.step("skipHi", "Skip a non-alphanumeric on the right.", view());
        continue;
      }
      const ok = s[lo].toLowerCase() === s[hi].toLowerCase();
      t.step("cmp", ok ? `'${s[lo]}' and '${s[hi]}' match.` : `'${s[lo]}' ≠ '${s[hi]}'. Return false.`, view(!ok));
      if (!ok) return false;
      lo++;
      hi--;
      t.step("move", "Move both pointers inward.", view());
    }
    t.step("ret", "Pointers met. Return true.", view());
    return true;
  },
});

export default defineProblem<Input>({
  description: "Ignoring case and non-alphanumeric characters, return true if s reads the same forward and backward.",
  input: { default: 's = "A man, a plan, a canal: Panama"', parse: (a) => ({ s: a.str("s") }) },
  examples: [
    { input: 's = "A man, a plan, a canal: Panama"', output: true },
    { input: 's = "race a car"', output: false },
    { input: 's = " "', output: true },
  ],
  solutions: [cleanReverse, twoPointers],
});

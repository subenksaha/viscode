import { arr, text, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";

interface Input {
  strs: string[];
}

const lengthPrefix = defineSolution<Input>({
  id: "length-prefix",
  name: "Length Prefix",
  time: "O(n)",
  space: "O(n)",
  idea: "Write each string as <length>#<string>. The decoder reads digits up to '#', then takes exactly that many characters, so any character (even '#') is safe inside a string.",
  approach: [
    {
      title: "Length prefix",
      detail: "Write each string as <length>#<string>. The content is never scanned, so any character is safe.",
      at: "encode",
      nth: 2,
    },
    {
      title: "Read the length",
      detail: "Read the digits up to the next '#'. That number says how many characters follow.",
      at: "len",
    },
    {
      title: "Take exactly that many",
      detail: "Slice the string and jump past it. A '#' inside the content is never mistaken for a delimiter.",
      at: "take",
      nth: 2,
    },
    {
      title: "Done",
      detail: "Each character is read once: O(n).",
      at: "ret",
    },
  ],
  code: code(`
    function encode(strs: string[]): string {
      // Each string becomes "<length>#<string>", e.g. "hi" -> "2#hi".
      let encoded = "";
      for (const str of strs) { //@encode
        encoded += str.length + "#" + str;
      }
      return encoded;
    }
    function decode(data: string): string[] {
      const result: string[] = [];
      let pos = 0;
      while (pos < data.length) { //@loop
        const hashIndex = data.indexOf("#", pos); //@len
        const length = Number(data.slice(pos, hashIndex));
        const start = hashIndex + 1;
        result.push(data.slice(start, start + length)); //@take
        pos = start + length;
      }
      return result; //@ret
    }
  `),
  run({ strs }, t) {
    let data = "";
    strs.forEach((s, k) => {
      data += s.length + "#" + s;
      t.step("encode", `Encode "${s}" as ${s.length}#${s}.`, [arr("strs", strs, { tones: tones([k, "active"]) }), text("encoded", data)]);
    });
    const out: string[] = [];
    const chars = [...data];
    let i = 0;
    while (i < data.length) {
      t.step("loop", `Read from position ${i}.`, [arr("encoded", chars, { indexLabels: false, pointers: { pos: i } }), arr("result", out)]);
      const hash = data.indexOf("#", i);
      const len = Number(data.slice(i, hash));
      const start = i;
      t.step("len", `Digits before '#': length ${len}.`, [vars({ length: len }), arr("encoded", chars, { indexLabels: false, window: [start, hash] }), arr("result", out)]);
      out.push(data.slice(hash + 1, hash + 1 + len));
      t.step("take", `Take the next ${len} characters: "${out.at(-1)}".`, [arr("encoded", chars, { indexLabels: false, tones: tones(...Array.from({ length: len }, (_, k) => [hash + 1 + k, "success"] as [number, "success"])) }), arr("result", out)]);
      i = hash + 1 + len;
    }
    t.step("ret", "Decoded every string.", [arr("result", out)]);
    return out;
  },
});

const escaping = defineSolution<Input>({
  id: "escaping",
  name: "Escape the Delimiter",
  time: "O(n)",
  space: "O(n)",
  idea: "Join with the separator ' # '. Inside strings, double every '#' so a lone '#' surrounded by spaces can only be a separator.",
  approach: [
    {
      title: "Escape and delimit",
      detail: "Double every '#' inside a string (\"co#de\" → \"co##de\"), then end each string with \" # \".",
      at: "encode",
      nth: 2,
    },
    {
      title: "Scan the encoding",
      detail: "Walk the encoded string one token at a time.",
      at: "loop",
    },
    {
      title: "Unescape",
      detail: "\"##\" is always a literal '#'. A real separator is \" # \" with a single '#'.",
      at: "unescape",
    },
    {
      title: "Split on separators",
      detail: "At \" # \", the current string is complete, even if it is empty.",
      at: "split",
    },
  ],
  code: code(`
    function encode(strs: string[]): string {
      // Double every "#" inside a string, then end each string with " # ".
      let encoded = "";
      for (const str of strs) { //@encode
        encoded += str.replaceAll("#", "##") + " # ";
      }
      return encoded;
    }
    function decode(data: string): string[] {
      const result: string[] = [];
      let current = "";
      let i = 0;
      while (i < data.length) { //@loop
        if (data.startsWith(" # ", i)) { //@split
          result.push(current);
          current = "";
          i += 3;
        } else if (data.startsWith("##", i)) { //@unescape
          current += "#";
          i += 2;
        } else {
          current += data[i];
          i++;
        }
      }
      return result; //@ret
    }
  `),
  run({ strs }, t) {
    let data = "";
    strs.forEach((s, k) => {
      data += s.replaceAll("#", "##") + " # ";
      t.step("encode", `Escape and append "${s}".`, [arr("strs", strs, { tones: tones([k, "active"]) }), text("encoded", data)]);
    });
    const out: string[] = [];
    let cur = "";
    for (let i = 0; i < data.length; i++) {
      if (data.startsWith(" # ", i)) {
        out.push(cur);
        t.step("split", `Separator at ${i}: finish "${cur}".`, [text("encoded", data), vars({ i, current: `"${cur}"` }), arr("result", out)]);
        cur = "";
        i += 2;
      } else if (data.startsWith("##", i)) {
        cur += "#";
        i++;
        t.step("unescape", "'##' decodes to a literal '#'.", [vars({ i, current: `"${cur}"` }), arr("result", out)]);
      } else {
        cur += data[i];
        t.step("loop", `Character '${data[i]}'.`, [vars({ i, current: `"${cur}"` }), arr("result", out)]);
      }
    }
    t.step("ret", "Decoded every string.", [arr("result", out)]);
    return out;
  },
});

export default defineProblem<Input>({
  description: "Design encode (list of strings → one string) and decode (string → original list) so that decode(encode(strs)) == strs for any strings.",
  input: { default: 'strs = ["neet","co#de","","you"]', parse: (a) => ({ strs: a.strs("strs") }) },
  examples: [
    { input: 'strs = ["neet","code","love","you"]', output: ["neet", "code", "love", "you"] },
    { input: 'strs = ["we","say",":","yes"]', output: ["we", "say", ":", "yes"] },
    { input: 'strs = ["a # b","##",""]', output: ["a # b", "##", ""] },
  ],
  solutions: [escaping, lengthPrefix],
});

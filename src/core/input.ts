/** Split on commas at bracket depth 0, outside string literals. */
function splitTopLevel(raw: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let inStr = false;
  let start = 0;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (inStr) {
      if (c === "\\") i++;
      else if (c === '"') inStr = false;
    } else if (c === '"') inStr = true;
    else if (c === "[" || c === "{") depth++;
    else if (c === "]" || c === "}") depth--;
    else if (c === "," && depth === 0) {
      parts.push(raw.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(raw.slice(start));
  return parts.map((p) => p.trim()).filter(Boolean);
}

/** Parses LeetCode-style input: `nums = [2,7,11,15], target = 9`. Values are JSON. */
export class Args {
  private readonly values: Record<string, unknown> = {};

  constructor(raw: string) {
    for (const part of splitTopLevel(raw)) {
      const eq = part.indexOf("=");
      if (eq < 0) throw new Error(`Expected "name = value", got "${part}"`);
      const name = part.slice(0, eq).trim();
      const text = part.slice(eq + 1).trim();
      try {
        this.values[name] = JSON.parse(text);
      } catch {
        throw new Error(`Could not parse value of "${name}": ${text}`);
      }
    }
  }

  get(name: string): unknown {
    if (!(name in this.values)) throw new Error(`Missing input "${name}"`);
    return this.values[name];
  }

  int(name: string): number {
    const v = this.get(name);
    if (typeof v !== "number" || !Number.isInteger(v))
      throw new Error(`"${name}" must be an integer`);
    return v;
  }

  str(name: string): string {
    const v = this.get(name);
    if (typeof v !== "string") throw new Error(`"${name}" must be a string in double quotes`);
    return v;
  }

  ints(name: string): number[] {
    const v = this.get(name);
    if (!Array.isArray(v) || v.some((x) => typeof x !== "number"))
      throw new Error(`"${name}" must be an array of numbers`);
    return v;
  }

  strs(name: string): string[] {
    const v = this.get(name);
    if (!Array.isArray(v) || v.some((x) => typeof x !== "string"))
      throw new Error(`"${name}" must be an array of strings`);
    return v;
  }

  /** Level-order array with nulls, as LeetCode encodes trees. */
  nullableInts(name: string): (number | null)[] {
    const v = this.get(name);
    if (!Array.isArray(v) || v.some((x) => x !== null && typeof x !== "number"))
      throw new Error(`"${name}" must be an array of numbers or null`);
    return v;
  }

  matrix<T = number>(name: string): T[][] {
    const v = this.get(name);
    if (!Array.isArray(v) || v.some((row) => !Array.isArray(row)))
      throw new Error(`"${name}" must be a 2D array`);
    return v as T[][];
  }

  pairs(name: string): [number, number][] {
    const m = this.matrix<number>(name);
    if (m.some((p) => p.length !== 2 || p.some((x) => typeof x !== "number")))
      throw new Error(`"${name}" must be a list of [a, b] pairs`);
    return m as [number, number][];
  }
}

/** LeetCode design-problem input: `ops = ["MinStack","push"], args = [[],[1]]`. */
export function parseOps<A = unknown>(a: Args): { ops: string[]; args: A[][] } {
  const ops = a.strs("ops");
  const args = a.matrix<A>("args");
  if (ops.length !== args.length) throw new Error("ops and args must have the same length");
  return { ops, args };
}

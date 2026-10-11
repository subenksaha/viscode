import { arr, edgeKey, graph, map, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  accounts: string[][];
}

const short = (e: string) => e.split("@")[0];

/** Graph whose nodes are emails, with edges from each account's first email to the rest. */
function emailGraph(accounts: string[][]) {
  const nodes = new Set<string>();
  const edges: [string, string][] = [];
  for (const [, first, ...rest] of accounts) {
    nodes.add(short(first));
    for (const e of rest) {
      nodes.add(short(e));
      edges.push([short(first), short(e)]);
    }
  }
  return { nodes: [...nodes], edges };
}

const dfs = defineSolution<Input>({
  id: "email-graph-dfs",
  name: "Email Graph + DFS",
  time: "O(N log N)",
  space: "O(N)",
  idea: "Link every email in an account to that account's first email. Connected components of this graph are the merged accounts; find them with DFS and sort each.",
  approach: [
    {
      title: "Build an email graph",
      detail: "Connect every email to its account's first email. Accounts that share an email become connected.",
      at: "build",
    },
    {
      title: "New component",
      detail: "Each unvisited email starts a new person.",
      at: "start",
    },
    {
      title: "DFS collects the component",
      detail: "Everything reachable belongs to the same person.",
      at: "visit",
    },
    {
      title: "Emit sorted",
      detail: "Sort the emails and prefix the owner's name.",
      at: "emit",
    },
  ],
  code: code(`
    function accountsMerge(accounts: string[][]): string[][] {
      const neighbors = new Map<string, string[]>();
      const ownerName = new Map<string, string>();
      function addEdge(from: string, to: string) {
        if (!neighbors.has(from)) neighbors.set(from, []);
        neighbors.get(from)!.push(to);
      }

      for (const [name, firstEmail, ...otherEmails] of accounts) { //@build
        ownerName.set(firstEmail, name);
        addEdge(firstEmail, firstEmail);
        for (const email of otherEmails) {
          addEdge(firstEmail, email);
          addEdge(email, firstEmail);
          ownerName.set(email, name);
        }
      }

      const visited = new Set<string>();
      const result: string[][] = [];
      for (const startEmail of neighbors.keys()) { //@start
        if (visited.has(startEmail)) continue;
        const groupEmails: string[] = [];
        const stack = [startEmail];
        visited.add(startEmail);
        while (stack.length > 0) {
          const email = stack.pop()!; //@visit
          groupEmails.push(email);
          for (const neighbor of neighbors.get(email)!) {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              stack.push(neighbor);
            }
          }
        }
        groupEmails.sort();
        result.push([ownerName.get(startEmail)!, ...groupEmails]); //@emit
      }
      return result; //@ret
    }
  `),
  run({ accounts }, t) {
    const adj = new Map<string, string[]>(),
      name = new Map<string, string>();
    const link = (a: string, b: string) => {
      if (!adj.has(a)) adj.set(a, []);
      adj.get(a)!.push(b);
    };
    for (const [n, first, ...rest] of accounts) {
      name.set(first, n);
      link(first, first);
      for (const e of rest) {
        link(first, e);
        link(e, first);
        name.set(e, n);
      }
    }
    const g = emailGraph(accounts);
    const seen = new Set<string>(),
      res: string[][] = [];
    const nodeTones: Record<string, Tone> = {};
    const view = (cur?: string) => [
      graph("emails (user part)", g.nodes, g.edges, { tones: { ...nodeTones, ...(cur ? { [short(cur)]: "active" as Tone } : {}) } }),
      arr("merged", res.map((r) => `${r[0]}: ${r.slice(1).map(short).join(", ")}`), { indexLabels: false, tones: tones([res.length - 1, "success"]) }),
    ];
    t.step("build", "Connect each email to the first email of its account.", view());
    const palette: Tone[] = ["success", "compare", "visited", "window", "danger"];
    for (const start of adj.keys()) {
      if (seen.has(start)) continue;
      const tone = palette[res.length % palette.length];
      t.step("start", `New component from ${start}.`, () => view(start));
      const comp: string[] = [],
        stack = [start];
      seen.add(start);
      while (stack.length) {
        const e = stack.pop()!;
        comp.push(e);
        nodeTones[short(e)] = tone;
        for (const f of adj.get(e)!)
          if (!seen.has(f)) {
            seen.add(f);
            stack.push(f);
          }
        t.step("visit", `Visit ${e}.`, () => view(e));
      }
      res.push([name.get(start)!, ...comp.sort()]);
      t.step("emit", `Merged account for ${name.get(start)} with ${comp.length} email(s).`, () => view());
    }
    t.step("ret", `${res.length} merged account(s).`, view());
    return res;
  },
});

const unionFind = defineSolution<Input>({
  id: "union-find",
  name: "Union-Find over Accounts",
  time: "O(N α(N) + N log N)",
  space: "O(N)",
  idea: "Give each account an id. When an email was already seen in another account, union the two accounts. Finally group emails by their account's root.",
  approach: [
    {
      title: "One set per account",
      detail: "Accounts are the elements. Emails decide which ones to merge.",
      at: "init",
    },
    {
      title: "First owner of an email",
      detail: "Remember which account first claimed it.",
      at: "own",
    },
    {
      title: "Shared email → union",
      detail: "Seeing the same email again in another account merges the two accounts' sets.",
      at: "union",
    },
    {
      title: "Group by root",
      detail: "Bucket every email under its account's representative, then sort each bucket.",
      at: "group",
    },
  ],
  code: code(`
    function accountsMerge(accounts: string[][]): string[][] {
      // parent[i] points toward the representative account of i's group.
      const parent = accounts.map((_, index) => index);
      function findRoot(account: number): number {
        while (parent[account] !== account) {
          account = parent[account];
        }
        return account;
      }

      const ownerOfEmail = new Map<string, number>(); //@init
      for (let account = 0; account < accounts.length; account++) {
        const emails = accounts[account].slice(1);
        for (const email of emails) { //@email
          if (ownerOfEmail.has(email)) {
            const otherAccount = ownerOfEmail.get(email)!;
            parent[findRoot(account)] = findRoot(otherAccount); //@union
          } else {
            ownerOfEmail.set(email, account); //@own
          }
        }
      }

      const emailsByRoot = new Map<number, string[]>();
      for (const [email, account] of ownerOfEmail) { //@group
        const root = findRoot(account);
        if (!emailsByRoot.has(root)) emailsByRoot.set(root, []);
        emailsByRoot.get(root)!.push(email);
      }

      const result: string[][] = [];
      for (const [root, emails] of emailsByRoot) {
        const name = accounts[root][0];
        result.push([name, ...emails.sort()]);
      }
      return result; //@ret
    }
  `),
  run({ accounts }, t) {
    const parent = accounts.map((_, i) => i);
    const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
    const owner = new Map<string, number>();
    const unions: [number, number][] = [];
    const view = (i?: number, email?: string, tone: Tone = "active") => [
      vars({ account: i !== undefined ? `#${i} ${accounts[i][0]}` : undefined }),
      graph("accounts (edges = shared email)", accounts.map((_, k) => k), unions, {
        tones: tones(...accounts.map((_, k) => [k, find(k) === k ? "compare" : "muted"] as [number, Tone]), [i, "active"]),
        edgeTones: tones([unions.length && tone === "success" ? edgeKey(...unions.at(-1)!) : null, "success"]),
      }),
      arr("parent", parent, { tones: tones([i, "active"]) }),
      map("owner (email → account)", [...owner].map(([e, k]) => [short(e), k]), tones([email ? short(email) : null, tone])),
    ];
    t.step("init", "Each account is its own set.", view());
    accounts.forEach(([, ...emails], i) => {
      for (const e of emails) {
        if (owner.has(e)) {
          const j = owner.get(e)!;
          const ri = find(i),
            rj = find(j);
          if (ri !== rj) {
            parent[ri] = rj;
            unions.push([i, j]);
          }
          t.step("union", ri !== rj ? `${e} is also in account #${j}: union #${i} with #${j}.` : `${e} is in #${j}, already in the same set.`, () => view(i, e, "success"));
        } else {
          owner.set(e, i);
          t.step("own", `First time seeing ${e}: owned by #${i}.`, () => view(i, e));
        }
      }
    });
    const groups = new Map<number, string[]>();
    for (const [e, i] of owner) {
      const r = find(i);
      if (!groups.has(r)) groups.set(r, []);
      groups.get(r)!.push(e);
    }
    t.step("group", "Group emails by their account's root.", () => [map("groups (root → emails)", [...groups].map(([r, es]) => [r, es.map(short).join(", ")]))]);
    const res = [...groups].map(([r, es]) => [accounts[r][0], ...es.sort()]);
    t.step("ret", `${res.length} merged account(s).`, () => [arr("merged", res.map((r) => `${r[0]}: ${r.slice(1).map(short).join(", ")}`), { indexLabels: false })]);
    return res;
  },
});

export default defineProblem<Input>({
  description: "Each account is [name, ...emails]. Two accounts belong to the same person if they share any email. Merge them and return each person's name followed by their emails in sorted order.",
  input: {
    default:
      'accounts = [["John","js@mail.com","jn@mail.com"],["John","js@mail.com","jo@mail.com"],["Mary","m@mail.com"],["John","jx@mail.com"],["John","jx@mail.com","jo@mail.com"]]',
    parse: (a) => {
      const accounts = a.matrix<string>("accounts");
      if (accounts.some((acc) => acc.length < 2)) throw new Error("each account needs a name and at least one email");
      return { accounts };
    },
  },
  examples: [
    {
      input: 'accounts = [["John","johnsmith@mail.com","john_newyork@mail.com"],["John","johnsmith@mail.com","john00@mail.com"],["Mary","mary@mail.com"],["John","johnnybravo@mail.com"]]',
      output: [["John", "john00@mail.com", "john_newyork@mail.com", "johnsmith@mail.com"], ["Mary", "mary@mail.com"], ["John", "johnnybravo@mail.com"]],
    },
    {
      input: 'accounts = [["Gabe","Gabe0@m.co","Gabe3@m.co","Gabe1@m.co"],["Kevin","Kevin3@m.co","Kevin5@m.co","Kevin0@m.co"],["Ethan","Ethan5@m.co","Ethan4@m.co","Ethan0@m.co"],["Hanzo","Hanzo3@m.co","Hanzo1@m.co","Hanzo0@m.co"],["Fern","Fern5@m.co","Fern1@m.co","Fern0@m.co"]]',
      output: [["Ethan", "Ethan0@m.co", "Ethan4@m.co", "Ethan5@m.co"], ["Gabe", "Gabe0@m.co", "Gabe1@m.co", "Gabe3@m.co"], ["Hanzo", "Hanzo0@m.co", "Hanzo1@m.co", "Hanzo3@m.co"], ["Kevin", "Kevin0@m.co", "Kevin3@m.co", "Kevin5@m.co"], ["Fern", "Fern0@m.co", "Fern1@m.co", "Fern5@m.co"]],
    },
  ],
  normalize: (v) => (v as string[][]).map((acc) => acc.join()).sort(),
  solutions: [dfs, unionFind],
});

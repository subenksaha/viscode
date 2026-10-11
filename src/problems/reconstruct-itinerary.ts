import { arr, edgeKey, graph, map, tones } from "@/core/panels";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { Tone } from "@/core/types";

interface Input {
  tickets: [string, string][];
}

const airports = (tickets: [string, string][]) => [...new Set(tickets.flat())].sort();

const backtrack = defineSolution<Input>({
  id: "backtracking",
  name: "Backtracking in Lexical Order",
  time: "O(E^d)",
  space: "O(E)",
  idea: "Sort each airport's destinations. From JFK, try the smallest unused ticket first and recurse; if the path gets stuck before using every ticket, undo and try the next one. The first complete path is the lexically smallest.",
  code: code(`
    function findItinerary(tickets: string[][]): string[] {
      // destinations.get(airport) = airports we can fly to, in alphabetical order
      const destinations = new Map<string, string[]>();
      const sortedTickets = [...tickets].sort();
      for (const [from, to] of sortedTickets) { //@build
        if (!destinations.has(from)) destinations.set(from, []);
        destinations.get(from)!.push(to);
      }
      const path = ["JFK"];
      // Try to use every ticket, trying destinations in alphabetical order.
      function fly(): boolean {
        if (path.length === tickets.length + 1) return true; //@done
        const from = path[path.length - 1];
        const options = destinations.get(from) ?? [];
        for (let i = 0; i < options.length; i++) {
          const to = options[i];
          options.splice(i, 1); // use this ticket //@fly
          path.push(to);
          if (fly()) return true;
          path.pop(); // give the ticket back //@undo
          options.splice(i, 0, to);
        }
        return false; //@stuck
      }
      fly();
      return path; //@ret
    }
  `),
  run({ tickets }, t) {
    const adj = new Map<string, string[]>();
    for (const [a, b] of [...tickets].sort()) {
      if (!adj.has(a)) adj.set(a, []);
      adj.get(a)!.push(b);
    }
    const path = ["JFK"];
    const view = (edge?: [string, string], tone: Tone = "active") => {
      const tn: Record<string, Tone> = {};
      path.forEach((p) => (tn[p] = "visited"));
      tn[path.at(-1)!] = "active";
      return [
        graph("flights", airports(tickets), tickets, { directed: true, tones: tn, edgeTones: edge ? tones([edgeKey(...edge), tone]) : {} }),
        map("unused tickets", [...adj].map(([k, v]) => [k, v.join(", ")] as [string, string])),
        arr("itinerary", path, { indexLabels: false }),
      ];
    };
    t.step("build", "Group tickets by departure, destinations sorted.", view());
    const dfs = (): boolean => {
      if (path.length === tickets.length + 1) {
        t.step("done", "Every ticket used.", view());
        return true;
      }
      const from = path.at(-1)!,
        dests = adj.get(from) ?? [];
      for (let i = 0; i < dests.length; i++) {
        const to = dests[i];
        dests.splice(i, 1);
        path.push(to);
        t.step("fly", `Fly ${from} → ${to}.`, () => view([from, to]));
        if (dfs()) return true;
        path.pop();
        dests.splice(i, 0, to);
        t.step("undo", `Dead end. Give back ${from} → ${to}.`, () => view([from, to], "danger"));
      }
      t.step("stuck", `No usable ticket out of ${from}.`, () => view());
      return false;
    };
    dfs();
    t.step("ret", `Return [${path}].`, view());
    return path;
  },
});

const hierholzer = defineSolution<Input>({
  id: "hierholzer",
  name: "Hierholzer's Algorithm",
  time: "O(E log E)",
  space: "O(E)",
  idea: "The itinerary is an Eulerian path. Greedily follow the smallest unused ticket; when an airport has no tickets left, add it to the route. The route comes out reversed, and dead-end detours are naturally placed at the end.",
  code: code(`
    function findItinerary(tickets: string[][]): string[] {
      // Store destinations in reverse order so pop() gives the alphabetically smallest.
      const destinations = new Map<string, string[]>();
      const sortedTickets = [...tickets].sort().reverse();
      for (const [from, to] of sortedTickets) { //@build
        if (!destinations.has(from)) destinations.set(from, []);
        destinations.get(from)!.push(to);
      }
      const route: string[] = [];
      // Hierholzer's algorithm: add an airport only after all its tickets are used.
      function visit(airport: string) {
        const options = destinations.get(airport) ?? [];
        while (options.length > 0) visit(options.pop()!); //@fly
        route.push(airport); //@finish
      }
      visit("JFK");
      return route.reverse(); //@ret
    }
  `),
  run({ tickets }, t) {
    // Destinations are stored in reverse order so pop() yields the smallest.
    const adj = new Map<string, string[]>();
    for (const [a, b] of [...tickets].sort().reverse()) {
      if (!adj.has(a)) adj.set(a, []);
      adj.get(a)!.push(b);
    }
    const used: [string, string][] = [];
    const route: string[] = [];
    const view = (at: string, edge?: [string, string]) => [
      graph("flights", airports(tickets), tickets, {
        directed: true,
        tones: tones(...route.map((r) => [r, "success"] as [string, Tone]), [at, "active"]),
        edgeTones: tones(...used.map((e) => [edgeKey(...e), "muted"] as [string, Tone]), [edge ? edgeKey(...edge) : null, "active"]),
      }),
      map("unused tickets", [...adj].map(([k, v]) => [k, [...v].reverse().join(", ")] as [string, string])),
      arr("route (reversed)", route, { indexLabels: false }),
    ];
    t.step("build", "Group tickets by departure.", view("JFK"));
    const visit = (a: string) => {
      const dests = adj.get(a) ?? [];
      while (dests.length) {
        const to = dests.pop()!;
        used.push([a, to]);
        t.step("fly", `Use the smallest ticket ${a} → ${to}.`, () => view(to, [a, to]));
        visit(to);
      }
      route.push(a);
      t.step("finish", `${a} has no tickets left: append it to the route.`, () => view(a));
    };
    visit("JFK");
    const res = [...route].reverse();
    t.step("ret", `Reverse: [${res}].`, [arr("itinerary", res, { indexLabels: false })]);
    return res;
  },
});

export default defineProblem<Input>({
  description: "Given airline tickets [from, to], reconstruct the itinerary in order, starting at JFK and using every ticket exactly once. If several itineraries exist, return the lexically smallest.",
  input: {
    default: 'tickets = [["JFK","SFO"],["JFK","ATL"],["SFO","ATL"],["ATL","JFK"],["ATL","SFO"]]',
    parse: (a) => ({ tickets: a.matrix<string>("tickets") as [string, string][] }),
  },
  examples: [
    { input: 'tickets = [["MUC","LHR"],["JFK","MUC"],["SFO","SJC"],["LHR","SFO"]]', output: ["JFK", "MUC", "LHR", "SFO", "SJC"] },
    { input: 'tickets = [["JFK","SFO"],["JFK","ATL"],["SFO","ATL"],["ATL","JFK"],["ATL","SFO"]]', output: ["JFK", "ATL", "JFK", "SFO", "ATL", "SFO"] },
    { input: 'tickets = [["JFK","KUL"],["JFK","NRT"],["NRT","JFK"]]', output: ["JFK", "NRT", "JFK", "KUL"] },
  ],
  solutions: [backtrack, hierholzer],
});

import { arr, map, tones, vars } from "@/core/panels";
import { parseOps } from "@/core/input";
import { code, defineProblem, defineSolution } from "@/core/trace";
import type { ListPanel, Tone } from "@/core/types";

interface Input {
  ops: string[];
  args: number[][];
}

type Out = number | null;
const fmtOut = (out: Out[]) => out.map((o) => (o === null ? "null" : String(o)));

const mapOrder = defineSolution<Input>({
  id: "map-insertion-order",
  name: "Map Insertion Order",
  time: "O(1) per op",
  space: "O(capacity)",
  idea: "A JS Map iterates keys in insertion order. Deleting and re-inserting a key moves it to the newest end, so the first key is always the least recently used.",
  code: code(`
    class LRUCache {
      // A Map remembers insertion order: the first key is the least recently used.
      cache = new Map<number, number>();
      constructor(private capacity: number) {} //@ctor

      get(key: number): number {
        if (!this.cache.has(key)) return -1; //@miss
        const value = this.cache.get(key)!;
        // Re-insert so this key moves to the end (most recently used).
        this.cache.delete(key); //@touch
        this.cache.set(key, value);
        return value;
      }

      put(key: number, value: number): void {
        this.cache.delete(key);
        this.cache.set(key, value); //@put
        if (this.cache.size > this.capacity) { //@full
          const oldestKey = this.cache.keys().next().value!;
          this.cache.delete(oldestKey); //@evict
        }
      }
    }
  `),
  run({ ops, args }, t) {
    let capacity = 0;
    const cache = new Map<number, number>(),
      out: Out[] = [];
    const view = (op: string, key?: number, tone: Tone = "active") => [
      vars({ op, capacity }),
      map("cache (oldest → newest)", cache, tones([key, tone])),
      arr("output", fmtOut(out), { indexLabels: false }),
    ];
    ops.forEach((op, k) => {
      const label = `${op}(${args[k].join(",")})`;
      if (op === "LRUCache") {
        capacity = args[k][0];
        out.push(null);
        t.step("ctor", `Capacity ${capacity}.`, view(label));
      } else if (op === "get") {
        const key = args[k][0];
        if (!cache.has(key)) {
          out.push(-1);
          t.step("miss", `${key} is not cached. Return −1.`, view(label));
          return;
        }
        const v = cache.get(key)!;
        cache.delete(key);
        cache.set(key, v);
        out.push(v);
        t.step("touch", `Hit: ${key} → ${v}. Move it to the newest end.`, view(label, key, "success"));
      } else {
        const [key, value] = args[k];
        cache.delete(key);
        cache.set(key, value);
        out.push(null);
        t.step("put", `Store ${key} → ${value} as the newest.`, view(label, key));
        if (cache.size > capacity) {
          const old = cache.keys().next().value!;
          t.step("full", `Over capacity. The oldest key is ${old}.`, view(label, old, "danger"));
          cache.delete(old);
          t.step("evict", `Evict ${old}.`, view(label));
        }
      }
    });
    return out;
  },
});

interface DNode {
  id: number;
  key: number;
  val: number;
  prev: DNode | null;
  next: DNode | null;
}

const hashDll = defineSolution<Input>({
  id: "hash-map-doubly-linked-list",
  name: "Hash Map + Doubly Linked List",
  time: "O(1) per op",
  space: "O(capacity)",
  idea: "A doubly linked list keeps usage order (head = most recent, tail = least recent) and a hash map finds any node in O(1). Touching a node unlinks it and reinserts it after head.",
  code: code(`
    class Node {
      prev: Node | null = null;
      next: Node | null = null;
      constructor(public key = 0, public val = 0) {}
    }

    // Most recently used nodes sit right after head; the least recently used sits right before tail.
    class LRUCache {
      nodeByKey = new Map<number, Node>();
      head = new Node(); // dummy
      tail = new Node(); // dummy

      constructor(private capacity: number) { //@ctor
        this.head.next = this.tail;
        this.tail.prev = this.head;
      }

      private remove(node: Node) {
        node.prev!.next = node.next;
        node.next!.prev = node.prev;
      }

      private addToFront(node: Node) {
        const first = this.head.next!;
        node.prev = this.head;
        node.next = first;
        first.prev = node;
        this.head.next = node;
      }

      get(key: number): number {
        const node = this.nodeByKey.get(key);
        if (node === undefined) return -1; //@miss
        this.remove(node); //@touch
        this.addToFront(node);
        return node.val;
      }

      put(key: number, value: number): void {
        const existing = this.nodeByKey.get(key);
        if (existing !== undefined) this.remove(existing); //@replace
        const node = new Node(key, value);
        this.nodeByKey.set(key, node); //@put
        this.addToFront(node);
        if (this.nodeByKey.size > this.capacity) { //@full
          const leastRecent = this.tail.prev!;
          this.remove(leastRecent); //@evict
          this.nodeByKey.delete(leastRecent.key);
        }
      }
    }
  `),
  run({ ops, args }, t) {
    let capacity = 0,
      nextId = 1;
    const mk = (key: number, val: number): DNode => ({ id: nextId++, key, val, prev: null, next: null });
    const head = mk(0, 0),
      tail = mk(0, 0);
    head.next = tail;
    tail.prev = head;
    const nodes = new Map<number, DNode>(),
      out: Out[] = [];
    const unlink = (n: DNode) => {
      n.prev!.next = n.next;
      n.next!.prev = n.prev;
    };
    const addFront = (n: DNode) => {
      n.next = head.next;
      n.prev = head;
      head.next!.prev = n;
      head.next = n;
    };
    const listPanel = (hi?: DNode, tone: Tone = "active"): ListPanel => {
      const order: DNode[] = [];
      for (let n: DNode | null = head; n; n = n.next) order.push(n);
      return {
        kind: "list",
        label: "usage list (head = most recent)",
        nodes: order.map((n) => ({ id: n.id, label: n === head ? "H" : n === tail ? "T" : `${n.key}:${n.val}`, next: n.next?.id ?? null })),
        tones: tones([head.id, "muted"], [tail.id, "muted"], [hi?.id, tone]),
        pointers: {},
      };
    };
    const view = (op: string, hi?: DNode, tone: Tone = "active") => [
      vars({ op, capacity, size: nodes.size }),
      listPanel(hi, tone),
      arr("output", fmtOut(out), { indexLabels: false }),
    ];
    ops.forEach((op, k) => {
      const label = `${op}(${args[k].join(",")})`;
      if (op === "LRUCache") {
        capacity = args[k][0];
        out.push(null);
        t.step("ctor", `Capacity ${capacity}. Sentinel head H and tail T.`, view(label));
      } else if (op === "get") {
        const n = nodes.get(args[k][0]);
        if (!n) {
          out.push(-1);
          t.step("miss", `${args[k][0]} is not in the map. Return −1.`, view(label));
          return;
        }
        unlink(n);
        addFront(n);
        out.push(n.val);
        t.step("touch", `Hit: move ${n.key} to the front. Return ${n.val}.`, view(label, n, "success"));
      } else {
        const [key, value] = args[k];
        const old = nodes.get(key);
        if (old) {
          unlink(old);
          t.step("replace", `${key} exists: unlink the old node.`, view(label));
        }
        const n = mk(key, value);
        nodes.set(key, n);
        addFront(n);
        out.push(null);
        t.step("put", `Insert ${key}:${value} at the front.`, view(label, n));
        if (nodes.size > capacity) {
          const lru = tail.prev!;
          t.step("full", `Over capacity. The node before T, ${lru.key}, is least recently used.`, view(label, lru, "danger"));
          unlink(lru);
          nodes.delete(lru.key);
          t.step("evict", `Evict ${lru.key}.`, view(label));
        }
      }
    });
    return out;
  },
});

export default defineProblem<Input>({
  description: "Design a Least Recently Used cache with a fixed capacity. get(key) returns the value or −1; put(key, value) inserts or updates, evicting the least recently used key when over capacity. Both must run in O(1).",
  input: {
    default: 'ops = ["LRUCache","put","put","get","put","get","put","get","get","get"], args = [[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]',
    parse: (a) => parseOps<number>(a),
  },
  examples: [
    {
      input: 'ops = ["LRUCache","put","put","get","put","get","put","get","get","get"], args = [[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]',
      output: [null, null, null, 1, null, -1, null, -1, 3, 4],
    },
    { input: 'ops = ["LRUCache","put","put","put","get"], args = [[1],[2,1],[2,2],[3,3],[2]]', output: [null, null, null, null, -1] },
  ],
  solutions: [mapOrder, hashDll],
});

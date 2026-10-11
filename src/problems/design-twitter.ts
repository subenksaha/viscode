import { arr, map, tones, vars } from "@/core/panels";
import { code, defineProblem, defineSolution, type Tracer } from "@/core/trace";
import type { Panel, Tone } from "@/core/types";

interface Input {
  ops: string[];
  args: number[][];
}

type Out = null | number[];
const fmtOut = (out: Out[]) => out.map((o) => (o === null ? "null" : `[${o}]`));

/** Replays the op list; `merge` picks how getNewsFeed gathers tweets. */
function simulate({ ops, args }: Input, t: Tracer, merge: boolean) {
  const tweets = new Map<number, [number, number][]>(); // user → [time, tweetId], oldest first
  const follows = new Map<number, Set<number>>();
  const out: Out[] = [];
  let time = 0;
  ops.forEach((op, k) => {
    const [a, b] = args[k];
    const label = `${op}(${args[k].join(",")})`;
    const view = (...extra: Panel[]) => [
      vars({ op: label }),
      map("tweets (user → time:id)", [...tweets].map(([u, ts]) => [String(u), ts.map(([tm, id]) => `${tm}:${id}`).join(" ")] as [string, string]), tones([String(a), "active"])),
      map("follows", [...follows].map(([u, f]) => [String(u), [...f].join(", ")] as [string, string]), tones([String(a), "active"])),
      ...extra,
      arr("output", fmtOut(out), { indexLabels: false }),
    ];
    if (op === "Twitter") {
      out.push(null);
      t.step("ctor", "Empty network.", view());
    } else if (op === "postTweet") {
      if (!tweets.has(a)) tweets.set(a, []);
      tweets.get(a)!.push([time++, b]);
      out.push(null);
      t.step("post", `User ${a} posts tweet ${b} at time ${time - 1}.`, view());
    } else if (op === "follow") {
      if (a !== b) {
        if (!follows.has(a)) follows.set(a, new Set());
        follows.get(a)!.add(b);
      }
      out.push(null);
      t.step("follow", `User ${a} follows ${b}.`, view());
    } else if (op === "unfollow") {
      follows.get(a)?.delete(b);
      out.push(null);
      t.step("unfollow", `User ${a} unfollows ${b}.`, view());
    } else {
      const users = [a, ...(follows.get(a) ?? [])];
      const feed: number[] = [];
      const show = (ts: [number, number][]) => ts.map(([tm, id]) => `${tm}:${id}`);
      if (!merge) {
        const all = users.flatMap((u) => tweets.get(u) ?? []);
        t.step("collect", `Collect every tweet from users [${users}].`, view(arr("candidates (time:id)", show(all), { indexLabels: false })));
        all.sort((x, y) => y[0] - x[0]);
        feed.push(...all.slice(0, 10).map(([, id]) => id));
        t.step("sort", "Sort newest first and keep 10.", view(arr("candidates (time:id)", show(all), { indexLabels: false, tones: tones(...all.slice(0, 10).map((_, i) => [i, "success"] as [number, Tone])) })));
      } else {
        // Each followed user contributes its newest unread tweet; idx tracks how far back we've read.
        const idx = new Map(users.map((u) => [u, (tweets.get(u)?.length ?? 0) - 1]));
        const heap = () =>
          users
            .filter((u) => idx.get(u)! >= 0)
            .map((u) => [...tweets.get(u)![idx.get(u)!], u] as [number, number, number])
            .sort((x, y) => y[0] - x[0]);
        const heapView = () => arr("max-heap (time:id by user)", heap().map(([tm, id, u]) => `${tm}:${id} by ${u}`), { indexLabels: false, tones: tones([0, "active"]) });
        t.step("seed", `Seed the heap with the newest tweet of each of [${users}].`, view(heapView()));
        while (heap().length && feed.length < 10) {
          const [tm, id, u] = heap()[0];
          feed.push(id);
          idx.set(u, idx.get(u)! - 1);
          t.step("pop", `Newest is tweet ${id} (time ${tm}) by ${u}. Push ${u}'s next older tweet.`, view(heapView(), arr("feed", feed, { indexLabels: false })));
        }
      }
      out.push(feed);
      t.step("feed", `Feed for ${a}: [${feed}].`, view());
    }
  });
  return out;
}

const sortAll = defineSolution<Input>({
  id: "sort-all",
  name: "Collect and Sort",
  time: "O(T log T) per feed",
  space: "O(total tweets)",
  idea: "Store each user's tweets with a global timestamp. For a feed, gather all tweets from the user and their followees, sort by time and take the 10 newest.",
  code: code(`
    type Tweet = { time: number; id: number };

    class Twitter {
      time = 0; //@ctor
      tweetsByUser = new Map<number, Tweet[]>(); // oldest first
      followees = new Map<number, Set<number>>();

      postTweet(userId: number, tweetId: number) {
        if (!this.tweetsByUser.has(userId)) this.tweetsByUser.set(userId, []);
        this.tweetsByUser.get(userId)!.push({ time: this.time, id: tweetId }); //@post
        this.time++;
      }

      getNewsFeed(userId: number): number[] {
        const people = [userId, ...(this.followees.get(userId) ?? [])];
        const allTweets: Tweet[] = [];
        for (const person of people) { //@collect
          allTweets.push(...(this.tweetsByUser.get(person) ?? []));
        }
        allTweets.sort((a, b) => b.time - a.time); // newest first //@sort
        const newestTen = allTweets.slice(0, 10);
        return newestTen.map((tweet) => tweet.id); //@feed
      }

      follow(followerId: number, followeeId: number) {
        if (followerId === followeeId) return; //@follow
        if (!this.followees.has(followerId)) this.followees.set(followerId, new Set());
        this.followees.get(followerId)!.add(followeeId);
      }

      unfollow(followerId: number, followeeId: number) {
        this.followees.get(followerId)?.delete(followeeId); //@unfollow
      }
    }
  `),
  run: (input, t) => simulate(input, t, false),
});

const kWayMerge = defineSolution<Input>({
  id: "k-way-merge",
  name: "K-way Merge with a Heap",
  time: "O(F + 10 log F) per feed",
  space: "O(total tweets)",
  idea: "Each user's tweets are already in time order. Put the newest tweet of every followed user in a max-heap and pop 10 times, pushing the next older tweet from the same user each time.",
  code: code(`
    type Tweet = { time: number; id: number };

    class Twitter {
      time = 0; //@ctor
      tweetsByUser = new Map<number, Tweet[]>(); // oldest first
      followees = new Map<number, Set<number>>();

      postTweet(userId: number, tweetId: number) {
        if (!this.tweetsByUser.has(userId)) this.tweetsByUser.set(userId, []);
        this.tweetsByUser.get(userId)!.push({ time: this.time, id: tweetId }); //@post
        this.time++;
      }

      getNewsFeed(userId: number): number[] {
        // Max-heap by time. Each entry points at one tweet: tweetsByUser.get(person)[index].
        type Entry = { time: number; person: number; index: number };
        const heap = new MaxPriorityQueue<Entry>((entry) => entry.time);
        const people = [userId, ...(this.followees.get(userId) ?? [])];
        for (const person of people) { //@seed
          const tweets = this.tweetsByUser.get(person) ?? [];
          if (tweets.length > 0) {
            const newestIndex = tweets.length - 1;
            heap.enqueue({ time: tweets[newestIndex].time, person, index: newestIndex });
          }
        }
        const feed: number[] = [];
        while (heap.size() > 0 && feed.length < 10) {
          const newest = heap.dequeue(); //@pop
          const tweets = this.tweetsByUser.get(newest.person)!;
          feed.push(tweets[newest.index].id);
          if (newest.index > 0) {
            const olderIndex = newest.index - 1;
            heap.enqueue({ time: tweets[olderIndex].time, person: newest.person, index: olderIndex });
          }
        }
        return feed; //@feed
      }

      follow(followerId: number, followeeId: number) {
        if (followerId === followeeId) return; //@follow
        if (!this.followees.has(followerId)) this.followees.set(followerId, new Set());
        this.followees.get(followerId)!.add(followeeId);
      }

      unfollow(followerId: number, followeeId: number) {
        this.followees.get(followerId)?.delete(followeeId); //@unfollow
      }
    }
  `),
  run: (input, t) => simulate(input, t, true),
});

export default defineProblem<Input>({
  description: "Design a simplified Twitter: postTweet(userId, tweetId), follow/unfollow(followerId, followeeId), and getNewsFeed(userId), which returns the 10 most recent tweet ids from the user and the people they follow, newest first.",
  input: {
    default: 'ops = ["Twitter","postTweet","postTweet","follow","postTweet","getNewsFeed","unfollow","getNewsFeed"], args = [[],[1,5],[2,6],[1,2],[1,3],[1],[1,2],[1]]',
    parse: (a) => {
      const ops = a.strs("ops");
      const args = a.matrix<number>("args");
      if (ops.length !== args.length) throw new Error("ops and args must have the same length");
      return { ops, args };
    },
  },
  examples: [
    { input: 'ops = ["Twitter","postTweet","getNewsFeed","follow","postTweet","getNewsFeed","unfollow","getNewsFeed"], args = [[],[1,5],[1],[1,2],[2,6],[1],[1,2],[1]]', output: [null, null, [5], null, null, [6, 5], null, [5]] },
    { input: 'ops = ["Twitter","postTweet","postTweet","follow","postTweet","getNewsFeed","unfollow","getNewsFeed"], args = [[],[1,5],[2,6],[1,2],[1,3],[1],[1,2],[1]]', output: [null, null, null, null, null, [3, 6, 5], null, [3, 5]] },
  ],
  solutions: [sortAll, kWayMerge],
});

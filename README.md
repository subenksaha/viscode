# VisCode

**See the algorithm run.** VisCode steps through LeetCode solutions line by line, animating arrays, grids, trees, linked lists, graphs and hash maps as the code executes.

🌐 **Live site:** [viscode.subensaha.com](https://viscode.subensaha.com)

## Features

- **168 problems** covering the full **Blind 75**, **Grind 75** and **NeetCode 150** lists.
- **Several approaches per problem.** Each one, from brute force to optimal, comes with its time and space complexity and a one-line idea.
- **Your own input.** Edit the LeetCode-style input (`nums = [2,7,11,15], target = 9`) and the animation reruns on it.
- **Line-by-line playback.** Play, pause, step forward or back. The current code line is highlighted, with a note explaining what just happened.
- **Filters:** list, difficulty, topic, done/to-do status and search, with optional grouping. Filters are stored in the URL, so a filtered view can be shared as a link.
- **Progress tracking:** mark problems done. Progress is saved in your browser.
- **Light and dark themes.**

## Tech stack

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS v4 · Zustand · Motion · Shiki · Vitest

## Getting started

Requires **Node.js 24+** and **pnpm** (the version is pinned in `package.json`; `corepack enable` installs it).

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

| Command          | What it does                                              |
| ---------------- | --------------------------------------------------------- |
| `pnpm dev`       | Start the dev server                                      |
| `pnpm build`     | Production build (standalone output in `.next/standalone`) |
| `pnpm start`     | Serve the production build                                |
| `pnpm test`      | Run every solution against its examples                   |
| `pnpm typecheck` | Type-check with `tsc`                                     |
| `pnpm lint`      | Lint with ESLint                                          |
| `pnpm format`    | Format with Prettier                                      |

## Deployment (Docker)

The app builds as a [standalone](https://nextjs.org/docs/app/api-reference/config/next-config-js/output) Next.js server. The multi-stage `Dockerfile` produces a small image that runs as a non-root user and contains only the server, static assets and `public/`.

```bash
docker build -t viscode .
docker run -d --name viscode -p 3000:3000 --restart unless-stopped viscode
```

The site is then available at `http://localhost:3000`. Put a reverse proxy (Nginx, Caddy, Traefik, …) in front of it to serve `viscode.subensaha.com` over HTTPS.

| Variable   | Default   | Purpose            |
| ---------- | --------- | ------------------ |
| `PORT`     | `3000`    | Port to listen on  |
| `HOSTNAME` | `0.0.0.0` | Interface to bind  |

The public URL used for canonical links, Open Graph tags, `sitemap.xml` and `robots.txt` is set in `src/lib/site.ts`.

## How it works

Each solution is an ordinary function that runs once and records **steps**. A step is the code line being executed, a short note, and a list of **panels**. Panels are declarative snapshots (array, map, grid, tree, linked list, graph, intervals, bits, variables). One shared player moves through the steps and one renderer draws the panels, so problem files contain no React code.

```
src/
  app/                         routes: home, /problems/[slug], /categories/[category], icon, sitemap, robots
  catalog/
    categories.ts              topic categories (array, graph, tree, ...)
    problems.ts                problem registry: metadata + lazy loader per problem
    lists/                     curated lists (Blind 75, Grind 75, NeetCode 150); register new ones in index.ts
  problems/<slug>.ts           one module per problem: description, input parser, examples, solutions
  problems/problems.test.ts    checks every solution on every example and validates its trace
  core/
    types.ts                   Panel / Step / Solution / ProblemModule contracts
    trace.ts                   code() label compiler, Tracer, runSolution
    panels.ts                  panel builders: arr, map, grid, tree, list, graph, intervals, bits, ...
    structures.ts              ListNode / TreeNode and LeetCode-format builders
    input.ts                   parser for LeetCode-style input: nums = [1,2], k = 3
  components/scene/            panel renderers
  components/player/           player, code panel, controls
  lib/site.ts                  site name, URL and description
```

## Contributing

### Adding a problem

1. Create `src/problems/<slug>.ts` and export `defineProblem({ description, input, examples, solutions })`.
2. In each solution's code, end lines with `//@label` markers, and call `t.step("label", note, panels)` from `run`. Using a label that doesn't exist throws an error, so the tests catch typos.
3. Register the problem in `src/catalog/problems.ts`.
4. Add its slug to any list in `src/catalog/lists/`.
5. Run `pnpm test`.

### Adding a list

Create `src/catalog/lists/<id>.ts` with sections. Give each section either a `category` (its heading links to that category's page) or a `title`, plus the problem slugs in order. Then add the list to `lists/index.ts`. The tests fail if a list references an unknown problem or category, or contains duplicates.

## Acknowledgements

Problem statements and examples come from [LeetCode](https://leetcode.com). The problem lists are based on [Blind 75](https://github.com/jaimin-bariya/blind-75-leetcode), [Grind 75](https://github.com/open-minded13/leetcode-grind-75-solutions) and [NeetCode 150](https://github.com/dipjul/NeetCode-150).

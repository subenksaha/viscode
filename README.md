# VisCode

Step-by-step visualizer for LeetCode solutions. Built with Next.js 16 (App Router, Cache Components), React 19 and Tailwind v4.

```bash
pnpm dev        # http://localhost:3000
pnpm test       # runs every solution against its examples
pnpm typecheck
pnpm lint
pnpm format
```

## How it works

Each solution runs once as a plain function and records **steps**. A step is the code line being executed, a note and a list of **panels**: declarative snapshots such as an array, map, grid, tree, linked list, graph or intervals. One shared player moves through the steps, and one renderer draws the panels. Problems never contain React code.

```
src/
  catalog/                     what exists and how it is grouped (kept separate)
    categories.ts              topic categories (array, graph, tree, ...)
    problems.ts                problem registry: metadata + lazy loader per problem
    lists/                     curated lists; each section = category + ordered slugs
      blind-75.ts
      index.ts                 register new lists here
  problems/<slug>.ts           one module per problem: description, input parser, examples, solutions
  problems/problems.test.ts    checks every solution on every example
  core/
    types.ts                   Panel / Step / Solution / ProblemModule contracts
    trace.ts                   code() label compiler, Tracer, runSolution
    panels.ts                  panel builders: arr, map, grid, tree, list, graph, intervals, bits, ...
    structures.ts              ListNode / TreeNode and LeetCode-format builders
    input.ts                   parser for LeetCode-style input: nums = [1,2], k = 3
  components/scene/            panel renderers
  components/player/           player, code panel, controls
```

## Adding a problem

1. Create `src/problems/<slug>.ts` and export `defineProblem({ description, input, examples, solutions })`.
2. Write each solution's code with `//@label` markers at the end of lines, and call `t.step("label", note, panels)` in `run`. A label that does not exist throws, so tests catch typos.
3. Register it in `src/catalog/problems.ts`.
4. Add the slug to any list in `src/catalog/lists/`.

## Adding a list

Create `src/catalog/lists/<id>.ts` with sections of `{ category, problems: [slugs] }` and add it to `lists/index.ts`. The test fails if a list references an unregistered problem or category.

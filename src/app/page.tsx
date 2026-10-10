import { Suspense } from "react";
import { allCategories } from "@/catalog/categories";
import { listSlugs, lists } from "@/catalog/lists";
import { problems, problemsInCategory, type ProblemMeta } from "@/catalog/problems";
import { ProblemBrowser, type BrowserProblem } from "@/components/ProblemBrowser";
import { ProblemTable } from "@/components/ProblemRow";

const meta = ({ slug, id, title, difficulty, categories, premium }: ProblemMeta): ProblemMeta => ({
  slug,
  id,
  title,
  difficulty,
  categories,
  premium,
});

export default function Home() {
  const categories = allCategories
    .filter((c) => problemsInCategory(c.id).length > 0)
    .map(({ id, name }) => ({ id, name }));

  const membership = new Map<string, string[]>();
  for (const l of lists)
    for (const slug of listSlugs(l)) membership.set(slug, [...(membership.get(slug) ?? []), l.id]);

  const rows: BrowserProblem[] = problems
    .map((p) => ({ ...meta(p), lists: membership.get(p.slug) ?? [] }))
    .sort((a, b) => a.id - b.id);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">See the algorithm run.</h1>
        <p className="text-fg/60 max-w-2xl">
          Step through {problems.length} LeetCode problems line by line. Every approach, from brute
          force to optimal, is animated on your own input.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        {/* Filters live in the URL; prerender the unfiltered table until search params are known. */}
        <Suspense fallback={<ProblemTable problems={rows} showCategories />}>
          <ProblemBrowser
            problems={rows}
            lists={lists.map(({ id, name }) => ({ id, name }))}
            categories={categories}
          />
        </Suspense>
      </section>
    </div>
  );
}

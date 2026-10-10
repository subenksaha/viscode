import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCategory } from "@/catalog/categories";
import { getProblem, leetcodeUrl, problems } from "@/catalog/problems";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { Player } from "@/components/player/Player";
import { DoneButton } from "@/components/Progress";
import { highlightLines } from "@/lib/highlight";

export function generateStaticParams() {
  return problems.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/problems/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const entry = getProblem(slug);
  if (!entry) return {};
  return { title: `${entry.id}. ${entry.title}`, alternates: { canonical: `/problems/${slug}` } };
}

// The App Shell is shared by every slug, so params are read inside Suspense.
export default function ProblemPage({ params }: PageProps<"/problems/[slug]">) {
  return (
    <Suspense fallback={<ProblemSkeleton />}>
      <ProblemContent params={params} />
    </Suspense>
  );
}

async function ProblemContent({ params }: { params: PageProps<"/problems/[slug]">["params"] }) {
  const entry = getProblem((await params).slug);
  if (!entry) notFound();

  const problem = (await entry.load()).default;
  const codes = Object.fromEntries(
    await Promise.all(
      problem.solutions.map(
        async (s) => [s.id, await highlightLines(s.code.source, "typescript")] as const,
      ),
    ),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">
            {entry.id}. {entry.title}
          </h1>
          <DifficultyBadge difficulty={entry.difficulty} />
          {entry.premium && (
            <span className="rounded bg-amber-400/10 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-300">
              Premium
            </span>
          )}
          <DoneButton slug={entry.slug} />
          <a
            href={leetcodeUrl(entry.slug)}
            target="_blank"
            className="text-fg/40 hover:text-fg text-xs underline"
          >
            LeetCode ↗
          </a>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {entry.categories.map((id) => (
            <Link
              key={id}
              href={`/categories/${id}`}
              className="bg-fg/5 text-fg/50 hover:text-fg rounded px-2 py-0.5 text-xs"
            >
              {getCategory(id)?.name}
            </Link>
          ))}
        </div>
        <p className="text-fg/70 max-w-3xl text-sm">{problem.description}</p>
      </div>
      <Player slug={entry.slug} codes={codes} />
    </div>
  );
}

function ProblemSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="bg-fg/5 h-8 w-64 rounded" />
        <div className="bg-fg/5 h-4 w-full max-w-3xl rounded" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="bg-fg/5 h-80 rounded-lg" />
        <div className="bg-fg/5 h-80 rounded-lg" />
      </div>
    </div>
  );
}

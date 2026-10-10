import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { allCategories, getCategory } from "@/catalog/categories";
import { problemsInCategory } from "@/catalog/problems";
import { ProblemTable } from "@/components/ProblemRow";

export function generateStaticParams() {
  return allCategories.map((c) => ({ category: c.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/categories/[category]">): Promise<Metadata> {
  const category = getCategory((await params).category);
  return { title: category ? `${category.name} · VisCode` : "VisCode" };
}

export default function CategoryPage({ params }: PageProps<"/categories/[category]">) {
  return (
    <Suspense>
      <CategoryContent params={params} />
    </Suspense>
  );
}

async function CategoryContent({
  params,
}: {
  params: PageProps<"/categories/[category]">["params"];
}) {
  const category = getCategory((await params).category);
  if (!category) notFound();
  const items = problemsInCategory(category.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{category.name}</h1>
        <p className="text-sm text-fg/60">{category.description}</p>
      </div>
      {items.length ? (
        <ProblemTable problems={items} />
      ) : (
        <p className="text-sm text-fg/40">No problems in this category yet.</p>
      )}
    </div>
  );
}

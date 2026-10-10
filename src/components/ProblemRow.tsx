import Link from "next/link";
import { getCategory } from "@/catalog/categories";
import type { ProblemMeta } from "@/catalog/problems";
import { DifficultyBadge } from "./DifficultyBadge";
import { DoneCheckbox } from "./Progress";

export function ProblemTable({
  problems,
  showCategories = false,
}: {
  problems: ProblemMeta[];
  showCategories?: boolean;
}) {
  return (
    <ul className="divide-fg/10 border-fg/10 divide-y overflow-hidden rounded-lg border">
      {problems.map((p) => (
        <li key={p.slug} className="hover:bg-fg/[0.03] flex items-center">
          {/* The checkbox sits outside the link so ticking it doesn't navigate. */}
          <span className="flex items-center self-stretch pl-4">
            <DoneCheckbox slug={p.slug} title={p.title} />
          </span>
          <Link
            href={`/problems/${p.slug}`}
            className="flex min-w-0 flex-1 items-center gap-4 py-2.5 pr-4 pl-3"
          >
            <span className="text-fg/40 w-12 shrink-0 font-mono text-sm">{p.id}.</span>
            <span className="flex-1">
              {p.title}
              {p.premium && (
                <span className="ml-2 rounded bg-amber-400/10 px-1.5 py-0.5 text-[10px] text-amber-700 dark:text-amber-300">
                  Premium
                </span>
              )}
            </span>
            {showCategories && (
              <span className="text-fg/35 hidden max-w-[45%] truncate text-right text-xs md:block">
                {p.categories.map((id) => getCategory(id)?.name).join(" · ")}
              </span>
            )}
            <DifficultyBadge difficulty={p.difficulty} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

"use client";

import { Dices } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { CategoryId } from "@/catalog/categories";
import type { ProblemMeta } from "@/catalog/problems";
import type { Difficulty } from "@/core/types";
import { cn } from "@/lib/cn";
import { leetcodeUrl } from "@/lib/leetcode";
import { useDone } from "@/store/progress";
import { ProblemTable } from "./ProblemRow";
import { ClearProgress } from "./Progress";

export interface BrowserProblem extends ProblemMeta {
  /** Ids of the curated lists containing this problem. */
  lists: string[];
}

interface Option {
  id: string;
  name: string;
}

const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];

const diffStyles: Record<Difficulty, string> = {
  Easy: "border-emerald-400/50 bg-emerald-400/10 text-emerald-700 dark:text-emerald-300",
  Medium: "border-amber-400/50 bg-amber-400/10 text-amber-700 dark:text-amber-300",
  Hard: "border-red-400/50 bg-red-400/10 text-red-700 dark:text-red-300",
};

// URL keys. Each holds a comma-separated set; values within a facet are OR-ed, facets are AND-ed.
const KEYS = {
  list: "list",
  category: "category",
  difficulty: "difficulty",
  status: "status",
  q: "q",
  group: "group",
} as const;

type GroupBy = "none" | "difficulty" | "category";
const GROUPS: { id: GroupBy; name: string }[] = [
  { id: "none", name: "None" },
  { id: "difficulty", name: "Difficulty" },
  { id: "category", name: "Category" },
];

interface Group {
  key: string;
  title?: string;
  items: BrowserProblem[];
}

const STATUSES = [
  { id: "todo", name: "To do" },
  { id: "done", name: "Done" },
];

const readSet = (params: URLSearchParams, key: string) =>
  new Set((params.get(key) ?? "").split(",").filter(Boolean));

export function ProblemBrowser({
  problems,
  lists,
  categories,
}: {
  problems: BrowserProblem[];
  lists: Option[];
  categories: { id: CategoryId; name: string }[];
}) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const selected = {
    list: readSet(params, KEYS.list),
    category: readSet(params, KEYS.category),
    difficulty: readSet(params, KEYS.difficulty),
    status: readSet(params, KEYS.status),
  };
  const done = useDone();
  // Local state keeps typing responsive; the URL is updated alongside it.
  const [query, setQuery] = useState(() => params.get(KEYS.q) ?? "");

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const toggle = (key: keyof typeof selected, id: string) => {
    const set = new Set(selected[key]);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    update(key, [...set].join(","));
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const { list, category, difficulty, status } = selected;
    return problems.filter(
      (p) =>
        (!list.size || p.lists.some((l) => list.has(l))) &&
        (!category.size || p.categories.some((c) => category.has(c))) &&
        (!difficulty.size || difficulty.has(p.difficulty)) &&
        (!status.size || status.has(done.has(p.slug) ? "done" : "todo")) &&
        (!q || p.title.toLowerCase().includes(q) || String(p.id) === q),
    );
    // `selected` is derived from `params`, so `params` covers it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problems, params, query, done]);

  const groupParam = params.get(KEYS.group);
  const groupBy: GroupBy =
    groupParam === "difficulty" || groupParam === "category" ? groupParam : "none";

  const groups = useMemo((): Group[] => {
    if (groupBy === "difficulty")
      return DIFFICULTIES.map((d) => ({
        key: d,
        title: d,
        items: filtered.filter((p) => p.difficulty === d),
      }));
    if (groupBy === "category") {
      // A problem is listed under each of its categories; with a category filter, only those groups show.
      const chosen = new Set((params.get(KEYS.category) ?? "").split(",").filter(Boolean));
      return categories
        .filter((c) => !chosen.size || chosen.has(c.id))
        .map((c) => ({
          key: c.id,
          title: c.name,
          items: filtered.filter((p) => p.categories.includes(c.id)),
        }));
    }
    return [{ key: "all", items: filtered }];
  }, [groupBy, filtered, categories, params]);
  const shown = groups.filter((g) => g.items.length);

  const active =
    selected.list.size +
    selected.category.size +
    selected.difficulty.size +
    selected.status.size +
    (query ? 1 : 0);
  const countDone = (items: BrowserProblem[]) => items.filter((p) => done.has(p.slug)).length;

  // Random pick from what the filters show, preferring problems not yet marked done.
  // Opens on leetcode.com in a new tab, like the LeetCode links on problem pages.
  const pickRandom = () => {
    const todo = filtered.filter((p) => !done.has(p.slug));
    const pool = todo.length ? todo : filtered;
    if (!pool.length) return;
    window.open(leetcodeUrl(pool[Math.floor(Math.random() * pool.length)].slug), "_blank", "noopener");
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <aside className="border-fg/10 bg-fg/[0.02] flex flex-col gap-4 rounded-lg border p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:w-72 lg:shrink-0 lg:overflow-y-auto">
        <button
          type="button"
          onClick={pickRandom}
          disabled={!filtered.length}
          title="Open a random problem from the current filters on LeetCode, preferring ones you haven't done"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-amber-500/40 bg-amber-400/15 px-3 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-400/25 disabled:cursor-not-allowed disabled:opacity-40 dark:text-amber-200"
        >
          <Dices size={16} aria-hidden="true" />
          Pick a problem for me
          <span aria-hidden="true">↗</span>
        </button>
        <div className="flex flex-col gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              update(KEYS.q, e.target.value);
            }}
            placeholder="Search by title or number"
            aria-label="Search problems"
            className="border-fg/10 bg-bg/60 placeholder:text-fg/30 h-8 w-full rounded-md border px-3 text-sm focus:border-amber-400/50 focus:outline-none"
          />
          <div className="flex items-center gap-3">
            <span className="text-fg/40 font-mono text-xs">
              {filtered.length} of {problems.length} · {countDone(problems)} done
            </span>
            {active > 0 && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  // Clearing filters keeps the grouping.
                  router.replace(
                    groupBy === "none" ? pathname : `${pathname}?${KEYS.group}=${groupBy}`,
                    {
                      scroll: false,
                    },
                  );
                }}
                className="text-fg/50 hover:text-fg ml-auto text-xs underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
        <FilterRow label="List">
          {lists.map((l) => (
            <Chip key={l.id} on={selected.list.has(l.id)} onClick={() => toggle("list", l.id)}>
              {l.name}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="Difficulty">
          {DIFFICULTIES.map((d) => (
            <Chip
              key={d}
              on={selected.difficulty.has(d)}
              onClick={() => toggle("difficulty", d)}
              onClass={diffStyles[d]}
            >
              {d}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="Status">
          {STATUSES.map((s) => (
            <Chip key={s.id} on={selected.status.has(s.id)} onClick={() => toggle("status", s.id)}>
              {s.name}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="Group by">
          {GROUPS.map((g) => (
            <Chip
              key={g.id}
              on={groupBy === g.id}
              onClick={() => update(KEYS.group, g.id === "none" ? null : g.id)}
            >
              {g.name}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="Category">
          {categories.map((c) => (
            <Chip
              key={c.id}
              on={selected.category.has(c.id)}
              onClick={() => toggle("category", c.id)}
            >
              {c.name}
            </Chip>
          ))}
        </FilterRow>
        {done.size > 0 && (
          <div className="border-fg/10 border-t pt-3">
            <ClearProgress />
          </div>
        )}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {shown.length ? (
          shown.map((g) => (
            <section key={g.key} className="flex flex-col gap-2">
              {g.title && (
                <h3 className="flex items-baseline gap-2 pt-2 text-base font-medium first:pt-0">
                  {g.title}
                  <span className="text-fg/40 font-mono text-xs">
                    {countDone(g.items)}/{g.items.length} done
                  </span>
                </h3>
              )}
              <ProblemTable problems={g.items} showCategories />
            </section>
          ))
        ) : (
          <p className="border-fg/10 text-fg/40 rounded-lg border border-dashed p-6 text-center text-sm">
            No problems match these filters.
          </p>
        )}
      </div>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-fg/40 text-xs tracking-wider uppercase">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({
  on,
  onClick,
  onClass = "border-amber-400/50 bg-amber-400/10 text-amber-800 dark:text-amber-200",
  children,
}: {
  on: boolean;
  onClick: () => void;
  onClass?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "rounded-md border px-2.5 py-1 text-xs transition-colors",
        on ? onClass : "border-fg/10 text-fg/60 hover:border-fg/25 hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}

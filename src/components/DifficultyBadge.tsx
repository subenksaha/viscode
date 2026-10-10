import type { Difficulty } from "@/core/types";
import { cn } from "@/lib/cn";

const styles: Record<Difficulty, string> = {
  Easy: "text-emerald-600 dark:text-emerald-400 bg-emerald-400/10",
  Medium: "text-amber-600 dark:text-amber-400 bg-amber-400/10",
  Hard: "text-red-600 dark:text-red-400 bg-red-400/10",
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className={cn("rounded px-2 py-0.5 text-xs font-medium", styles[difficulty])}>
      {difficulty}
    </span>
  );
}

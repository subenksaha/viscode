import type { CodeToken } from "@/lib/highlight";
import { cn } from "@/lib/cn";

export function CodePanel({ lines, activeLine }: { lines: CodeToken[][]; activeLine: number }) {
  return (
    <pre className="overflow-auto rounded-lg border border-fg/10 bg-code py-3 font-mono text-[13px] leading-6">
      {lines.map((tokens, i) => {
        const active = i + 1 === activeLine;
        return (
          <div
            key={i}
            className={cn(
              "flex border-l-2 border-transparent pr-4 transition-colors",
              active && "border-amber-400 bg-amber-400/10",
            )}
          >
            <span className="w-10 shrink-0 pr-3 text-right text-fg/25 select-none">{i + 1}</span>
            <code>
              {tokens.map((t, j) => (
                <span
                  key={j}
                  className="text-(--l) dark:text-(--d)"
                  style={{ "--l": t.light, "--d": t.dark } as React.CSSProperties}
                >
                  {t.content}
                </span>
              ))}
            </code>
          </div>
        );
      })}
    </pre>
  );
}

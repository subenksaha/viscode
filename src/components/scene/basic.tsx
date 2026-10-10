import type {
  ArrayPanel,
  GridPanel,
  IntervalsPanel,
  ListPanel,
  MapPanel,
  Scalar,
  TextPanel,
  VarsPanel,
} from "@/core/types";
import { cn } from "@/lib/cn";
import { toneBox } from "./tones";

const show = (v: Scalar) => (v === null || v === undefined ? "" : String(v));

function pointersAt(pointers: Record<string, number | null | undefined> = {}, at: number) {
  return Object.entries(pointers)
    .filter(([, p]) => p === at)
    .map(([name]) => name)
    .join(",");
}

export function ArrayView({ panel }: { panel: ArrayPanel }) {
  const { values, tones = {}, pointers, window, indexLabels } = panel;
  const hasPointers = pointers && Object.values(pointers).some((p) => p !== null && p !== undefined);
  return (
    <div className="flex flex-wrap gap-1">
      {values.length === 0 && <span className="text-sm text-fg/30 italic">empty</span>}
      {values.map((v, i) => {
        const inWindow = window && i >= window[0] && i <= window[1];
        const tone = tones[i] ?? (inWindow ? "window" : undefined);
        const text = show(v);
        return (
          <div key={i} className="flex flex-col items-center gap-0.5">
            {indexLabels !== false && (
              <span className="font-mono text-[10px] text-fg/30">{indexLabels?.[i] ?? i}</span>
            )}
            <div
              className={cn(
                "flex h-10 min-w-10 items-center justify-center rounded-md border border-fg/15 bg-fg/5 px-1.5 font-mono text-sm transition-colors duration-200",
                text.length > 4 && "text-xs",
                tone && toneBox[tone],
              )}
            >
              {text}
            </div>
            {hasPointers && (
              <span className="h-4 font-mono text-[11px] text-amber-700 dark:text-amber-300">
                {pointersAt(pointers, i)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function MapView({ panel }: { panel: MapPanel }) {
  const { entries, tones = {} } = panel;
  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.length === 0 && <span className="text-sm text-fg/30 italic">empty</span>}
      {entries.map(([k, v]) => (
        <div
          key={k}
          className={cn(
            "flex overflow-hidden rounded-md border border-fg/15 font-mono text-sm transition-colors",
            tones[k] && toneBox[tones[k]],
          )}
        >
          <span className="bg-fg/10 px-2 py-1">{k}</span>
          {v !== "" && <span className="px-2 py-1 text-fg/70">{v}</span>}
        </div>
      ))}
    </div>
  );
}

export function VarsView({ panel }: { panel: VarsPanel }) {
  const entries = Object.entries(panel.values).filter(([, v]) => v !== undefined);
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-sm">
      {entries.map(([k, v]) => (
        <span key={k} className="text-fg/50">
          {k} = <span className="text-fg">{v === null ? "null" : String(v)}</span>
        </span>
      ))}
    </div>
  );
}

export function GridView({ panel }: { panel: GridPanel }) {
  const { cells, tones = {}, rowLabels, colLabels } = panel;
  return (
    <div className="overflow-auto">
      <table className="border-separate border-spacing-1 font-mono text-sm">
        {colLabels && (
          <thead>
            <tr>
              {rowLabels && <th />}
              {colLabels.map((c, i) => (
                <th key={i} className="px-1 text-[11px] font-normal text-fg/40">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {cells.map((row, r) => (
            <tr key={r}>
              {rowLabels && (
                <th className="pr-1 text-right text-[11px] font-normal text-fg/40">
                  {rowLabels[r]}
                </th>
              )}
              {row.map((v, c) => {
                const tone = tones[`${r},${c}`];
                return (
                  <td
                    key={c}
                    className={cn(
                      "size-9 min-w-9 rounded border border-fg/10 bg-fg/[0.04] text-center transition-colors duration-200",
                      tone && toneBox[tone],
                    )}
                  >
                    {show(v)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ListView({ panel }: { panel: ListPanel }) {
  const { nodes, tones = {}, pointers } = panel;
  const index = new Map(nodes.map((n, i) => [n.id, i]));
  const labelOf = new Map(nodes.map((n) => [n.id, n.label]));
  return (
    <div className="flex flex-wrap items-start gap-y-3">
      {nodes.length === 0 && <span className="text-sm text-fg/30 italic">null</span>}
      {nodes.map((n, i) => {
        const nextIdx = n.next === null ? null : index.get(n.next);
        const after = nodes[i + 1];
        let connector = "";
        if (after && n.next === after.id) connector = "→";
        else if (after && after.next === n.id) connector = "←";
        // Links to a neighbor are drawn as connectors; anything else gets a badge.
        const jump = n.next !== null && nextIdx !== i + 1 && nextIdx !== i - 1;
        return (
          <div key={n.id} className="flex items-start">
            <div className="flex flex-col items-center gap-0.5">
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-full border border-fg/20 bg-fg/5 font-mono text-sm transition-colors duration-200",
                  tones[n.id] && toneBox[tones[n.id]],
                )}
              >
                {n.label}
              </div>
              <span className="h-4 font-mono text-[10px] text-fg/40">
                {n.next === null ? "→ ∅" : jump ? `↪ ${labelOf.get(n.next) ?? "?"}` : ""}
              </span>
              <span className="h-4 font-mono text-[11px] text-amber-700 dark:text-amber-300">
                {pointersAt(pointers, n.id)}
              </span>
            </div>
            {after && (
              <span className="flex h-10 w-7 items-center justify-center text-fg/50">
                {connector}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function IntervalsView({ panel }: { panel: IntervalsPanel }) {
  const { items, tones = {} } = panel;
  if (!items.length) return <span className="text-sm text-fg/30 italic">empty</span>;
  const lo = Math.min(...items.map((i) => i[0]));
  const hi = Math.max(...items.map((i) => i[1]));
  const span = Math.max(1, hi - lo);
  return (
    <div className="flex w-full flex-col gap-1">
      {items.map(([a, b], i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-16 shrink-0 text-right font-mono text-xs text-fg/50">
            [{a},{b}]
          </span>
          <div className="relative h-5 flex-1 rounded bg-fg/[0.03]">
            <div
              className={cn(
                "absolute inset-y-0 min-w-1 rounded border border-fg/25 bg-fg/15 transition-all duration-300",
                tones[i] && toneBox[tones[i]],
              )}
              style={{ left: `${((a - lo) / span) * 100}%`, width: `${((b - a) / span) * 100}%` }}
            />
          </div>
        </div>
      ))}
      <div className="flex justify-between pl-19 font-mono text-[10px] text-fg/30">
        <span>{lo}</span>
        <span>{hi}</span>
      </div>
    </div>
  );
}

export function TextView({ panel }: { panel: TextPanel }) {
  return (
    <pre className="rounded-md bg-fg/5 px-3 py-2 font-mono text-sm break-all whitespace-pre-wrap">
      {panel.text || <span className="text-fg/30 italic">empty</span>}
    </pre>
  );
}

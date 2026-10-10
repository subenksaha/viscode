"use client";

import { motion } from "motion/react";
import type { TreePanel } from "@/core/types";
import { edgeColor, toneSvg } from "./tones";

const GAP_X = 44;
const GAP_Y = 64;
const R = 17;
const PAD = 28;

function layout(panel: TreePanel) {
  const byId = new Map(panel.nodes.map((n) => [n.id, n]));
  const pos = new Map<number, { x: number; y: number }>();
  let cursor = 0;

  if (panel.binary) {
    // In-order index gives x; depth gives y.
    const walk = (id: number | null, depth: number) => {
      if (id === null) return;
      const n = byId.get(id)!;
      walk(n.children[0] ?? null, depth + 1);
      pos.set(id, { x: cursor++, y: depth });
      walk(n.children[1] ?? null, depth + 1);
    };
    walk(panel.root, 0);
  } else {
    // Leaves take consecutive slots; parents center over their children.
    const walk = (id: number, depth: number): number => {
      const kids = byId.get(id)!.children.filter((c): c is number => c !== null);
      const x = kids.length
        ? (() => {
            const xs = kids.map((k) => walk(k, depth + 1));
            return (xs[0] + xs.at(-1)!) / 2;
          })()
        : cursor++;
      pos.set(id, { x, y: depth });
      return x;
    };
    if (panel.root !== null) walk(panel.root, 0);
  }
  return pos;
}

export function TreeView({ panel }: { panel: TreePanel }) {
  if (panel.root === null) return <span className="text-sm text-fg/30 italic">null</span>;
  const pos = layout(panel);
  const xs = [...pos.values()].map((p) => p.x);
  const ys = [...pos.values()].map((p) => p.y);
  const width = (Math.max(...xs) + 1) * GAP_X + PAD;
  const height = (Math.max(...ys) + 1) * GAP_Y;
  const px = (id: number) => pos.get(id)!.x * GAP_X + GAP_X / 2 + PAD / 2;
  const py = (id: number) => pos.get(id)!.y * GAP_Y + R + 6;
  const tones = panel.tones ?? {};
  const pointerLabels = new Map<number, string[]>();
  for (const [name, id] of Object.entries(panel.pointers ?? {}))
    if (id !== null && id !== undefined) pointerLabels.set(id, [...(pointerLabels.get(id) ?? []), name]);
  for (const [id, note] of Object.entries(panel.notes ?? {}))
    pointerLabels.set(Number(id), [...(pointerLabels.get(Number(id)) ?? []), note]);

  return (
    <div className="overflow-auto">
      <svg width={width} height={height} className="max-w-none">
        {panel.nodes.flatMap((n) =>
          n.children
            .filter((c): c is number => c !== null && pos.has(c))
            .map((c) => (
              <motion.line
                key={`${n.id}-${c}`}
                initial={false}
                animate={{ x1: px(n.id), y1: py(n.id), x2: px(c), y2: py(c) }}
                style={{ stroke: edgeColor[tones[c] === "muted" ? "muted" : "default"] }}
                strokeWidth={1.5}
              />
            )),
        )}
        {panel.nodes
          .filter((n) => pos.has(n.id))
          .map((n) => {
            const s = toneSvg[tones[n.id] ?? "default"];
            const ptr = pointerLabels.get(n.id);
            return (
              <motion.g key={n.id} initial={false} animate={{ x: px(n.id), y: py(n.id) }}>
                <circle r={R} strokeWidth={1.5} style={{ fill: s.fill, stroke: s.stroke }} />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ fill: s.text }}
                  className="font-mono text-[12px]"
                >
                  {n.label}
                </text>
                {ptr && (
                  <text
                    y={R + 11}
                    textAnchor="middle"
                    style={{ fill: "var(--pointer)" }}
                    className="font-mono text-[10px]"
                  >
                    {ptr.join(",")}
                  </text>
                )}
              </motion.g>
            );
          })}
      </svg>
    </div>
  );
}

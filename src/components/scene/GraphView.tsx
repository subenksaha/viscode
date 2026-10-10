import type { GraphPanel } from "@/core/types";
import { edgeColor, toneSvg } from "./tones";

const R = 17;

export function GraphView({ panel }: { panel: GraphPanel }) {
  const { nodes, directed, tones = {}, edgeTones = {} } = panel;
  const n = nodes.length;
  if (!n) return <span className="text-sm text-fg/30 italic">empty</span>;

  const radius = n === 1 ? 0 : Math.max(60, n * 15);
  const size = radius * 2 + R * 2 + 16;
  const c = size / 2;
  const pos = new Map(
    nodes.map((node, i) => {
      const a = (2 * Math.PI * i) / n - Math.PI / 2;
      return [node.id, { x: c + radius * Math.cos(a), y: c + radius * Math.sin(a) }];
    }),
  );

  // Undirected graphs often list both directions; draw each pair once.
  const seen = new Set<string>();
  const edges = panel.edges.filter((e) => {
    if (!pos.has(e.from) || !pos.has(e.to)) return false;
    const key = directed ? `${e.from}->${e.to}` : [e.from, e.to].sort().join("--");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const edgeTone = (e: { from: string; to: string }) =>
    edgeTones[`${e.from}->${e.to}`] ?? (directed ? undefined : edgeTones[`${e.to}->${e.from}`]);

  return (
    <svg width={size} height={size} className="max-w-full">
      <defs>
        {Object.entries(edgeColor).map(([tone, color]) => (
          <marker
            key={tone}
            id={`arrow-${tone}`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" style={{ fill: color }} />
          </marker>
        ))}
      </defs>
      {edges.map((e) => {
        const a = pos.get(e.from)!;
        const b = pos.get(e.to)!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const tone = (edgeTone(e) ?? "default") as keyof typeof edgeColor;
        return (
          <line
            key={`${e.from}-${e.to}`}
            x1={a.x + (dx / len) * R}
            y1={a.y + (dy / len) * R}
            x2={b.x - (dx / len) * (R + 2)}
            y2={b.y - (dy / len) * (R + 2)}
            style={{ stroke: edgeColor[tone] }}
            strokeWidth={tone === "default" ? 1.5 : 2.5}
            markerEnd={directed ? `url(#arrow-${tone})` : undefined}
          />
        );
      })}
      {nodes.map((node) => {
        const p = pos.get(node.id)!;
        const s = toneSvg[tones[node.id] ?? "default"];
        return (
          <g key={node.id} transform={`translate(${p.x},${p.y})`}>
            <circle r={R} strokeWidth={1.5} style={{ fill: s.fill, stroke: s.stroke }} />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              style={{ fill: s.text }}
              className="font-mono text-[12px]"
            >
              {node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

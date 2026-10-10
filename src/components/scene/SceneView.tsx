import type { Panel } from "@/core/types";
import {
  ArrayView,
  GridView,
  IntervalsView,
  ListView,
  MapView,
  TextView,
  VarsView,
} from "./basic";
import { GraphView } from "./GraphView";
import { TreeView } from "./TreeView";

function PanelView({ panel }: { panel: Panel }) {
  switch (panel.kind) {
    case "array":
      return <ArrayView panel={panel} />;
    case "map":
      return <MapView panel={panel} />;
    case "vars":
      return <VarsView panel={panel} />;
    case "grid":
      return <GridView panel={panel} />;
    case "tree":
      return <TreeView panel={panel} />;
    case "list":
      return <ListView panel={panel} />;
    case "graph":
      return <GraphView panel={panel} />;
    case "intervals":
      return <IntervalsView panel={panel} />;
    case "text":
      return <TextView panel={panel} />;
  }
}

/** Renders a step's panels top to bottom. Panels are keyed by position + label. */
export function SceneView({ panels }: { panels: Panel[] }) {
  return (
    <div className="flex w-full flex-col gap-5">
      {panels.map((panel, i) => (
        <section key={`${i}-${panel.label ?? panel.kind}`} className="flex flex-col gap-1.5">
          {panel.label && (
            <h3 className="text-[11px] tracking-wider text-fg/40 uppercase">{panel.label}</h3>
          )}
          <PanelView panel={panel} />
        </section>
      ))}
    </div>
  );
}

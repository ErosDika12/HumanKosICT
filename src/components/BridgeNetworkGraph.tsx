import type { BridgeGraph } from "@/lib/data/bridge";

const WIDTH = 640;
const ROW_HEIGHT = 64;
const COMMUNITY_X = WIDTH - 140;
const NEED_X = 140;

/**
 * Inline SVG, server-rendered — no client JS, no charting library. Shows
 * only the communities and needs that appear in an active BRIDGE proposal
 * (never the whole community graph, per the Phase 5 brief's "limit the
 * visual to the most relevant entities"). Every node and edge carries a
 * text label — nothing here is color-only, and the accessible list next to
 * it (BridgePage) is the full non-visual equivalent, not a lesser fallback.
 */
export function BridgeNetworkGraph({ graph }: { graph: BridgeGraph }) {
  const communities = graph.nodes.filter((n) => n.kind === "community");
  const needs = graph.nodes.filter((n) => n.kind === "need");
  const height = Math.max(communities.length, needs.length) * ROW_HEIGHT + 40;

  const positions = new Map<string, { x: number; y: number }>();
  communities.forEach((c, i) => positions.set(c.id, { x: COMMUNITY_X, y: 40 + i * ROW_HEIGHT }));
  needs.forEach((n, i) => positions.set(n.id, { x: NEED_X, y: 40 + i * ROW_HEIGHT }));

  if (graph.nodes.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border bg-surface-muted text-sm text-foreground-muted">
        No active BRIDGE proposals to visualize yet.
      </div>
    );
  }

  return (
    <svg
      role="img"
      aria-label={`BRIDGE network: ${communities.length} communities connected through ${needs.length} community needs. See the list below for the full accessible detail.`}
      viewBox={`0 0 ${WIDTH} ${height}`}
      className="h-auto w-full rounded-xl border border-border bg-surface"
    >
      {graph.edges.map((e, i) => {
        const from = positions.get(e.from);
        const to = positions.get(e.to);
        if (!from || !to) return null;
        return (
          <line
            key={i}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="var(--color-border, #d8d2c4)"
            strokeWidth={2}
          />
        );
      })}
      {needs.map((n) => {
        const pos = positions.get(n.id)!;
        return (
          <g key={n.id}>
            <rect x={pos.x - 90} y={pos.y - 16} width={180} height={32} rx={8} fill="var(--color-accent-tint, #fdf1df)" />
            <text x={pos.x} y={pos.y + 4} textAnchor="middle" fontSize={11} fill="currentColor">
              {truncate(n.label, 26)}
            </text>
          </g>
        );
      })}
      {communities.map((c) => {
        const pos = positions.get(c.id)!;
        return (
          <g key={c.id}>
            <circle cx={pos.x} cy={pos.y} r={26} fill="var(--color-brand-tint, #dce7f5)" />
            <text x={pos.x} y={pos.y + 4} textAnchor="middle" fontSize={10} fill="currentColor">
              {truncate(c.label, 14)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

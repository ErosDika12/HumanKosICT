/**
 * One quiet, ILLUSTRATIVE network in the hero: a few people and two
 * communities joined by soft lines. It expresses the idea of the product and
 * is labelled as an illustration — it does not claim to show real users or
 * real relationships. The slow motion is CSS-only and switched off for
 * visitors who prefer reduced motion.
 */
const NODES: { id: string; x: number; y: number; r: number; kind: "you" | "person" | "community" }[] = [
  { id: "you", x: 200, y: 160, r: 15, kind: "you" },
  { id: "a", x: 92, y: 88, r: 9, kind: "person" },
  { id: "b", x: 70, y: 214, r: 9, kind: "person" },
  { id: "c", x: 318, y: 96, r: 9, kind: "person" },
  { id: "d", x: 336, y: 218, r: 9, kind: "person" },
  { id: "e", x: 200, y: 52, r: 11, kind: "community" },
  { id: "f", x: 214, y: 270, r: 11, kind: "community" },
];

const LINKS: [string, string][] = [
  ["you", "a"],
  ["you", "b"],
  ["you", "c"],
  ["you", "d"],
  ["you", "e"],
  ["you", "f"],
  ["a", "e"],
  ["c", "e"],
  ["b", "f"],
  ["d", "f"],
];

export function HeroNetwork({ caption, alt }: { caption: string; alt: string }) {
  const byId = new Map(NODES.map((n) => [n.id, n]));
  return (
    <figure className="relative mx-auto w-full max-w-[420px]">
      <svg viewBox="0 0 400 320" role="img" aria-label={alt} className="h-auto w-full">
        <defs>
          <radialGradient id="hn-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e0a526" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#e0a526" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="200" cy="160" r="86" fill="url(#hn-glow)" />
        {LINKS.map(([from, to]) => {
          const a = byId.get(from)!;
          const b = byId.get(to)!;
          return <line key={`${from}-${to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="net-line" stroke="rgba(255,255,255,0.35)" strokeWidth="1.25" />;
        })}
        {NODES.map((n, i) => (
          <g key={n.id} className="net-node" style={{ animationDelay: `${i * -1.1}s` }}>
            <circle
              cx={n.x}
              cy={n.y}
              r={n.r}
              fill={n.kind === "you" ? "#e0a526" : n.kind === "community" ? "#6fa1de" : "#ffffff"}
              fillOpacity={n.kind === "person" ? 0.9 : 1}
            />
            {n.kind === "community" && <circle cx={n.x} cy={n.y} r={n.r + 5} fill="none" stroke="#6fa1de" strokeOpacity="0.5" />}
          </g>
        ))}
      </svg>
      <figcaption className="mt-1 text-center text-[11px] uppercase tracking-[0.14em] text-white/55">{caption}</figcaption>
    </figure>
  );
}

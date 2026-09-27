export function DemoBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent-tint px-3 py-1 text-xs font-medium text-accent-strong ${className}`}
      title="All activities, communities, people, and city data on this prototype are fictional demonstration content."
    >
      <span aria-hidden="true">●</span>
      Demonstrim i simuluar — Prishtina 2036
    </span>
  );
}

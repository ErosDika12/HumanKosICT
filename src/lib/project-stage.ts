/**
 * How a neighborhood / BRIDGE project is described to the public. Proposals, work in
 * progress and confirmed outcomes are kept visibly apart, and no impact figure is ever
 * derived or generated — an outcome is "confirmed" only when someone recorded evidence.
 */
export type ProjectStage = "proposed" | "in_progress" | "completed_confirmed" | "completed_unconfirmed";

export function deriveProjectStage(p: {
  status: "ACTIVE" | "COMPLETED";
  startedAt: Date | null;
  completionEvidence: string | null;
}): ProjectStage {
  if (p.status === "COMPLETED") {
    return (p.completionEvidence ?? "").trim() ? "completed_confirmed" : "completed_unconfirmed";
  }
  return p.startedAt ? "in_progress" : "proposed";
}

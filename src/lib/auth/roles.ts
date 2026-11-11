/**
 * Pure role checks shared by the data layer (no `server-only`, so tests can
 * exercise them directly). Permissions are enforced on the server in the data
 * functions themselves — hiding a link in the UI is never the control.
 */
export type RoleName = "MEMBER" | "ORGANIZER" | "MODERATOR" | "MUNICIPALITY_ANALYST";

export interface Actor {
  id: string;
  role: RoleName;
  /** Seeded fictional persona. Never counts as a real authorized partner. */
  isDemoPersona?: boolean;
  isDemoVisitor?: boolean;
}

export class PermissionError extends Error {}

export function assertRole(actor: Actor, ...roles: RoleName[]): void {
  if (!roles.includes(actor.role)) {
    throw new PermissionError(`This action requires one of: ${roles.join(", ")}.`);
  }
}

/**
 * An authorized partner can record municipal acknowledgement or resolution of
 * an issue. Until real partner accounts are onboarded, the only accounts with
 * the analyst role are fictional demo personas, so this is deliberately false
 * for them: a demo account must never make a real report look acknowledged.
 */
export function isAuthorizedPartner(actor: Actor): boolean {
  return actor.role === "MUNICIPALITY_ANALYST" && !actor.isDemoPersona && !actor.isDemoVisitor;
}

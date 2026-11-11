/** Fixed vocabularies and limits for the City area. Pure, shared by server and client. */

export const ISSUE_CATEGORIES = ["road", "lighting", "waste", "water", "green-space", "public-transport", "safety", "misc"] as const;
export type IssueCategory = (typeof ISSUE_CATEGORIES)[number];

export function isIssueCategory(value: unknown): value is IssueCategory {
  return typeof value === "string" && (ISSUE_CATEGORIES as readonly string[]).includes(value);
}

/** Statuses a person may see, in the order a report normally moves. */
export const ISSUE_STATUSES = ["RECEIVED", "UNDER_REVIEW", "DUPLICATE", "DECLINED", "MUNICIPALITY_ACKNOWLEDGED", "RESOLVED"] as const;
export type IssueStatusName = (typeof ISSUE_STATUSES)[number];

/** Statuses only an authorized partner may record (they assert something about the municipality). */
export const PARTNER_ONLY_STATUSES: readonly IssueStatusName[] = ["MUNICIPALITY_ACKNOWLEDGED", "RESOLVED"];

export const MIN_ISSUE_DESCRIPTION = 10;
export const MAX_ISSUES_PER_DAY = 5;
export const MAX_PROPOSALS_PER_DAY = 3;
export const MAX_FOLLOWED_NEIGHBORHOODS = 12;

/** Only http(s) links are ever stored or rendered as links (blocks javascript:, data:, etc.). */
export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

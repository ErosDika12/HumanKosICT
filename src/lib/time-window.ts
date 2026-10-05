/**
 * Date windows ("this week", "this weekend", "next weekend") resolved against
 * the SIMULATED clock — never the real one. Pure (no database, no
 * `server-only`) so Discover, the assistant and the tests all share one
 * definition. Before this module, "weekend" meant "any Saturday or Sunday in
 * the data", so 28–29 June was labelled "Happening this weekend" while the
 * simulated today was Monday 16 June.
 */
import { SIMULATED_NOW_ISO } from "@/lib/simulated-clock";

export type TimeWindow = "week" | "weekend" | "next-weekend" | "weekday";

export const TIME_WINDOWS: readonly TimeWindow[] = ["week", "weekend", "next-weekend", "weekday"];

export function isTimeWindow(value: unknown): value is TimeWindow {
  return typeof value === "string" && (TIME_WINDOWS as readonly string[]).includes(value);
}

const DAY_MS = 86_400_000;

function parseIso(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDaysIso(iso: string, days: number): string {
  return toIso(new Date(parseIso(iso).getTime() + days * DAY_MS));
}

/** 0 = Sunday … 6 = Saturday, for an ISO calendar date. */
export function weekdayOf(iso: string): number {
  return parseIso(iso).getUTCDay();
}

/** The Saturday–Sunday span for a scope, relative to an ISO "today". On a Sunday, "this" is the weekend that is ending. */
export function weekendRange(todayIso: string, scope: "this" | "next"): { from: string; to: string } {
  const dow = weekdayOf(todayIso);
  let saturday: string;
  let sunday: string;
  if (dow === 0) {
    saturday = addDaysIso(todayIso, -1);
    sunday = todayIso;
  } else {
    saturday = addDaysIso(todayIso, (6 - dow + 7) % 7);
    sunday = addDaysIso(saturday, 1);
  }
  if (scope === "next") {
    saturday = addDaysIso(saturday, 7);
    sunday = addDaysIso(sunday, 7);
  }
  return { from: saturday, to: sunday };
}

/** Inclusive date range for a window, or null for "weekday" (a day-of-week rule, not a range). */
export function windowRange(when: TimeWindow, todayIso: string = SIMULATED_NOW_ISO): { from: string; to: string } | null {
  switch (when) {
    case "week":
      return { from: todayIso, to: addDaysIso(todayIso, 6) };
    case "weekend":
      return weekendRange(todayIso, "this");
    case "next-weekend":
      return weekendRange(todayIso, "next");
    case "weekday":
      return null;
  }
}

export function matchesWindow(isoDate: string, when: TimeWindow, todayIso: string = SIMULATED_NOW_ISO): boolean {
  if (when === "weekday") {
    const dow = weekdayOf(isoDate);
    return dow >= 1 && dow <= 5;
  }
  const range = windowRange(when, todayIso)!;
  return isoDate >= range.from && isoDate <= range.to;
}

export const WINDOW_LABEL: Record<"sq" | "en", Record<TimeWindow, string>> = {
  en: { week: "this week", weekend: "this weekend", "next-weekend": "next weekend", weekday: "on a weekday" },
  sq: { week: "këtë javë", weekend: "këtë fundjavë", "next-weekend": "fundjavën tjetër", weekday: "në ditë pune" },
};

export const WINDOW_LABEL_EN: Record<TimeWindow, string> = {
  week: "this week",
  weekend: "this weekend",
  "next-weekend": "next weekend",
  weekday: "on a weekday",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "Sat 21 Jun" — the plain calendar label every card uses. */
export function shortDate(isoDate: string): string {
  const d = parseIso(isoDate);
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/**
 * A relative label that is always true on the simulated clock:
 * "Today", "Tomorrow", "This weekend", "Next weekend", otherwise the plain date.
 * Never calls a past date "upcoming" and never calls a far-off weekend "this weekend".
 */
export function relativeDayLabel(isoDate: string, todayIso: string = SIMULATED_NOW_ISO): string {
  if (isoDate < todayIso) return "Already happened";
  if (isoDate === todayIso) return "Today";
  if (isoDate === addDaysIso(todayIso, 1)) return "Tomorrow";
  if (matchesWindow(isoDate, "weekend", todayIso)) return "This weekend";
  if (matchesWindow(isoDate, "next-weekend", todayIso)) return "Next weekend";
  return shortDate(isoDate);
}

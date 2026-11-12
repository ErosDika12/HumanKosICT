/**
 * The application's notion of "today".
 *
 * Production (and any deployed preview) runs on the REAL clock in Europe/Tirane — Kosovo's civil timezone.
 * Local development and the automated tests run in "fixture mode": a fixed, labeled date inside the
 * fictional 2036 development fixtures (see docs/DEMO_DATA.md) so those fixtures stay internally consistent.
 * Fixture mode can never be active when NODE_ENV is "production".
 *
 * The module keeps its historical name so existing imports keep working; nothing here is simulated in production.
 */
export const TIME_ZONE = "Europe/Tirane";

/** Fixed date used only in fixture mode (development and tests). */
const FIXTURE_TODAY_ISO = "2036-06-16";

export function isFixtureMode(env: Record<string, string | undefined> = process.env): boolean {
  return env.NODE_ENV !== "production" && env.HN_REAL_CLOCK !== "1";
}

export function nowDate(): Date {
  return new Date();
}

/** The calendar date "YYYY-MM-DD" in Europe/Tirane for an instant. */
export function isoDateInTirane(instant: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(instant);
}

export function currentDateIso(): string {
  return isFixtureMode() ? FIXTURE_TODAY_ISO : isoDateInTirane(nowDate());
}

export function isSimulatedPast(isoDate: string): boolean {
  return isoDate < currentDateIso();
}

export function isSimulatedUpcoming(isoDate: string): boolean {
  return isoDate >= currentDateIso();
}

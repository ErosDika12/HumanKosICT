/**
 * KOSOVO 2036 — HUMAN NETWORK runs entirely inside a fictional June 2036
 * Prishtina scenario (see docs/DEMO_DATA.md). The real wall-clock date this
 * app happens to run on is always years before 2036, so comparing a seeded
 * activity's date against `new Date()` would make every single seeded
 * activity look permanently upcoming — any feature that depends on "has
 * this already happened" (event check-in / organizer-confirmed attendance,
 * a past-event banner, the Impact page's attended-vs-upcoming split) would
 * show empty, undemoable results forever. That's not a real feature gap,
 * it's a date-math trap — so this module fixes a single, clearly-labeled
 * "today" inside the fictional scenario instead.
 *
 * SIMULATED_NOW_ISO is NOT the real date and is never presented as one. It
 * is surfaced in the UI (see SimulatedClockNote, rendered in the footer on
 * every page) specifically so nobody mistakes it for live data — the user
 * explicitly asked for a "clearly labeled simulation date rather than
 * silently showing empty results," and this is that label.
 *
 * Every "is this activity in the past / upcoming?" comparison in this app
 * goes through this module, not `new Date()` directly, so the scenario
 * stays internally consistent. Chosen so the 6 seeded activities split
 * meaningfully: 2036-06-13 (×2) and 2036-06-14 have already happened;
 * 2036-06-17, 2036-06-20, and 2036-06-21 are still upcoming — enough real
 * fixtures for both the check-in/attendance/Impact journey (needs past
 * events) and the RSVP/cancel journey (needs upcoming ones) to work in the
 * same demo without contradicting each other.
 */
export const SIMULATED_NOW_ISO = "2036-06-16";

export const SIMULATED_NOW_LABEL = "Monday, 16 June 2036";

export function isSimulatedPast(isoDate: string): boolean {
  return isoDate < SIMULATED_NOW_ISO;
}

export function isSimulatedUpcoming(isoDate: string): boolean {
  return isoDate >= SIMULATED_NOW_ISO;
}

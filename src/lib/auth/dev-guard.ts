/**
 * Pulled out of src/lib/auth/actions.ts so it can be unit-tested without
 * pulling in next/navigation's module graph (which requires a real Next.js
 * runtime to import, not just to call). devLoginAction calls this before
 * touching cookies, the database, or redirect() — see docs/PHASE_STATUS.md
 * Phase 2 exit criteria ("the dev-only demo switcher cannot authorize a
 * production request").
 */
export function assertNotProduction(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("The development persona switcher is disabled in production.");
  }
}

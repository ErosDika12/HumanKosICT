/**
 * Next.js signals redirects, notFound() and dynamic-rendering bailouts (from
 * cookies()/headers()) by throwing. A `catch` that handles ordinary failures
 * must let those keep propagating — `unstable_rethrow` does exactly that.
 *
 * It is loaded lazily because the plain-Node unit-test runner cannot resolve
 * `next/navigation` (Next's bundler picks its server build; Node does not).
 * Under Next the import always succeeds; in unit tests there is no Next
 * control flow to preserve, so a failed import simply returns.
 */
export async function rethrowNextControlFlow(err: unknown): Promise<void> {
  let rethrow: ((e: unknown) => void) | undefined;
  try {
    ({ unstable_rethrow: rethrow } = await import("next/navigation"));
  } catch {
    return;
  }
  rethrow?.(err);
}

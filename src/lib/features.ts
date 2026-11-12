import { isFixtureMode } from "@/lib/simulated-clock";

/**
 * Features built on the fictional development fixtures. They are off in production until they can run
 * on real data between real, authorized accounts; they remain available in local development and tests.
 */
export function assistantEnabled(): boolean {
  return isFixtureMode();
}

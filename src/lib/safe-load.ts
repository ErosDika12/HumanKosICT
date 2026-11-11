/**
 * Optional data must never take a public page down. `safeLoad` runs a loader
 * and reports success or failure instead of throwing, so a page can render
 * everything it still has and show an honest "unavailable" state for the rest.
 *
 * Only the error's name/code is logged (never the message or connection
 * details, which can contain hostnames or user names).
 */
export type Loaded<T> = { ok: true; data: T } | { ok: false; data: T };

export async function safeLoad<T>(label: string, load: () => Promise<T>, fallback: T): Promise<Loaded<T>> {
  try {
    return { ok: true, data: await load() };
  } catch (err) {
    const e = err as { name?: string; code?: string };
    console.error(`[safeLoad] ${label} failed: ${e?.name ?? "Error"}${e?.code ? ` (${e.code})` : ""}`);
    return { ok: false, data: fallback };
  }
}

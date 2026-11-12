/**
 * Production content boundary.
 *
 * The database still contains the fictional 2036 development fixtures (seeded personas, communities,
 * activities, needs, projects, bridge proposals, synthetic municipal demand, "demo friends"). They are
 * kept as fixtures but must never reach a real visitor. Instead of trusting every query in the app to
 * remember a filter, this Prisma extension adds the exclusion to every read at the single client the whole
 * app shares. Real accounts and everything they created are untouched, and staff sign-in still works
 * (staff personas are looked up by email, and only `isDemoFriend` users are hidden).
 *
 * Nested reads through `include` follow relations from rows that already passed the filter, so a real
 * person's own records stay readable.
 */
type Where = Record<string, unknown>;

const FIXTURE_ORGANIZER: Where = { organizer: { isDemoPersona: false } };

/** Per-model "real content only" conditions, keyed by Prisma delegate name. */
export const REAL_CONTENT_FILTERS: Record<string, Where> = {
  activity: FIXTURE_ORGANIZER,
  community: FIXTURE_ORGANIZER,
  communityNeed: { submittedBy: { isDemoPersona: false } },
  project: { community: FIXTURE_ORGANIZER },
  bridgeProposal: { communityA: FIXTURE_ORGANIZER },
  // Purely synthetic planning numbers: nothing in this table is real.
  municipalityScenarioDemand: { id: "__no-real-rows__" },
  // Fictional friends can never be found, befriended, invited or messaged.
  user: { isDemoFriend: false },
};

const FILTERED_OPERATIONS = new Set([
  "findMany",
  "findFirst",
  "findFirstOrThrow",
  "findUnique",
  "findUniqueOrThrow",
  "count",
  "aggregate",
  "groupBy",
  "updateMany",
  "deleteMany",
]);
const UNIQUE_OPERATIONS = new Set(["findUnique", "findUniqueOrThrow"]);

export function addRealContentFilter(operation: string, args: unknown, filter: Where): unknown {
  if (!FILTERED_OPERATIONS.has(operation)) return args;
  const a = (args ?? {}) as { where?: Where };
  const where = a.where;
  if (!where) return { ...a, where: filter };
  if (UNIQUE_OPERATIONS.has(operation)) {
    // Unique lookups keep their unique key at the top level; the filter rides along in AND.
    const existing = where.AND === undefined ? [] : Array.isArray(where.AND) ? where.AND : [where.AND];
    return { ...a, where: { ...where, AND: [...existing, filter] } };
  }
  return { ...a, where: { AND: [where, filter] } };
}

/** Wrap a Prisma client so every read excludes fictional fixtures. */
export function withRealContentFilter<T extends object>(client: T): T {
  const query: Record<string, unknown> = {};
  for (const [model, filter] of Object.entries(REAL_CONTENT_FILTERS)) {
    query[model] = {
      async $allOperations({ operation, args, query: run }: { operation: string; args: unknown; query: (a: unknown) => Promise<unknown> }) {
        return run(addRealContentFilter(operation, args, filter));
      },
    };
  }
  const extendable = client as unknown as { $extends: (ext: unknown) => unknown };
  return extendable.$extends({ query }) as T;
}

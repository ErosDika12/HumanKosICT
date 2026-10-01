import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient as PostgresPrismaClient } from "@/generated/prisma-postgres";
import { PrismaPg } from "@prisma/adapter-pg";
import { pgSslOptions } from "@/lib/db-ssl";

/**
 * Server-only Prisma singleton. Next.js dev reloads modules on every edit;
 * without caching the client on `globalThis` each reload opens a new SQLite
 * connection until the file handle limit is hit.
 *
 * Two providers, two generated clients (see docs/ARCHITECTURE.md
 * "Database"): local dev keeps using the SQLite client generated from
 * prisma/schema.prisma; a deployed environment's DATABASE_URL is a
 * postgres(ql):// URL, which selects the PostgreSQL client generated from
 * prisma/schema.production.prisma instead. Both are structurally identical
 * (same models), so the rest of the app imports `{ prisma }` from here and
 * never needs to know which one is live.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Supabase's pooler listens on 5432 in SESSION mode (one upstream connection
 * per client, hard-capped at pool_size — "EMAXCONNSESSION" in production logs)
 * and on 6543 in TRANSACTION mode (connections are shared between clients).
 * Serverless instances multiply clients, so the runtime uses transaction mode.
 * Migrations and seeding still use DATABASE_URL as given (see
 * prisma.production.config.ts). Set DATABASE_POOL_MODE=session to opt out.
 */
export function runtimeConnectionString(url: string, env: Record<string, string | undefined> = process.env): string {
  if (env.DATABASE_POOL_MODE === "session") return url;
  try {
    const parsed = new URL(url);
    if (/\.pooler\.supabase\.com$/.test(parsed.hostname) && (parsed.port === "" || parsed.port === "5432")) {
      parsed.port = "6543";
      return parsed.toString();
    }
  } catch {
    // fall through to the original string; the driver reports the real error
  }
  return url;
}

function createClient() {
  const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  const logLevels = (process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]) as
    | ["warn", "error"]
    | ["error"];

  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
    const connectionString = runtimeConnectionString(url);
    const adapter = new PrismaPg({
      connectionString,
      ssl: pgSslOptions(connectionString),
      // Small pool per serverless instance — the pooler in front of Postgres has a limited client budget.
      max: Number(process.env.DATABASE_POOL_MAX) || 3,
      idleTimeoutMillis: 5_000,
      connectionTimeoutMillis: 8_000,
    });
    const client = new PostgresPrismaClient({ adapter, log: logLevels });
    return client as unknown as PrismaClient;
  }

  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter, log: logLevels });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

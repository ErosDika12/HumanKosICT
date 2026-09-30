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

function createClient() {
  const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  const logLevels = (process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]) as
    | ["warn", "error"]
    | ["error"];

  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
    const adapter = new PrismaPg({
      connectionString: url,
      ssl: pgSslOptions(url),
      // Small pool per serverless instance — the pooler in front of Postgres has a limited client budget.
      max: Number(process.env.DATABASE_POOL_MAX) || 4,
      idleTimeoutMillis: 10_000,
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

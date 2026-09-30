import { PrismaClient } from "../src/generated/prisma-postgres";
import { PrismaPg } from "@prisma/adapter-pg";
import { pgSslOptions } from "../src/lib/db-ssl";
import type { PrismaClient as SqlitePrismaClient } from "@prisma/client";
import { seedDatabase } from "./seed-lib";

// Postgres counterpart to seed.ts — same fictional demo data
// (seedDatabase is provider-agnostic, see seed-lib.ts), run against the
// generated PostgreSQL client instead of the SQLite one.
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required to seed the production database.");
  const adapter = new PrismaPg({ connectionString: url, ssl: pgSslOptions(url) });
  const prisma = new PrismaClient({ adapter });
  try {
    // Structurally identical to the SQLite-generated client (same schema
    // models) — cast only because seedDatabase's type comes from that
    // client for local-dev typing convenience; see prisma/seed-lib.ts.
    await seedDatabase(prisma as unknown as SqlitePrismaClient);
    console.log("Production seed complete.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

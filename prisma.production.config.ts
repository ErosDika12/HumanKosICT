import { defineConfig } from "prisma/config";

// Production (PostgreSQL) counterpart to prisma.config.ts — see
// prisma/schema.production.prisma for why this is a separate file rather
// than a provider switch in the same schema. Used only via
// `--config prisma.production.config.ts` (the db:*:prod npm scripts and the
// Vercel build's postinstall step); local `npm run dev`/`db:migrate` never
// touch this file and keep using SQLite.
import { loadEnvFile } from "node:process";
try {
  loadEnvFile(".env.local");
} catch {
  // .env.local is optional — production supplies DATABASE_URL via Vercel env vars.
}

import { resolve } from "node:path";

/**
 * Migrations connect with the certificate FULLY VERIFIED: sslmode=require plus
 * the provider's root CA (certs/, a public certificate — not a secret). Never
 * put sslmode=no-verify / accept_invalid_certs in DATABASE_URL.
 */
function withVerifiedTls(raw: string): string {
  if (!/^postgres(ql)?:\/\//.test(raw)) return raw;
  const url = new URL(raw);
  if (!url.searchParams.has("sslmode")) url.searchParams.set("sslmode", "require");
  if (/\.supabase\.(com|co)$/.test(url.hostname) && !url.searchParams.has("sslcert")) {
    url.searchParams.set("sslcert", resolve("certs/supabase-prod-ca-2021.crt"));
  }
  return url.toString();
}

export default defineConfig({
  schema: "prisma/schema.production.prisma",
  datasource: {
    url: withVerifiedTls(process.env.DATABASE_URL ?? ""),
  },
  migrations: {
    path: "prisma/migrations-postgres",
    seed: "tsx prisma/seed.production.ts",
  },
});

import { defineConfig } from "prisma/config";

// Prisma ORM 7 moved connection config out of schema.prisma into this file
// (see docs/ARCHITECTURE.md "Database"). DATABASE_URL is read from
// .env.local in development (Next.js loads it automatically for the app;
// the Prisma CLI needs it loaded explicitly here).
import { loadEnvFile } from "node:process";
try {
  loadEnvFile(".env.local");
} catch {
  // .env.local is optional (e.g. CI supplies DATABASE_URL directly).
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});

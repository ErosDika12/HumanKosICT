import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored MapLibre worker scripts copied verbatim from node_modules —
    // see scripts/copy-maplibre-worker.mjs.
    "public/maplibre-gl-worker.mjs",
    "public/maplibre-gl-shared.mjs",
    // Generated Prisma client (PostgreSQL) — see prisma/schema.production.prisma.
    "src/generated/**",
  ]),
]);

export default eslintConfig;

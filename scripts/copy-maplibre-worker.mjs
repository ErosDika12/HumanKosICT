// Copies MapLibre GL's worker script into public/ so it is servable as a
// static asset. Required because bundlers rewrite import.meta.url and break
// MapLibre's default relative worker lookup — see docs/ARCHITECTURE.md and
// src/components/ActivityMap.tsx.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = join(root, "node_modules", "maplibre-gl", "dist");
const destDir = join(root, "public");

// The worker script imports a sibling chunk at a relative URL ("./maplibre-gl-shared.mjs").
// The browser resolves that relative to the worker's own served URL, so both
// files must be copied together and kept side by side in public/.
const files = ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"];

if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });

for (const file of files) {
  const src = join(distDir, file);
  if (!existsSync(src)) {
    console.warn("[copy-maplibre-worker] source file not found, skipping:", src);
    continue;
  }
  copyFileSync(src, join(destDir, file));
  console.log(`[copy-maplibre-worker] copied ${file} into public/`);
}

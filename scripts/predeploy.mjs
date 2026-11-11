// Runs before `next build` on Vercel. Applies reviewed, non-destructive
// migrations (`prisma migrate deploy` never resets data) and nothing else —
// it does NOT seed. Demo data is loaded deliberately with `npm run db:seed:prod`.
//
// A database that is merely unreachable (paused project, outage) must not block
// a deploy: the app degrades gracefully without it. Any other failure — a
// migration that errors, a bad schema — still fails the build.
import { spawnSync } from "node:child_process";

const UNREACHABLE = /ENOTFOUND|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|P1001|P1002|P1017|Can't reach database server|tenant\/user .* not found/i;

if (!process.env.DATABASE_URL) {
  console.warn("[predeploy] DATABASE_URL is not set — skipping migrations.");
  process.exit(0);
}

// Fixed command, no user input — shell:true only so npx resolves on Windows too.
const result = spawnSync("npx prisma migrate deploy --config prisma.production.config.ts", {
  encoding: "utf8",
  env: process.env,
  shell: true,
});
if (result.error) console.error("[predeploy] could not run prisma:", result.error.name);
process.stdout.write(result.stdout ?? "");
process.stderr.write(result.stderr ?? "");

if (result.status === 0) process.exit(0);

if (UNREACHABLE.test(`${result.stdout}\n${result.stderr}`)) {
  console.warn(
    "[predeploy] Database unreachable — migrations NOT applied. Continuing the build; " +
      "run `npm run db:migrate:prod` once the database is back."
  );
  process.exit(0);
}
console.error("[predeploy] Migration failed — failing the build.");
process.exit(result.status ?? 1);

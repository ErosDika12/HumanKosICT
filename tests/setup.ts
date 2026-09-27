// Loaded via `node --import ./tests/setup.ts` before any test file's own
// imports run (see package.json "test" script), so src/lib/prisma.ts picks
// up the test database instead of the dev one.
process.env.DATABASE_URL = "file:./prisma/test.db";

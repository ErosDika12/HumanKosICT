import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Liveness + database reachability for uptime checks. Reports status only —
 * never connection strings, hostnames or error messages.
 */
export async function GET() {
  let database: "ok" | "unavailable" = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = "unavailable";
  }
  return Response.json(
    { app: "ok", database },
    { status: database === "ok" ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}

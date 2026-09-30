import { SUPABASE_ROOT_CA_PEM } from "./supabase-ca";

/**
 * TLS options for the PostgreSQL driver. Certificates are ALWAYS verified:
 * there is deliberately no "skip verification" mode. For Supabase the
 * published root CA is supplied; other providers use the system trust store,
 * or a PEM in DATABASE_SSL_CA. A plain-text local database can opt out with
 * DATABASE_SSL=disable (localhost only).
 */
export function pgSslOptions(connectionString: string): false | { ca?: string; rejectUnauthorized: true } {
  let host = "";
  try {
    host = new URL(connectionString).hostname;
  } catch {
    return { rejectUnauthorized: true };
  }
  if (process.env.DATABASE_SSL === "disable") {
    if (host === "localhost" || host === "127.0.0.1") return false;
    throw new Error("DATABASE_SSL=disable is only allowed for localhost databases.");
  }
  if (process.env.DATABASE_SSL_CA) return { ca: process.env.DATABASE_SSL_CA, rejectUnauthorized: true };
  if (/\.supabase\.(com|co)$/.test(host)) return { ca: SUPABASE_ROOT_CA_PEM, rejectUnauthorized: true };
  return { rejectUnauthorized: true };
}

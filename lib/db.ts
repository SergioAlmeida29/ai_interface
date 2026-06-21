import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const g = globalThis as unknown as { _prisma?: PrismaClient };

function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  // Strip query params — sslmode=require in pg v8+ means verify-full,
  // which rejects Supabase's certificate chain. We add ssl manually instead.
  const baseUrl = url.split("?")[0];
  const pool = new pg.Pool({ connectionString: baseUrl, ssl: { rejectUnauthorized: false } });
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

// Lazy proxy: the PrismaClient is only instantiated on the first DB call
// (inside a request handler), not at module-evaluation time during build.
let _instance: PrismaClient | undefined;

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!_instance) {
      _instance = g._prisma ?? createClient();
      if (process.env.NODE_ENV !== "production") g._prisma = _instance;
    }
    return (_instance as unknown as Record<string | symbol, unknown>)[prop];
  },
});

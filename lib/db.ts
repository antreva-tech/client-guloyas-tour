import { PrismaClient } from "@prisma/client";

/**
 * When only DATABASE_URL is set (e.g. Neon single URL), derive DIRECT_URL for schema.
 * Neon pooled host has "-pooler."; unpooled is same URL with that removed.
 */
if (!process.env.DIRECT_URL && process.env.DATABASE_URL?.includes("-pooler")) {
  process.env.DIRECT_URL = process.env.DATABASE_URL.replace(/-pooler\./, ".");
}

/**
 * Prisma client singleton for database access.
 * Prevents multiple instances in development due to hot reloading.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Database client instance.
 * Reuses existing client in development to avoid connection exhaustion.
 */
export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

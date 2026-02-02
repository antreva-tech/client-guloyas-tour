import { PrismaClient } from "@prisma/client";

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

// Prisma configuration for Retail Web Dashboard Template
// Migrations need unpooled URL. Uses DIRECT_URL if set; else derives from DATABASE_URL (Neon: remove -pooler from host).
import path from "node:path";
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env from project root so Prisma sees DATABASE_URL
config({ path: path.resolve(process.cwd(), ".env") });

const databaseUrl = process.env.DATABASE_URL;
const explicitDirect = process.env.DIRECT_URL;
// Neon gives one URL (pooled). Unpooled = same URL with "-pooler." removed from host (for migrations).
const directUrl =
  explicitDirect ||
  (databaseUrl?.replace(/-pooler\./, ".") ?? databaseUrl);
const isPlaceholder =
  !directUrl || directUrl.includes("host:5432") || directUrl.includes("/dbname");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: isPlaceholder ? databaseUrl ?? "file:./placeholder.db" : directUrl,
  },
});

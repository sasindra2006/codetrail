import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL?.trim();

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  ...(connectionString ? { dbCredentials: { url: connectionString } } : {}),
});

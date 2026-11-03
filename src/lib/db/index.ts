import "server-only";

import mysql from "mysql2/promise";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import * as schema from "./schema";

type Database = MySql2Database<typeof schema>;

const globalForDatabase = globalThis as typeof globalThis & {
  codetrailMysqlPool?: mysql.Pool;
  codetrailDatabase?: Database;
};

export function getDatabase(): Database {
  if (globalForDatabase.codetrailDatabase) return globalForDatabase.codetrailDatabase;

  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("Database is not configured. Set DATABASE_URL on the server.");
  }

  const pool = globalForDatabase.codetrailMysqlPool ?? mysql.createPool(connectionString);
  globalForDatabase.codetrailMysqlPool = pool;
  const database = drizzle({ client: pool, schema, mode: "default" });
  globalForDatabase.codetrailDatabase = database;
  return database;
}

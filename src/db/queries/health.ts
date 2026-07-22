import type Database from "better-sqlite3";

export interface DatabaseHealth { ok: true; migrationCount: number; }

export function getDatabaseHealth(database: Database.Database): DatabaseHealth {
  const result = database.prepare("SELECT COUNT(*) AS count FROM schema_migrations").get() as { count: number };
  return { ok: true, migrationCount: result.count };
}

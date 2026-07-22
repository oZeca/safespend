import type Database from "better-sqlite3";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const MIGRATION_PATTERN = /^(\d{4})_[a-z0-9_]+\.sql$/;

export interface MigrationResult { applied: string[]; }

export function runMigrations(database: Database.Database, migrationsDirectory = path.join(process.cwd(), "src", "db", "migrations")): MigrationResult {
  database.exec("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, applied_at TEXT NOT NULL)");
  const files = readdirSync(migrationsDirectory).filter((file) => MIGRATION_PATTERN.test(file)).sort();
  const appliedVersions = new Set(database.prepare("SELECT version FROM schema_migrations").pluck().all() as number[]);
  const applied: string[] = [];

  for (const file of files) {
    const match = MIGRATION_PATTERN.exec(file);
    if (!match) continue;
    const version = Number(match[1]);
    if (appliedVersions.has(version)) continue;
    const sql = readFileSync(path.join(migrationsDirectory, file), "utf8");
    database.transaction(() => {
      database.exec(sql);
      database.prepare("INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)").run(version, file, new Date().toISOString());
    })();
    applied.push(file);
  }
  return { applied };
}

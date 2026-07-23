import type Database from "better-sqlite3";
import { readdirSync } from "node:fs";
import path from "node:path";
import { openDatabase } from "@/db/connection";
import { runMigrations } from "@/db/migrate";

const MIGRATION_PATTERN = /^(\d{4})_[a-z0-9_]+\.sql$/;
const REQUIRED_TABLES = ["accounts", "categories", "transactions", "settings", "schema_migrations"];

export async function createDatabaseBackup(database: Database.Database, destination: string) {
  return database.backup(destination);
}

export function validateAndMigrateRestoreCandidate(candidatePath: string, migrationsDirectory = path.join(process.cwd(), "src", "db", "migrations")) {
  const currentVersions = readdirSync(migrationsDirectory).map((file) => MIGRATION_PATTERN.exec(file)).filter((match): match is RegExpExecArray => Boolean(match)).map((match) => Number(match[1]));
  const currentMaximum = Math.max(...currentVersions);
  const database = openDatabase(candidatePath);
  try {
    const integrity = database.pragma("integrity_check", { simple: true });
    if (integrity !== "ok") throw new Error("The uploaded database failed SQLite integrity checks.");
    const hasMigrations = database.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations'").get();
    if (!hasMigrations) throw new Error("The uploaded database is not a SafeSpend backup.");
    const futureVersion = database.prepare("SELECT MAX(version) FROM schema_migrations").pluck().get() as number | null;
    if (futureVersion !== null && futureVersion > currentMaximum) throw new Error("This backup was created by a newer SafeSpend version.");
    runMigrations(database, migrationsDirectory);
    const tables = new Set(database.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").pluck().all() as string[]);
    if (REQUIRED_TABLES.some((table) => !tables.has(table))) throw new Error("The uploaded database is missing required SafeSpend tables.");
    const finalIntegrity = database.pragma("integrity_check", { simple: true });
    if (finalIntegrity !== "ok") throw new Error("The migrated backup failed SQLite integrity checks.");
    const migrationCount = database.prepare("SELECT COUNT(*) FROM schema_migrations").pluck().get() as number;
    database.pragma("wal_checkpoint(TRUNCATE)");
    return { migrationCount };
  } finally {
    database.close();
  }
}

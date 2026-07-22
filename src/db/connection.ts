import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";

const DEFAULT_DATABASE_PATH = path.join(process.cwd(), "data", "safespend.db");

export function resolveDatabasePath(databasePath = process.env.DATABASE_PATH): string {
  return path.resolve(databasePath || DEFAULT_DATABASE_PATH);
}

export function openDatabase(databasePath?: string): Database.Database {
  const resolvedPath = resolveDatabasePath(databasePath);
  mkdirSync(path.dirname(resolvedPath), { recursive: true });
  const database = new Database(resolvedPath);
  database.pragma("journal_mode = WAL");
  database.pragma("synchronous = NORMAL");
  database.pragma("foreign_keys = ON");
  database.pragma("busy_timeout = 5000");
  return database;
}

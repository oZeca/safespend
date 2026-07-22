import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openDatabase } from "./connection";
import { runMigrations } from "./migrate";
import { getDatabaseHealth } from "./queries/health";

const directories: string[] = [];
afterEach(() => { for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }); });

describe("database foundation", () => {
  it("applies migrations idempotently and supports a repository query", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "safespend-"));
    directories.push(directory);
    const database = openDatabase(path.join(directory, "test.db"));
    try {
      expect(runMigrations(database).applied).toEqual(["0001_initial_schema.sql", "0002_accounts_indexes.sql"]);
      expect(runMigrations(database).applied).toEqual([]);
      expect(getDatabaseHealth(database)).toEqual({ ok: true, migrationCount: 2 });
      expect(database.pragma("journal_mode", { simple: true })).toBe("wal");
      expect(database.pragma("foreign_keys", { simple: true })).toBe(1);
      expect(database.pragma("synchronous", { simple: true })).toBe(1);
      expect(database.pragma("busy_timeout", { simple: true })).toBe(5000);
      const tables = database.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").pluck().all();
      expect(tables).toContain("transactions");
    } finally { database.close(); }
  });
});

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
      expect(runMigrations(database).applied).toEqual(["0001_initial_schema.sql", "0002_accounts_indexes.sql", "0003_default_categories.sql", "0004_csv_import_staging.sql", "0005_categorization_rules.sql", "0006_transfers_and_splits.sql", "0007_forecast_indexes_and_defaults.sql", "0008_release_settings.sql", "0009_import_selection_and_duplicate_detection.sql", "0010_import_row_selection.sql"]);
      expect(runMigrations(database).applied).toEqual([]);
      expect(getDatabaseHealth(database)).toEqual({ ok: true, migrationCount: 10 });
      expect(database.pragma("journal_mode", { simple: true })).toBe("wal");
      expect(database.pragma("foreign_keys", { simple: true })).toBe(1);
      expect(database.pragma("synchronous", { simple: true })).toBe(1);
      expect(database.pragma("busy_timeout", { simple: true })).toBe(5000);
      const tables = database.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").pluck().all();
      expect(tables).toContain("transactions");
      expect(tables).toContain("import_rows");
      expect((database.prepare("SELECT COUNT(*) AS count FROM categories").get() as { count: number }).count).toBe(16);
      expect(database.prepare("SELECT value_json FROM settings WHERE key = 'minimum_cash_buffer_cents'").pluck().get()).toBe("0");
      expect(database.prepare("SELECT value_json FROM settings WHERE key = 'default_currency'").pluck().get()).toBe('"EUR"');
    } finally { database.close(); }
  });
});

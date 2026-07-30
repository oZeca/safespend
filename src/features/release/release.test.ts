import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openDatabase } from "@/db/connection";
import { seedDemoData } from "@/db/demo-seed";
import { runMigrations } from "@/db/migrate";
import { createAccountRepository } from "@/features/accounts/repository";
import { createTransactionRepository } from "@/features/transactions/repository";
import { createTransferRepository } from "@/features/transfers/repository";
import { createDatabaseBackup, validateAndMigrateRestoreCandidate } from "./backup";
import { exportTransactionsCsv } from "./csv-export";
import { hasSqliteHeader, restoreConfirmationSchema, validDatabaseFileName } from "./validation";

const directories: string[] = [];
afterEach(() => { for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }); });

function temporaryDirectory() {
  const directory = mkdtempSync(path.join(tmpdir(), "safespend-release-"));
  directories.push(directory);
  return directory;
}

describe("backup and restore validation", () => {
  it("creates a consistent SQLite snapshot and accepts a compatible backup", async () => {
    const directory = temporaryDirectory();
    const database = openDatabase(path.join(directory, "source.db"));
    try {
      runMigrations(database);
      database.prepare(`INSERT INTO accounts (id, name, account_type, currency, current_balance_cents, included_in_available_cash, included_in_net_worth, is_archived, created_at, updated_at)
        VALUES ('backup-account', 'Backup account', 'current', 'EUR', 12345, 1, 1, 0, '2026-07-23T00:00:00.000Z', '2026-07-23T00:00:00.000Z')`).run();
      const destination = path.join(directory, "backup.db");
      await createDatabaseBackup(database, destination);
      expect(hasSqliteHeader(readFileSync(destination))).toBe(true);
      expect(validateAndMigrateRestoreCandidate(destination)).toEqual({ migrationCount: 12 });
      const restored = openDatabase(destination);
      try { expect(restored.prepare("SELECT name FROM accounts WHERE id = 'backup-account'").pluck().get()).toBe("Backup account"); }
      finally { restored.close(); }
    } finally { database.close(); }
  });

  it("rejects confirmation mistakes, invalid files, and future database versions", async () => {
    expect(restoreConfirmationSchema.safeParse("restore").success).toBe(false);
    expect(restoreConfirmationSchema.safeParse("RESTORE").success).toBe(true);
    expect(validDatabaseFileName("backup.db")).toBe(true);
    expect(validDatabaseFileName("safespend.pre-restore-2026-07-23.db")).toBe(true);
    expect(validDatabaseFileName("backup.csv")).toBe(false);
    expect(hasSqliteHeader(new TextEncoder().encode("not sqlite"))).toBe(false);
    const directory = temporaryDirectory();
    const database = openDatabase(path.join(directory, "future.db"));
    runMigrations(database);
    database.prepare("INSERT INTO schema_migrations (version, name, applied_at) VALUES (9999, '9999_future.sql', ?)").run(new Date().toISOString());
    database.close();
    expect(() => validateAndMigrateRestoreCandidate(path.join(directory, "future.db"))).toThrow("newer SafeSpend version");
  });
});

describe("release exports and demo seed", () => {
  it("exports exact decimal amounts, CSV escaping, splits, flags, and transfer context", () => {
    const directory = temporaryDirectory();
    const database = openDatabase(path.join(directory, "export.db")); runMigrations(database);
    try {
      let accountId = 0;
      const accounts = createAccountRepository(database, { id: () => `export-account-${++accountId}`, now: () => new Date("2026-07-23T00:00:00.000Z") });
      const current = accounts.create({ name: "Current, EUR", institution: null, accountType: "current", currency: "EUR", currentBalanceCents: 0, includedInAvailableCash: true, includedInNetWorth: true });
      let transactionId = 0;
      const transactions = createTransactionRepository(database, { id: () => `export-transaction-${++transactionId}`, now: () => new Date("2026-07-23T00:00:00.000Z") });
      const transaction = transactions.create({ accountId: current.id, date: "2026-07-23", description: "Shop \"quoted\", line", merchant: "Merchant, Ltd", amountCents: -12345, transactionType: "expense", categoryId: "category-shopping", notes: "one\ntwo", isExceptional: true, excludedFromAccountBalance: true });
      let splitId = 0;
      createTransferRepository(database, { id: () => `export-split-${++splitId}`, now: () => new Date("2026-07-23T00:00:00.000Z") }).replaceSplits(transaction.id, [
        { categoryId: "category-shopping", amountCents: -10000, notes: "Main" },
        { categoryId: "category-groceries", amountCents: -2345, notes: null }
      ]);
      const csv = exportTransactionsCsv(database);
      expect(csv).toContain('"Current, EUR"');
      expect(csv).toContain('"Shop ""quoted"", line"');
      expect(csv).toContain("-123.45");
      expect(csv).toContain('""amount"":""-100.00""');
      expect(csv).toContain(",0,1,0,1,");
      expect(csv).toContain('"one\ntwo"');
    } finally { database.close(); }
  });

  it("seeds synthetic demo data idempotently", () => {
    const directory = temporaryDirectory();
    const database = openDatabase(path.join(directory, "demo.db")); runMigrations(database);
    try {
      const first = seedDemoData(database, "2026-07-23", "2026-07-23T12:00:00.000Z");
      const second = seedDemoData(database, "2026-07-23", "2026-07-23T12:00:00.000Z");
      expect(first).toMatchObject({ accountCreated: true, transactionsCreated: 12, goalCreated: true });
      expect(second).toEqual({ accountCreated: false, transactionsCreated: 0, goalCreated: false });
      expect(database.prepare("SELECT COUNT(*) FROM accounts WHERE id = 'demo-current'").pluck().get()).toBe(1);
    } finally { database.close(); }
  });
});

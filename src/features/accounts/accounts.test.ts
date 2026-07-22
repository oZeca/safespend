import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openDatabase } from "@/db/connection";
import { runMigrations } from "@/db/migrate";
import type { Account } from "./model";
import { formatCurrency } from "./money";
import { createAccountRepository } from "./repository";
import { calculateAccountSummary } from "./summary";
import { accountInputSchema, formatMoneyInput, parseMoneyToCents } from "./validation";

const directories: string[] = [];
afterEach(() => { for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }); });

function testDatabase() {
  const directory = mkdtempSync(path.join(tmpdir(), "safespend-accounts-")); directories.push(directory);
  const database = openDatabase(path.join(directory, "test.db")); runMigrations(database); return database;
}

const write = { name: "Daily account", institution: "Local Bank", accountType: "current" as const, currency: "EUR", currentBalanceCents: 123456, includedInAvailableCash: true, includedInNetWorth: true };

describe("account repository", () => {
  it("creates, updates, archives, and records only balance-changing snapshots", () => {
    const database = testDatabase(); let id = 0;
    const repository = createAccountRepository(database, { id: () => `id-${++id}`, now: () => new Date("2026-07-22T10:00:00.000Z"), localDate: () => "2026-07-22" });
    try {
      const created = repository.create(write);
      expect(created).toMatchObject({ name: "Daily account", currentBalanceCents: 123456, isArchived: false });
      expect(repository.listBalanceSnapshots(created.id)).toHaveLength(1);
      repository.update(created.id, { ...write, name: "Main account" });
      expect(repository.listBalanceSnapshots(created.id)).toHaveLength(1);
      repository.update(created.id, { ...write, name: "Main account", currentBalanceCents: 125000 });
      expect(repository.listBalanceSnapshots(created.id).map((item) => item.balanceCents)).toEqual([123456, 125000]);
      expect(repository.archive(created.id)).toBe(true);
      expect(repository.archive(created.id)).toBe(false);
      expect(repository.findById(created.id)).toMatchObject({ name: "Main account", isArchived: true });
    } finally { database.close(); }
  });
});

describe("account validation and totals", () => {
  it("parses money exactly without floating-point arithmetic", () => {
    expect(parseMoneyToCents("1234.56")).toBe(123456);
    expect(parseMoneyToCents("-12,3")).toBe(-1230);
    expect(parseMoneyToCents("1.234")).toBeNull();
    expect(formatMoneyInput(-1230)).toBe("-12.30");
    expect(formatCurrency(-123456)).toBe("-€1,234.56");
  });

  it("validates required account fields", () => {
    const result = accountInputSchema.safeParse({ name: "", institution: "", accountType: "unknown", currency: "USD", currentBalance: "1.999", includedInAvailableCash: false, includedInNetWorth: true });
    expect(result.success).toBe(false);
  });

  it("aggregates only enabled balances from active accounts", () => {
    const base = { id: "1", name: "Account", institution: null, accountType: "current" as const, currency: "EUR", currentBalanceCents: 10000, includedInAvailableCash: true, includedInNetWorth: true, isArchived: false, createdAt: "", updatedAt: "" };
    const accounts: Account[] = [base, { ...base, id: "2", currentBalanceCents: -2500, includedInAvailableCash: false }, { ...base, id: "3", currentBalanceCents: 999999, isArchived: true }];
    expect(calculateAccountSummary(accounts)).toEqual({ availableCashCents: 10000, netWorthCents: 7500, activeAccountCount: 2 });
  });
});

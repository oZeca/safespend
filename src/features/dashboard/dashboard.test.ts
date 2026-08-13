import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openDatabase } from "@/db/connection";
import { runMigrations } from "@/db/migrate";
import { createAccountRepository } from "@/features/accounts/repository";
import { createTransactionRepository, type TransactionWrite } from "@/features/transactions/repository";
import { createTransferRepository } from "@/features/transfers/repository";
import { createDashboardRepository } from "./repository";

const directories: string[] = [];
afterEach(() => { for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }); });

function setup() {
  const directory = mkdtempSync(path.join(tmpdir(), "safespend-dashboard-"));
  directories.push(directory);
  const database = openDatabase(path.join(directory, "test.db"));
  runMigrations(database);
  let accountId = 0;
  const accounts = createAccountRepository(database, { id: () => `dashboard-account-${++accountId}`, now: () => new Date("2026-07-23T09:00:00.000Z") });
  const current = accounts.create({ name: "Current", institution: null, accountType: "current", currency: "EUR", currentBalanceCents: 100000, includedInAvailableCash: true, includedInNetWorth: true });
  const card = accounts.create({ name: "Card", institution: null, accountType: "credit", currency: "EUR", currentBalanceCents: -20000, includedInAvailableCash: false, includedInNetWorth: true });
  let transactionId = 0;
  const transactions = createTransactionRepository(database, { id: () => `dashboard-transaction-${++transactionId}`, now: () => new Date("2026-07-23T10:00:00.000Z") });
  let splitId = 0;
  const transfers = createTransferRepository(database, { id: () => `dashboard-split-${++splitId}`, now: () => new Date("2026-07-23T11:00:00.000Z") });
  return { database, accounts, current, card, transactions, transfers, dashboard: createDashboardRepository(database) };
}

function write(accountId: string, date: string, amountCents: number, transactionType: TransactionWrite["transactionType"], categoryId: string | null): TransactionWrite {
  return { accountId, date, description: `${transactionType} ${date} ${amountCents}`, merchant: null, amountCents, transactionType, categoryId, notes: null };
}

describe("dashboard repository", () => {
  it("aggregates cash, current-month actuals, YTD savings, trends, splits, and refunds", () => {
    const { database, accounts, current, card, transactions, transfers, dashboard } = setup();
    try {
      const archived = accounts.create({ name: "Archived cash", institution: null, accountType: "cash", currency: "EUR", currentBalanceCents: 999999, includedInAvailableCash: true, includedInNetWorth: true });
      accounts.archive(archived.id);
      transactions.create(write(current.id, "2026-01-10", 200000, "income", "category-salary"));
      transactions.create(write(current.id, "2026-01-12", -50000, "expense", "category-housing"));
      transactions.create(write(current.id, "2026-07-05", 100000, "income", "category-salary"));
      const splitParent = transactions.create(write(current.id, "2026-07-06", -60000, "expense", "category-shopping"));
      transfers.replaceSplits(splitParent.id, [
        { categoryId: "category-groceries", amountCents: -40000, notes: null },
        { categoryId: "category-shopping", amountCents: -20000, notes: null }
      ]);
      transactions.create(write(card.id, "2026-07-08", 10000, "refund", "category-groceries"));
      transactions.create(write(current.id, "2026-07-09", -20000, "transfer", "category-transfers"));
      transactions.create(write(current.id, "2026-07-30", 50000, "income", "category-salary"));
      const deleted = transactions.create(write(current.id, "2026-07-10", -900000, "expense", "category-shopping"));
      transactions.softDelete(deleted.id);
      transactions.create(write(current.id, "2025-12-31", 700000, "income", "category-salary"));

      const result = dashboard.get("2026-07-23");
      expect(result).toMatchObject({
        availableCashCents: 100000,
        includedAccountCount: 1,
        activeAccountCount: 2,
        currentMonthTransactionCount: 5,
        currentMonthTotals: { incomeCents: 150000, expenseCents: 50000, savingsCents: 100000 },
        yearToDateSavingsCents: 200000,
        uncategorizedSpendingCents: 0
      });
      expect(result.monthlyTrend).toHaveLength(12);
      expect(result.monthlyTrend[0]).toMatchObject({ month: "2026-01", incomeCents: 200000, expenseCents: 50000, savingsCents: 150000 });
      expect(result.monthlyTrend[6]).toMatchObject({ month: "2026-07", incomeCents: 150000, expenseCents: 50000, savingsCents: 100000, isForecast: false });
      expect(result.monthlyTrend[11]).toMatchObject({ month: "2026-12", incomeCents: 0, expenseCents: 0, savingsCents: 0, isForecast: true });
      expect(result.monthlyBalances).toHaveLength(7);
      expect(result.monthlyBalances.slice(0, 6).every((point) => point.balanceCents === null)).toBe(true);
      expect(result.monthlyBalances[6]).toMatchObject({ month: "2026-07", date: "2026-07-23", balanceCents: 100000, isCurrentMonth: true });
      expect(result.categorySpending).toEqual([
        { categoryId: "category-housing", categoryName: "Housing", spendingCents: 50000, monthlySpending: { "2026-01": 50000 } },
        { categoryId: "category-groceries", categoryName: "Groceries", spendingCents: 30000, monthlySpending: { "2026-07": 30000 } },
        { categoryId: "category-shopping", categoryName: "Shopping", spendingCents: 20000, monthlySpending: { "2026-07": 20000 } }
      ]);
    } finally { database.close(); }
  });

  it("reconstructs each calculated account balance at month end and excludes balance-neutral transactions", () => {
    const { database, accounts, current, transactions, dashboard } = setup();
    try {
      accounts.update(current.id, {
        name: current.name,
        institution: current.institution,
        accountType: current.accountType,
        currency: current.currency,
        currentBalanceCents: current.manualBalanceCents,
        balanceMode: "calculated",
        openingBalanceCents: 100000,
        openingBalanceDate: "2026-01-01",
        includedInAvailableCash: true,
        includedInNetWorth: true
      });
      transactions.create(write(current.id, "2026-01-15", 50000, "income", "category-salary"));
      transactions.create(write(current.id, "2026-02-10", -20000, "expense", "category-groceries"));
      transactions.create({ ...write(current.id, "2026-02-11", -30000, "transfer", "category-transfers"), excludedFromAccountBalance: true });
      transactions.create(write(current.id, "2026-07-30", 999999, "income", "category-salary"));

      expect(dashboard.get("2026-07-23").monthlyBalances).toEqual([
        { month: "2026-01", label: "Jan", date: "2026-01-31", balanceCents: 150000, isCurrentMonth: false },
        { month: "2026-02", label: "Feb", date: "2026-02-28", balanceCents: 130000, isCurrentMonth: false },
        { month: "2026-03", label: "Mar", date: "2026-03-31", balanceCents: 130000, isCurrentMonth: false },
        { month: "2026-04", label: "Apr", date: "2026-04-30", balanceCents: 130000, isCurrentMonth: false },
        { month: "2026-05", label: "May", date: "2026-05-31", balanceCents: 130000, isCurrentMonth: false },
        { month: "2026-06", label: "Jun", date: "2026-06-30", balanceCents: 130000, isCurrentMonth: false },
        { month: "2026-07", label: "Jul", date: "2026-07-23", balanceCents: 130000, isCurrentMonth: true }
      ]);
    } finally { database.close(); }
  });

  it("returns explicit zero-data values and rejects invalid dates", () => {
    const { database, dashboard } = setup();
    try {
      expect(dashboard.get("2026-07-23")).toMatchObject({
        availableCashCents: 100000,
        transactionCount: 0,
        currentMonthTransactionCount: 0,
        currentMonthTotals: { incomeCents: 0, expenseCents: 0, savingsCents: 0 },
        yearToDateSavingsCents: 0,
        categorySpending: []
      });
      expect(() => dashboard.get("2026-02-30")).toThrow();
      expect(() => dashboard.get("23/07/2026")).toThrow();
    } finally { database.close(); }
  });
});

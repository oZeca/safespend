import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openDatabase } from "@/db/connection";
import { runMigrations } from "@/db/migrate";
import { createAccountRepository } from "@/features/accounts/repository";
import { createTransactionRepository, type TransactionWrite } from "./repository";
import { calculateMonthlyTotals } from "./totals";
import { normalizeDescription, parseTransactionFilterAmount, transactionInputSchema } from "./validation";

const directories: string[] = [];
afterEach(() => { for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }); });
function setup() {
  const directory = mkdtempSync(path.join(tmpdir(), "safespend-transactions-")); directories.push(directory); const database = openDatabase(path.join(directory, "test.db")); runMigrations(database);
  const account = createAccountRepository(database, { id: () => "account-1", now: () => new Date("2026-07-22T10:00:00.000Z") }).create({ name: "Main", institution: null, accountType: "current", currency: "EUR", currentBalanceCents: 0, includedInAvailableCash: true, includedInNetWorth: true });
  let id = 0; const repository = createTransactionRepository(database, { id: () => `transaction-${++id}`, now: () => new Date("2026-07-22T12:00:00.000Z") });
  return { database, repository, account };
}
const base = (accountId: string): TransactionWrite => ({ accountId, date: "2026-07-22", description: "Corner Market", merchant: "Fresh Foods", amountCents: -5000, transactionType: "expense", categoryId: "category-groceries", notes: "Weekly shop" });

describe("transaction repository", () => {
  it("creates, searches, filters, edits, and soft-deletes transactions", () => {
    const { database, repository, account } = setup();
    try {
      const created = repository.create(base(account.id));
      expect(created).toMatchObject({ normalizedDescription: "corner market", categoryName: "Groceries", accountName: "Main" });
      expect(repository.list({ search: "fresh", page: 1, pageSize: 20 }).totalCount).toBe(1);
      expect(repository.list({ transactionType: "income", page: 1, pageSize: 20 }).totalCount).toBe(0);
      expect(repository.update(created.id, { ...base(account.id), description: "Super Market", notes: null })).toMatchObject({ description: "Super Market", notes: null });
      expect(repository.updateCategory(created.id, "category-shopping")).toMatchObject({ categoryId: "category-shopping", categoryName: "Shopping" });
      expect(repository.updateCategory(created.id, "category-transfers")).toMatchObject({ categoryId: "category-transfers", transactionType: "transfer" });
      expect(repository.monthlyTotals("2026-07")).toEqual({ month: "2026-07", incomeCents: 0, expenseCents: 0, savingsCents: 0 });
      expect(repository.updateCategory(created.id, "category-shopping")).toMatchObject({ categoryId: "category-shopping", transactionType: "expense" });
      expect(repository.updateCategory(created.id, null)).toMatchObject({ categoryId: null, categoryName: null });
      expect(repository.softDelete(created.id)).toBe(true);
      expect(repository.softDelete(created.id)).toBe(false);
      expect(repository.findById(created.id)).toBeNull();
      expect(repository.list({ page: 1, pageSize: 20 }).totalCount).toBe(0);
      const stored = database.prepare("SELECT is_deleted FROM transactions WHERE id = ?").get(created.id) as { is_deleted: number };
      expect(stored.is_deleted).toBe(1);
      database.prepare("UPDATE accounts SET is_archived = 1 WHERE id = ?").run(account.id);
      expect(repository.listOptions().accounts).toEqual([]);
      expect(repository.listOptions(account.id).accounts).toEqual([{ id: account.id, name: "Main", currency: "EUR" }]);
    } finally { database.close(); }
  });

  it("computes monthly totals without transfers or deleted rows and applies refunds", () => {
    const { database, repository, account } = setup();
    try {
      repository.create({ ...base(account.id), amountCents: 10000, transactionType: "income", categoryId: "category-salary" });
      repository.create(base(account.id));
      repository.create({ ...base(account.id), amountCents: 1000, transactionType: "refund" });
      repository.create({ ...base(account.id), amountCents: -2000, transactionType: "transfer", categoryId: "category-transfers" });
      const deleted = repository.create({ ...base(account.id), amountCents: 90000, transactionType: "income" }); repository.softDelete(deleted.id);
      repository.create({ ...base(account.id), date: "2026-08-01", amountCents: 50000, transactionType: "income" });
      expect(repository.monthlyTotals("2026-07")).toEqual({ month: "2026-07", incomeCents: 10000, expenseCents: 4000, savingsCents: 6000 });
      expect(repository.list({ flow: "actual", dateFrom: "2026-07-01", dateTo: "2026-07-31", page: 1, pageSize: 20 }).totalCount).toBe(3);
      expect(repository.list({ flow: "spending", dateFrom: "2026-07-01", dateTo: "2026-07-31", page: 1, pageSize: 20 }).totalCount).toBe(2);
    } finally { database.close(); }
  });

  it("filters signed transaction amounts by equal, more, and less comparisons", () => {
    const { database, repository, account } = setup();
    try {
      repository.create({ ...base(account.id), description: "Small expense", amountCents: -2500 });
      repository.create({ ...base(account.id), description: "Exact expense", amountCents: -5000 });
      repository.create({ ...base(account.id), description: "Large expense", amountCents: -7500 });
      repository.create({ ...base(account.id), description: "Income", amountCents: 10000, transactionType: "income", categoryId: "category-salary" });

      expect(repository.list({ amountComparison: "equal", amountCents: -5000, page: 1, pageSize: 20 }).items.map((item) => item.description)).toEqual(["Exact expense"]);
      expect(repository.list({ amountComparison: "more", amountCents: -5000, page: 1, pageSize: 20 }).items.map((item) => item.description)).toEqual(["Income", "Small expense"]);
      expect(repository.list({ amountComparison: "less", amountCents: -5000, page: 1, pageSize: 20 }).items.map((item) => item.description)).toEqual(["Large expense"]);
    } finally { database.close(); }
  });

  it("sorts by transaction date in both directions and clamps pages", () => {
    const { database, repository, account } = setup();
    try {
      repository.create({ ...base(account.id), date: "2026-07-20", description: "Middle" });
      repository.create({ ...base(account.id), date: "2026-07-01", description: "Oldest" });
      repository.create({ ...base(account.id), date: "2026-07-31", description: "Newest" });

      expect(repository.list({ dateSort: "newest", page: 1, pageSize: 20 }).items.map((item) => item.description)).toEqual(["Newest", "Middle", "Oldest"]);
      expect(repository.list({ dateSort: "oldest", page: 1, pageSize: 20 }).items.map((item) => item.description)).toEqual(["Oldest", "Middle", "Newest"]);
      expect(repository.list({ dateSort: "oldest", page: 99, pageSize: 2 })).toMatchObject({ page: 2, totalPages: 2 });
    } finally { database.close(); }
  });
});

describe("transaction domain", () => {
  it("normalizes descriptions and enforces date, non-zero, and sign rules", () => {
    expect(normalizeDescription("  Coffee   SHOP ")).toBe("coffee shop");
    const valid = { accountId: "a", date: "2026-07-22", description: "Lunch", merchant: "", amount: "-12.50", transactionType: "expense", categoryId: "", notes: "" };
    expect(transactionInputSchema.safeParse(valid).success).toBe(true);
    expect(transactionInputSchema.safeParse({ ...valid, date: "2026-02-30" }).success).toBe(false);
    expect(transactionInputSchema.safeParse({ ...valid, amount: "12.50" }).success).toBe(false);
    expect(transactionInputSchema.safeParse({ ...valid, transactionType: "income", amount: "-1" }).success).toBe(false);
    expect(transactionInputSchema.safeParse({ ...valid, amount: "0" }).success).toBe(false);
    expect(parseTransactionFilterAmount("-50.25")).toBe(-5025);
    expect(parseTransactionFilterAmount("0")).toBe(0);
    expect(parseTransactionFilterAmount("12.345")).toBeUndefined();
  });

  it("calculates totals deterministically", () => {
    expect(calculateMonthlyTotals([{ transactionType: "income", amountCents: 2000 }, { transactionType: "expense", amountCents: -800 }, { transactionType: "refund", amountCents: 100 }, { transactionType: "transfer", amountCents: -500 }], "2026-07"))
      .toEqual({ month: "2026-07", incomeCents: 2000, expenseCents: 700, savingsCents: 1300 });
  });
});

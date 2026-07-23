import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openDatabase } from "@/db/connection";
import { runMigrations } from "@/db/migrate";
import { createAccountRepository } from "@/features/accounts/repository";
import { createTransactionRepository, type TransactionWrite } from "@/features/transactions/repository";
import { createTransferRepository, TransferValidationError } from "./repository";
import { validateSplitInput } from "./validation";

const directories: string[] = [];
afterEach(() => { for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }); });

function setup() {
  const directory = mkdtempSync(path.join(tmpdir(), "safespend-transfers-"));
  directories.push(directory);
  const database = openDatabase(path.join(directory, "test.db"));
  runMigrations(database);
  let accountId = 0;
  const accounts = createAccountRepository(database, { id: () => `account-${++accountId}`, now: () => new Date("2026-07-23T09:00:00.000Z") });
  const current = accounts.create({ name: "Current", institution: null, accountType: "current", currency: "EUR", currentBalanceCents: 0, includedInAvailableCash: true, includedInNetWorth: true });
  const card = accounts.create({ name: "Card", institution: null, accountType: "credit", currency: "EUR", currentBalanceCents: 0, includedInAvailableCash: false, includedInNetWorth: true });
  let transactionId = 0;
  const transactions = createTransactionRepository(database, { id: () => `transaction-${++transactionId}`, now: () => new Date("2026-07-23T10:00:00.000Z") });
  let featureId = 0;
  const transfers = createTransferRepository(database, { id: () => `transfer-feature-${++featureId}`, now: () => new Date("2026-07-23T11:00:00.000Z") });
  return { database, current, card, transactions, transfers };
}

function write(accountId: string, amountCents: number, description: string): TransactionWrite {
  return { accountId, date: "2026-07-23", description, merchant: null, amountCents, transactionType: amountCents < 0 ? "expense" : "income", categoryId: amountCents < 0 ? "category-groceries" : "category-other-income", notes: null };
}

describe("splits", () => {
  it("replaces splits atomically, clears the parent category, and validates the exact total", () => {
    const { database, current, transactions, transfers } = setup();
    try {
      const transaction = transactions.create(write(current.id, -10000, "Department store"));
      expect(transfers.replaceSplits(transaction.id, [
        { categoryId: "category-groceries", amountCents: -6000, notes: "Food" },
        { categoryId: "category-shopping", amountCents: -4000, notes: null }
      ])).toMatchObject([{ categoryName: "Groceries", amountCents: -6000 }, { categoryName: "Shopping", amountCents: -4000 }]);
      expect(transactions.findById(transaction.id)).toMatchObject({ categoryId: null, splitCount: 2 });
      expect(transactions.list({ categoryId: "category-groceries", page: 1, pageSize: 20 }).items).toMatchObject([{ id: transaction.id }]);
      expect(transactions.list({ categoryId: "uncategorized", page: 1, pageSize: 20 }).items).toEqual([]);
      expect(() => transfers.replaceSplits(transaction.id, [
        { categoryId: "category-groceries", amountCents: -5000, notes: null },
        { categoryId: "category-shopping", amountCents: -4000, notes: null }
      ])).toThrow(TransferValidationError);
      expect(transfers.listSplits(transaction.id)).toHaveLength(2);
      expect(transfers.clearSplits(transaction.id)).toBe(true);
      expect(transfers.listSplits(transaction.id)).toEqual([]);
    } finally { database.close(); }
  });

  it("parses signed money and rejects opposite signs and inexact totals", () => {
    expect(validateSplitInput([
      { categoryId: "a", amount: "-6.00", notes: "" },
      { categoryId: "b", amount: "-4.00", notes: "" }
    ], -1000)).toMatchObject({ success: true });
    expect(validateSplitInput([
      { categoryId: "a", amount: "6.00", notes: "" },
      { categoryId: "b", amount: "-16.00", notes: "" }
    ], -1000)).toMatchObject({ success: false });
    expect(validateSplitInput([
      { categoryId: "a", amount: "-6.00", notes: "" },
      { categoryId: "b", amount: "-3.00", notes: "" }
    ], -1000)).toMatchObject({ success: false });
  });
});

describe("transfers", () => {
  it("marks and links exact opposite movements, excludes them from totals, and unlinks without reclassification", () => {
    const { database, current, card, transactions, transfers } = setup();
    try {
      const source = transactions.create(write(current.id, -5000, "Card payment"));
      const destination = transactions.create(write(card.id, 5000, "Payment received"));
      expect(transfers.listDestinationCandidates(source.id)).toMatchObject([{ id: destination.id, accountName: "Card" }]);
      const link = transfers.markAndLink(source.id, destination.id);
      expect(link).toMatchObject({ role: "source", destination: { id: destination.id } });
      expect(transfers.markAndLink(source.id, destination.id)).toMatchObject({ id: link.id });
      expect(transactions.findById(source.id)).toMatchObject({ transactionType: "transfer", categoryId: "category-transfers" });
      expect(transactions.findById(destination.id)).toMatchObject({ transactionType: "transfer", categoryId: "category-transfers" });
      expect(transactions.monthlyTotals("2026-07")).toEqual({ month: "2026-07", incomeCents: 0, expenseCents: 0, savingsCents: 0 });
      expect(() => transactions.update(source.id, { ...write(current.id, -5100, "Card payment"), transactionType: "transfer" })).toThrow("Unlink this transfer");
      expect(transfers.unlink(destination.id)).toBe(true);
      expect(transactions.findById(source.id)?.transactionType).toBe("transfer");
      expect(transactions.findById(destination.id)?.transactionType).toBe("transfer");
    } finally { database.close(); }
  });

  it("rejects mismatched destinations and prevents a transaction from joining two links", () => {
    const { database, current, card, transactions, transfers } = setup();
    try {
      const source = transactions.create(write(current.id, -5000, "Transfer out"));
      const wrong = transactions.create(write(card.id, 4900, "Transfer in"));
      expect(() => transfers.markAndLink(source.id, wrong.id)).toThrow("exact opposites");
      const destination = transactions.create(write(card.id, 5000, "Transfer in exact"));
      transfers.markAndLink(source.id, destination.id);
      const secondSource = transactions.create(write(current.id, -5000, "Second source"));
      expect(() => transfers.markAndLink(secondSource.id, destination.id)).toThrow("already linked");
    } finally { database.close(); }
  });
});

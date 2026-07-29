import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openDatabase } from "@/db/connection";
import { runMigrations } from "@/db/migrate";
import { createAccountRepository } from "@/features/accounts/repository";
import { createTransactionRepository } from "@/features/transactions/repository";
import { findMatchingRule, ruleMatches } from "./engine";
import { categorizationRulePatternMaxLength, type CategorizationRule, type RuleWrite } from "./model";
import { createCategorizationRepository } from "./repository";
import { ruleInputSchema } from "./validation";

const directories: string[] = [];
afterEach(() => { for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }); });
function setup() { const directory = mkdtempSync(path.join(tmpdir(), "safespend-rules-")); directories.push(directory); const database = openDatabase(path.join(directory, "test.db")); runMigrations(database);
  const account = createAccountRepository(database, { id: () => "rules-account" }).create({ name: "Rules account", institution: null, accountType: "current", currency: "EUR", currentBalanceCents: 0, includedInAvailableCash: true, includedInNetWorth: true });
  let transactionId = 0; const transactions = createTransactionRepository(database, { id: () => `rule-transaction-${++transactionId}`, now: () => new Date("2026-07-23T10:00:00.000Z") }); let ruleId = 0;
  const rules = createCategorizationRepository(database, { id: () => `rule-${++ruleId}`, now: () => new Date("2026-07-23T11:00:00.000Z") }); return { database, account, transactions, rules }; }
const write: RuleWrite = { name: "Coffee shops", matchField: "normalized_description", matchType: "contains", pattern: "coffee", categoryId: "category-restaurants", transactionType: "expense", priority: 100, isEnabled: true };

describe("categorization engine", () => {
  const base: CategorizationRule = { id: "r", ...write, categoryName: "Restaurants", createdAt: "", updatedAt: "" }; const transaction = { description: "CARD Coffee Place", normalizedDescription: "card coffee place", merchant: "Coffee Place" };
  it("supports all match types and fields case-insensitively", () => {
    expect(ruleMatches(base, transaction)).toBe(true); expect(ruleMatches({ ...base, matchType: "starts_with", pattern: "CARD" }, transaction)).toBe(true);
    expect(ruleMatches({ ...base, matchField: "merchant", matchType: "exact", pattern: "coffee place" }, transaction)).toBe(true);
    expect(ruleMatches({ ...base, matchType: "regex", pattern: "coffee\\s+place$" }, transaction)).toBe(true);
  });
  it("uses first enabled rule order", () => { expect(findMatchingRule([{ ...base, isEnabled: false }, { ...base, id: "second" }], transaction)?.id).toBe("second"); });
  it("rejects invalid regex patterns", () => { expect(ruleInputSchema.safeParse({ ...write, matchType: "regex", pattern: "[" }).success).toBe(false); });
  it("accepts long patterns up to the documented limit", () => {
    expect(ruleInputSchema.safeParse({ ...write, matchType: "regex", pattern: "a".repeat(categorizationRulePatternMaxLength) }).success).toBe(true);
    expect(ruleInputSchema.safeParse({ ...write, matchType: "regex", pattern: "a".repeat(categorizationRulePatternMaxLength + 1) }).success).toBe(false);
  });
});

describe("categorization repository", () => {
  it("creates, previews, updates, toggles, and deletes rules", () => { const { database, account, transactions, rules } = setup(); try {
    transactions.create({ accountId: account.id, date: "2026-07-23", description: "Morning Coffee", merchant: "Cafe", amountCents: -350, transactionType: "expense", categoryId: null, notes: null });
    const rule = rules.create(write); expect(rules.preview(rule).totalCount).toBe(1); expect(rules.update(rule.id, { ...write, name: "Coffee" })?.name).toBe("Coffee"); expect(rules.setEnabled(rule.id, false)).toBe(true); expect(rules.list(true)).toEqual([]); expect(rules.delete(rule.id)).toBe(true);
  } finally { database.close(); } });
  it("bulk applies the first matching rule only to uncategorized active transactions", () => { const { database, account, transactions, rules } = setup(); try {
    const uncategorized = transactions.create({ accountId: account.id, date: "2026-07-23", description: "Coffee Bar", merchant: null, amountCents: -500, transactionType: "expense", categoryId: null, notes: null });
    const categorized = transactions.create({ accountId: account.id, date: "2026-07-23", description: "Coffee Beans", merchant: null, amountCents: -900, transactionType: "expense", categoryId: "category-groceries", notes: null });
    const deleted = transactions.create({ accountId: account.id, date: "2026-07-23", description: "Coffee Old", merchant: null, amountCents: -100, transactionType: "expense", categoryId: null, notes: null }); transactions.softDelete(deleted.id);
    rules.create({ ...write, priority: 200, categoryId: "category-shopping" }); rules.create({ ...write, priority: 10 }); expect(rules.bulkApply()).toBe(1);
    expect(transactions.findById(uncategorized.id)).toMatchObject({ categoryId: "category-restaurants", transactionType: "expense" }); expect(transactions.findById(categorized.id)?.categoryId).toBe("category-groceries");
  } finally { database.close(); } });
});

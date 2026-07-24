import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openDatabase } from "@/db/connection";
import { runMigrations } from "@/db/migrate";
import { createAccountRepository } from "@/features/accounts/repository";
import { decodeCsv, parseCsv } from "./csv";
import type { CsvMapping } from "./model";
import { parseLocalizedDate, parseLocalizedMoney } from "./normalization";
import { createImportRepository } from "./repository";
import { createCategorizationRepository } from "@/features/categorization/repository";

const directories: string[] = [];
afterEach(() => { for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }); });
function setup() {
  const directory = mkdtempSync(path.join(tmpdir(), "safespend-imports-")); directories.push(directory); const database = openDatabase(path.join(directory, "test.db")); runMigrations(database);
  const account = createAccountRepository(database, { id: () => "account-import", now: () => new Date("2026-07-22T10:00:00.000Z") }).create({ name: "Import account", institution: null, accountType: "current", currency: "EUR", currentBalanceCents: 0, includedInAvailableCash: true, includedInNetWorth: true });
  let id = 0; const repository = createImportRepository(database, { id: () => `import-id-${++id}`, now: () => new Date("2026-07-22T12:00:00.000Z") }); return { database, account, repository };
}
const mapping: CsvMapping = { dateColumn: "Date", descriptionColumn: "Description", amountColumn: "Amount", merchantColumn: "Merchant", dateFormat: "DD/MM/YYYY", decimalFormat: "decimal_comma", delimiter: ";" };
const csvText = 'Date;Description;Amount;Merchant\n21/07/2026;"Market, central";-1.234,56;Shop\n22/07/2026;Salary;2.000,00;Employer\n31/02/2026;Bad row;5,00;Nowhere\n';

describe("CSV parsing and normalization", () => {
  it("decodes UTF-8 and legacy Windows-1252 bank exports", () => {
    const utf8 = new TextEncoder().encode("Descrição;Amount\nCafé;-1,00\n");
    const windows1252 = Uint8Array.from([
      0x44, 0x65, 0x73, 0x63, 0x72, 0x69, 0xe7, 0xe3, 0x6f, 0x3b, 0x41, 0x6d, 0x6f, 0x75, 0x6e, 0x74,
      0x0a, 0x43, 0x61, 0x66, 0xe9, 0x3b, 0x2d, 0x31, 0x2c, 0x30, 0x30, 0x0a,
    ]);

    expect(decodeCsv(utf8)).toContain("Descrição");
    expect(decodeCsv(windows1252)).toBe("Descrição;Amount\nCafé;-1,00\n");
  });
  it("honors UTF-16 byte-order marks", () => {
    const utf16le = Uint8Array.from([0xff, 0xfe, 0x44, 0x00, 0x61, 0x00, 0x74, 0x00, 0x65, 0x00]);
    const utf16be = Uint8Array.from([0xfe, 0xff, 0x00, 0x44, 0x00, 0x61, 0x00, 0x74, 0x00, 0x65]);

    expect(decodeCsv(utf16le)).toBe("Date");
    expect(decodeCsv(utf16be)).toBe("Date");
  });
  it("parses quoted CSV fields and detects delimiters", () => {
    const csv = parseCsv(csvText); expect(csv.delimiter).toBe(";"); expect(csv.headers).toEqual(["Date", "Description", "Amount", "Merchant"]); expect(csv.rows[0].Description).toBe("Market, central");
  });
  it("parses required decimal formats exactly", () => {
    expect(parseLocalizedMoney("1.234,56", "decimal_comma")).toBe(123456);
    expect(parseLocalizedMoney("1,234.56", "decimal_dot")).toBe(123456);
  });
  it("parses required date formats and rejects impossible dates", () => {
    expect(parseLocalizedDate("2026-07-21", "YYYY-MM-DD")).toBe("2026-07-21");
    expect(parseLocalizedDate("2026-07-21 14:30:59", "YYYY-MM-DD hh:mm:ss")).toBe("2026-07-21");
    expect(parseLocalizedDate("21/07/2026", "DD/MM/YYYY")).toBe("2026-07-21");
    expect(parseLocalizedDate("21-07-2026", "DD-MM-YYYY")).toBe("2026-07-21");
    expect(parseLocalizedDate("31/02/2026", "DD/MM/YYYY")).toBeNull();
    expect(parseLocalizedDate("2026-07-21 24:00:00", "YYYY-MM-DD hh:mm:ss")).toBeNull();
    expect(parseLocalizedDate("2026-02-31 14:30:00", "YYYY-MM-DD hh:mm:ss")).toBeNull();
  });
});

describe("CSV import repository", () => {
  it("previews validation, saves a profile, confirms atomically, and preserves original rows", () => {
    const { database, account, repository } = setup();
    try {
      const importId = repository.stage("bank.csv", "sha-one", account.id, parseCsv(csvText)); const preview = repository.prepare(importId, mapping, "Bank profile")!;
      expect(preview).toMatchObject({ status: "preview", rowCount: 3, errorCount: 1, skippedCount: 0 }); expect(preview.rows[0]).toMatchObject({ amountCents: -123456, date: "2026-07-21", error: null });
      expect(repository.listProfiles()).toHaveLength(1);
      const result = repository.confirm(importId)!; expect(result).toMatchObject({ status: "completed", importedCount: 2, skippedCount: 0, errorCount: 1 });
      const transactions = database.prepare("SELECT original_payload_json, source_row_number, transaction_type FROM transactions WHERE source_import_id = ? ORDER BY source_row_number").all(importId) as Array<{ original_payload_json: string; source_row_number: number; transaction_type: string }>;
      expect(transactions).toHaveLength(2); expect(JSON.parse(transactions[0].original_payload_json)).toEqual({ Date: "21/07/2026", Description: "Market, central", Amount: "-1.234,56", Merchant: "Shop" }); expect(transactions.map((row) => row.transaction_type)).toEqual(["expense", "income"]);
    } finally { database.close(); }
  });
  it("applies the winning enabled rule during preview and confirmation", () => {
    const { database, account, repository } = setup();
    try {
      createCategorizationRepository(database).create({ name: "Markets", matchField: "normalized_description", matchType: "contains", pattern: "market", categoryId: "category-groceries", transactionType: "expense", priority: 10, isEnabled: true });
      const importId = repository.stage("rules.csv", "rules-sha", account.id, parseCsv(csvText)); const preview = repository.prepare(importId, mapping)!;
      expect(preview.rows[0]).toMatchObject({ matchedRuleName: "Markets", suggestedCategoryName: "Groceries", suggestedTransactionType: "expense" }); repository.confirm(importId);
      expect(database.prepare("SELECT category_id, transaction_type FROM transactions WHERE source_import_id = ? AND source_row_number = 2").get(importId)).toEqual({ category_id: "category-groceries", transaction_type: "expense" });
    } finally { database.close(); }
  });
  it("marks exact rows as duplicates when the same CSV is imported again", () => {
    const { database, account, repository } = setup();
    try {
      const first = repository.stage("bank.csv", "same-sha", account.id, parseCsv(csvText)); repository.prepare(first, mapping, "Reusable bank"); repository.confirm(first);
      const profile = repository.listProfiles()[0];
      const second = repository.stage("bank.csv", "same-sha", account.id, parseCsv(csvText)); const preview = repository.prepare(second, profile.configuration, undefined, profile.id)!;
      expect(preview.profileId).toBe(profile.id);
      expect(preview.rows.filter((row) => row.isExactDuplicate)).toHaveLength(2); expect(preview.skippedCount).toBe(2);
      const result = repository.confirm(second)!; expect(result.importedCount).toBe(0); expect(result.skippedCount).toBe(2);
      expect((database.prepare("SELECT COUNT(*) AS count FROM transactions").get() as { count: number }).count).toBe(2);
    } finally { database.close(); }
  });
});

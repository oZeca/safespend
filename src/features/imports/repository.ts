import type Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import type { CsvMapping, ImportDetail, ImportPreviewRow, ImportProfile, ImportSummary, ParsedCsv } from "./model";
import { duplicateKey, fingerprintRow, normalizeImportRow } from "./normalization";
import { createCategorizationRepository } from "@/features/categorization/repository";
import { findMatchingRule } from "@/features/categorization/engine";

interface ImportRowRecord { id: string; rowNumber: number; originalPayloadJson: string; normalizedDate: string | null; normalizedDescription: string | null; normalizedMerchant: string | null; normalizedAmountCents: number | null; sourceFingerprint: string | null; validationError: string | null; isExactDuplicate: number; selectedForImport: number | null; matchedRuleId: string | null; matchedRuleName: string | null; suggestedCategoryId: string | null; suggestedCategoryName: string | null; suggestedTransactionType: string | null; }
interface ImportRecord { id: string; fileName: string; status: string; rowCount: number; importedCount: number; skippedCount: number; excludedCount: number; errorCount: number; createdAt: string; accountName: string; accountId: string; profileName: string | null; profileId: string | null; detectedDelimiter: string; }
export interface ImportRepositoryOptions { now?: () => Date; id?: () => string; }

const selectImports = `SELECT i.id, i.file_name AS fileName, i.status, i.row_count AS rowCount, i.imported_count AS importedCount, i.skipped_count AS skippedCount, i.excluded_count AS excludedCount, i.error_count AS errorCount,
 i.created_at AS createdAt, i.account_id AS accountId, i.detected_delimiter AS detectedDelimiter, a.name AS accountName, i.profile_id AS profileId, p.name AS profileName FROM imports i JOIN accounts a ON a.id = i.account_id LEFT JOIN import_profiles p ON p.id = i.profile_id`;

export function createImportRepository(database: Database.Database, options: ImportRepositoryOptions = {}) {
  const now = options.now ?? (() => new Date()); const makeId = options.id ?? randomUUID;
  function rows(importId: string): ImportRowRecord[] { return database.prepare(`SELECT ir.id, ir.row_number AS rowNumber, ir.original_payload_json AS originalPayloadJson, ir.normalized_date AS normalizedDate,
    ir.normalized_description AS normalizedDescription, ir.normalized_merchant AS normalizedMerchant, ir.normalized_amount_cents AS normalizedAmountCents, ir.source_fingerprint AS sourceFingerprint,
    ir.validation_error AS validationError, ir.is_exact_duplicate AS isExactDuplicate, ir.selected_for_import AS selectedForImport, ir.matched_rule_id AS matchedRuleId, cr.name AS matchedRuleName, ir.suggested_category_id AS suggestedCategoryId,
    c.name AS suggestedCategoryName, ir.suggested_transaction_type AS suggestedTransactionType FROM import_rows ir LEFT JOIN categorization_rules cr ON cr.id = ir.matched_rule_id
    LEFT JOIN categories c ON c.id = ir.suggested_category_id WHERE ir.import_id = ? ORDER BY ir.row_number`).all(importId) as ImportRowRecord[]; }
  function detail(id: string): ImportDetail | null {
    const record = database.prepare(`${selectImports} WHERE i.id = ?`).get(id) as ImportRecord | undefined; if (!record) return null;
    const previewRows: ImportPreviewRow[] = rows(id).map((row) => ({ id: row.id, rowNumber: row.rowNumber, original: JSON.parse(row.originalPayloadJson) as Record<string, string>, date: row.normalizedDate,
      description: row.normalizedDescription, merchant: row.normalizedMerchant, amountCents: row.normalizedAmountCents, fingerprint: row.sourceFingerprint, error: row.validationError, isExactDuplicate: Boolean(row.isExactDuplicate), isSelected: row.selectedForImport === null ? null : Boolean(row.selectedForImport),
      matchedRuleId: row.matchedRuleId, matchedRuleName: row.matchedRuleName, suggestedCategoryId: row.suggestedCategoryId, suggestedCategoryName: row.suggestedCategoryName, suggestedTransactionType: row.suggestedTransactionType }));
    return { ...record, rows: previewRows };
  }
  return {
    list(): ImportSummary[] { return database.prepare(`${selectImports} ORDER BY i.created_at DESC LIMIT 30`).all() as ImportSummary[]; },
    findById: detail,
    listProfiles(): ImportProfile[] {
      return (database.prepare("SELECT id, name, configuration_json AS configurationJson FROM import_profiles ORDER BY name COLLATE NOCASE").all() as Array<{ id: string; name: string; configurationJson: string }>).map((profile) => ({ id: profile.id, name: profile.name, configuration: JSON.parse(profile.configurationJson) as CsvMapping }));
    },
    findProfile(id: string): ImportProfile | null { return this.listProfiles().find((profile) => profile.id === id) ?? null; },
    stage(fileName: string, fileSha256: string, accountId: string, csv: ParsedCsv, importType = "csv"): string {
      const id = makeId(); const timestamp = now().toISOString();
      database.transaction(() => {
        database.prepare("INSERT INTO imports (id, file_name, file_sha256, import_type, account_id, profile_id, status, row_count, imported_count, skipped_count, error_count, created_at, completed_at, detected_delimiter) VALUES (?, ?, ?, ?, ?, NULL, 'mapping', ?, 0, 0, 0, ?, NULL, ?)")
          .run(id, fileName, fileSha256, importType, accountId, csv.rows.length, timestamp, csv.delimiter);
        const insert = database.prepare("INSERT INTO import_rows (id, import_id, row_number, original_payload_json, created_at) VALUES (?, ?, ?, ?, ?)");
        csv.rows.forEach((row, index) => insert.run(makeId(), id, csv.rowNumbers?.[index] ?? index + 2, JSON.stringify(row), timestamp));
      })(); return id;
    },
    prepare(importId: string, mapping: CsvMapping, profileName?: string, existingProfileId?: string): ImportDetail | null {
      const importRecord = detail(importId); if (!importRecord || importRecord.status === "completed") return null; const timestamp = now().toISOString(); let profileId = existingProfileId ?? null;
      database.transaction(() => {
        if (profileName) { profileId = makeId(); database.prepare("INSERT INTO import_profiles (id, name, institution, file_type, configuration_json, created_at, updated_at) VALUES (?, ?, NULL, 'csv', ?, ?, ?)").run(profileId, profileName, JSON.stringify(mapping), timestamp, timestamp); }
        const update = database.prepare("UPDATE import_rows SET normalized_date = ?, normalized_description = ?, normalized_merchant = ?, normalized_amount_cents = ?, source_fingerprint = ?, validation_error = ?, is_exact_duplicate = ?, matched_rule_id = ?, suggested_category_id = ?, suggested_transaction_type = ? WHERE id = ?");
        const rules = createCategorizationRepository(database).list(true);
        const existingCounts = new Map<string, number>();
        const existing = database.prepare(`SELECT date, amount_cents AS amountCents, normalized_description AS normalizedDescription, COUNT(*) AS count
          FROM transactions WHERE account_id = ? AND is_deleted = 0 GROUP BY date, amount_cents, normalized_description`).all(importRecord.accountId) as Array<{ date: string; amountCents: number; normalizedDescription: string; count: number }>;
        for (const transaction of existing) existingCounts.set(`${importRecord.accountId}|${transaction.date}|${transaction.amountCents}|${transaction.normalizedDescription}`, transaction.count);
        const occurrences = new Map<string, number>(); let errorCount = 0; let duplicateCount = 0;
        for (const row of rows(importId)) {
          const original = JSON.parse(row.originalPayloadJson) as Record<string, string>; const normalized = normalizeImportRow(original, mapping);
          let duplicate = false; let fingerprint: string | null = null;
          if (!normalized.error && normalized.date && normalized.amountCents !== null && normalized.description) {
            const key = duplicateKey(importRecord.accountId, normalized.date, normalized.amountCents, normalized.description);
            const occurrence = (occurrences.get(key) ?? 0) + 1; occurrences.set(key, occurrence);
            duplicate = occurrence <= (existingCounts.get(key) ?? 0);
            fingerprint = fingerprintRow(importRecord.accountId, normalized.date, normalized.amountCents, normalized.description, occurrence);
          }
          const matchedRule = normalized.description ? findMatchingRule(rules, { description: normalized.description, normalizedDescription: normalized.description.trim().replace(/\s+/g, " ").toLocaleLowerCase("en"), merchant: normalized.merchant }) : null;
          if (normalized.error) errorCount += 1; if (duplicate) duplicateCount += 1;
          update.run(normalized.date, normalized.description, normalized.merchant, normalized.amountCents, fingerprint, normalized.error, Number(duplicate), matchedRule?.id ?? null, matchedRule?.categoryId ?? null, matchedRule?.transactionType ?? null, row.id);
        }
        database.prepare("UPDATE imports SET profile_id = ?, status = 'preview', error_count = ?, skipped_count = ? WHERE id = ?").run(profileId, errorCount, duplicateCount, importId);
      })(); return detail(importId);
    },
    confirm(importId: string, selectedRowIds?: string[]): ImportDetail | null {
      const importRecord = detail(importId); if (!importRecord || importRecord.status !== "preview") return null; const timestamp = now().toISOString(); let importedCount = 0; let skippedCount = 0;
      let excludedCount = 0; const selected = selectedRowIds ? new Set(selectedRowIds) : null;
      database.transaction(() => {
        const insert = database.prepare(`INSERT OR IGNORE INTO transactions (id, account_id, date, posted_at, description, normalized_description, merchant, amount_cents, transaction_type, category_id, notes,
          is_recurring, is_exceptional, excluded_from_forecast_baseline, source_import_id, source_row_number, source_fingerprint, original_payload_json, is_deleted, created_at, updated_at)
          VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, NULL, 0, 0, 0, ?, ?, ?, ?, 0, ?, ?)`);
        const recordSelection = database.prepare("UPDATE import_rows SET selected_for_import = ? WHERE id = ?");
        for (const row of rows(importId)) {
          if (row.validationError || row.isExactDuplicate || !row.normalizedDate || !row.normalizedDescription || row.normalizedAmountCents === null || !row.sourceFingerprint) { if (row.isExactDuplicate) skippedCount += 1; continue; }
          const isSelected = !selected || selected.has(row.id); recordSelection.run(Number(isSelected), row.id);
          if (!isSelected) { excludedCount += 1; continue; }
          const result = insert.run(makeId(), importRecord.accountId, row.normalizedDate, row.normalizedDescription, row.normalizedDescription.trim().replace(/\s+/g, " ").toLocaleLowerCase("en"), row.normalizedMerchant,
            row.normalizedAmountCents, row.suggestedTransactionType ?? (row.normalizedAmountCents > 0 ? "income" : "expense"), row.suggestedCategoryId, importId, row.rowNumber, row.sourceFingerprint, row.originalPayloadJson, timestamp, timestamp);
          if (result.changes) importedCount += 1; else skippedCount += 1;
        }
        database.prepare("UPDATE imports SET status = 'completed', imported_count = ?, skipped_count = ?, excluded_count = ?, completed_at = ? WHERE id = ?").run(importedCount, skippedCount, excludedCount, timestamp, importId);
      })(); return detail(importId);
    }
  };
}

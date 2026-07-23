import type Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { findMatchingRule, ruleMatches } from "./engine";
import type { CategorizationRule, RuleMatchPreview, RuleWrite } from "./model";
import type { CategoryOption, TransactionType } from "@/features/transactions/model";

interface RuleRow { id: string; name: string; matchField: CategorizationRule["matchField"]; matchType: CategorizationRule["matchType"]; pattern: string; categoryId: string; categoryName: string; transactionType: TransactionType | null; priority: number; isEnabled: number; createdAt: string; updatedAt: string; }
const selectRules = `SELECT r.id, r.name, r.match_field AS matchField, r.match_type AS matchType, r.pattern, r.category_id AS categoryId, c.name AS categoryName,
 r.transaction_type AS transactionType, r.priority, r.is_enabled AS isEnabled, r.created_at AS createdAt, r.updated_at AS updatedAt FROM categorization_rules r JOIN categories c ON c.id = r.category_id`;
function mapRule(row: RuleRow): CategorizationRule { return { ...row, isEnabled: Boolean(row.isEnabled) }; }

export function createCategorizationRepository(database: Database.Database, options: { now?: () => Date; id?: () => string } = {}) {
  const now = options.now ?? (() => new Date()); const makeId = options.id ?? randomUUID;
  return {
    categories(): CategoryOption[] { return database.prepare("SELECT id, name, kind FROM categories WHERE is_archived = 0 ORDER BY name COLLATE NOCASE").all() as CategoryOption[]; },
    list(enabledOnly = false): CategorizationRule[] { return (database.prepare(`${selectRules}${enabledOnly ? " WHERE r.is_enabled = 1" : ""} ORDER BY r.priority, r.created_at, r.id`).all() as RuleRow[]).map(mapRule); },
    findById(id: string): CategorizationRule | null { const row = database.prepare(`${selectRules} WHERE r.id = ?`).get(id) as RuleRow | undefined; return row ? mapRule(row) : null; },
    create(input: RuleWrite): CategorizationRule { const id = makeId(); const timestamp = now().toISOString(); database.prepare("INSERT INTO categorization_rules (id, name, match_field, match_type, pattern, category_id, transaction_type, priority, is_enabled, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, input.name, input.matchField, input.matchType, input.pattern, input.categoryId, input.transactionType, input.priority, Number(input.isEnabled), timestamp, timestamp); return this.findById(id)!; },
    update(id: string, input: RuleWrite): CategorizationRule | null { const result = database.prepare("UPDATE categorization_rules SET name = ?, match_field = ?, match_type = ?, pattern = ?, category_id = ?, transaction_type = ?, priority = ?, is_enabled = ?, updated_at = ? WHERE id = ?").run(input.name, input.matchField, input.matchType, input.pattern, input.categoryId, input.transactionType, input.priority, Number(input.isEnabled), now().toISOString(), id); return result.changes ? this.findById(id) : null; },
    setEnabled(id: string, enabled: boolean): boolean { return database.prepare("UPDATE categorization_rules SET is_enabled = ?, updated_at = ? WHERE id = ?").run(Number(enabled), now().toISOString(), id).changes === 1; },
    delete(id: string): boolean { return database.prepare("DELETE FROM categorization_rules WHERE id = ?").run(id).changes === 1; },
    preview(rule: CategorizationRule): RuleMatchPreview {
      const transactions = database.prepare(`SELECT t.id, t.date, t.description, t.normalized_description AS normalizedDescription, t.merchant, a.name AS accountName
        FROM transactions t JOIN accounts a ON a.id = t.account_id WHERE t.is_deleted = 0 ORDER BY t.date DESC, t.created_at DESC`).all() as Array<{ id: string; date: string; description: string; normalizedDescription: string; merchant: string | null; accountName: string }>;
      const matches = transactions.filter((transaction) => ruleMatches({ ...rule, isEnabled: true }, transaction)); return { totalCount: matches.length, items: matches.slice(0, 20) };
    },
    bulkApply(): number {
      const rules = this.list(true); const transactions = database.prepare("SELECT id, description, normalized_description AS normalizedDescription, merchant, transaction_type AS transactionType FROM transactions WHERE is_deleted = 0 AND category_id IS NULL ORDER BY date, created_at, id")
        .all() as Array<{ id: string; description: string; normalizedDescription: string; merchant: string | null; transactionType: TransactionType }>;
      let count = 0; const timestamp = now().toISOString(); const update = database.prepare("UPDATE transactions SET category_id = ?, transaction_type = ?, updated_at = ? WHERE id = ? AND category_id IS NULL AND is_deleted = 0");
      database.transaction(() => { for (const transaction of transactions) { const rule = findMatchingRule(rules, transaction); if (rule) count += update.run(rule.categoryId, rule.transactionType ?? transaction.transactionType, timestamp, transaction.id).changes; } })(); return count;
    }
  };
}

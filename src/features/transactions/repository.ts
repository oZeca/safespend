import type Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { calculateMonthlyTotals } from "./totals";
import type { AccountOption, CategoryOption, Transaction, TransactionFilters, TransactionPage, TransactionType } from "./model";
import { normalizeDescription } from "./validation";

interface TransactionRow {
  id: string; accountId: string; accountName: string; date: string; description: string; normalizedDescription: string; merchant: string | null;
  amountCents: number; transactionType: TransactionType; categoryId: string | null; categoryName: string | null; notes: string | null; splitCount: number;
  isRecurring: number; isExceptional: number; excludedFromForecastBaseline: number; excludedFromAccountBalance: number; createdAt: string; updatedAt: string;
}
export interface TransactionWrite {
  accountId: string; date: string; description: string; merchant: string | null; amountCents: number; transactionType: TransactionType; categoryId: string | null; notes: string | null;
  isRecurring?: boolean; isExceptional?: boolean; excludedFromForecastBaseline?: boolean; excludedFromAccountBalance?: boolean;
}
export interface TransactionRepositoryOptions { now?: () => Date; id?: () => string; }

const select = `SELECT t.id, t.account_id AS accountId, a.name AS accountName, t.date, t.description, t.normalized_description AS normalizedDescription, t.merchant,
  t.amount_cents AS amountCents, t.transaction_type AS transactionType, t.category_id AS categoryId, c.name AS categoryName, t.notes,
  (SELECT COUNT(*) FROM transaction_splits ts WHERE ts.transaction_id = t.id) AS splitCount, t.is_recurring AS isRecurring, t.is_exceptional AS isExceptional,
  t.excluded_from_forecast_baseline AS excludedFromForecastBaseline, t.excluded_from_account_balance AS excludedFromAccountBalance, t.created_at AS createdAt, t.updated_at AS updatedAt
  FROM transactions t JOIN accounts a ON a.id = t.account_id LEFT JOIN categories c ON c.id = t.category_id`;

function escapeLike(value: string): string { return value.replace(/[\\%_]/g, "\\$&"); }
function mapTransaction(row: TransactionRow): Transaction {
  return { ...row, isRecurring: Boolean(row.isRecurring), isExceptional: Boolean(row.isExceptional), excludedFromForecastBaseline: Boolean(row.excludedFromForecastBaseline), excludedFromAccountBalance: Boolean(row.excludedFromAccountBalance) };
}

export function createTransactionRepository(database: Database.Database, options: TransactionRepositoryOptions = {}) {
  const now = options.now ?? (() => new Date()); const makeId = options.id ?? randomUUID;
  return {
    listOptions(includeAccountId?: string): { accounts: AccountOption[]; categories: CategoryOption[] } {
      const accounts = includeAccountId
        ? database.prepare("SELECT id, name, currency FROM accounts WHERE is_archived = 0 OR id = ? ORDER BY name COLLATE NOCASE").all(includeAccountId) as AccountOption[]
        : database.prepare("SELECT id, name, currency FROM accounts WHERE is_archived = 0 ORDER BY name COLLATE NOCASE").all() as AccountOption[];
      const categories = database.prepare("SELECT id, name, kind FROM categories WHERE is_archived = 0 ORDER BY name COLLATE NOCASE").all() as CategoryOption[];
      return { accounts, categories };
    },
    list(filters: TransactionFilters): TransactionPage {
      const where = ["t.is_deleted = 0"]; const parameters: Record<string, string | number> = {};
      if (filters.search) { where.push("(t.normalized_description LIKE @search ESCAPE '\\' OR LOWER(COALESCE(t.merchant, '')) LIKE @search ESCAPE '\\')"); parameters.search = `%${escapeLike(filters.search.toLocaleLowerCase("en"))}%`; }
      if (filters.accountId) { where.push("t.account_id = @accountId"); parameters.accountId = filters.accountId; }
      if (filters.categoryId) {
        where.push(filters.categoryId === "uncategorized"
          ? "t.category_id IS NULL AND NOT EXISTS (SELECT 1 FROM transaction_splits filter_splits WHERE filter_splits.transaction_id = t.id)"
          : "(t.category_id = @categoryId OR EXISTS (SELECT 1 FROM transaction_splits filter_splits WHERE filter_splits.transaction_id = t.id AND filter_splits.category_id = @categoryId))");
        if (filters.categoryId !== "uncategorized") parameters.categoryId = filters.categoryId;
      }
      if (filters.transactionType) { where.push("t.transaction_type = @transactionType"); parameters.transactionType = filters.transactionType; }
      if (filters.flow === "spending") where.push("t.transaction_type IN ('expense', 'refund')");
      if (filters.flow === "actual") where.push("t.transaction_type IN ('income', 'expense', 'refund')");
      if (filters.dateFrom) { where.push("t.date >= @dateFrom"); parameters.dateFrom = filters.dateFrom; }
      if (filters.dateTo) { where.push("t.date <= @dateTo"); parameters.dateTo = filters.dateTo; }
      if (filters.amountComparison && filters.amountCents !== undefined) {
        const operator = filters.amountComparison === "equal" ? "=" : filters.amountComparison === "more" ? ">" : "<";
        where.push(`t.amount_cents ${operator} @amountCents`);
        parameters.amountCents = filters.amountCents;
      }
      const clause = `WHERE ${where.join(" AND ")}`;
      const totalCount = (database.prepare(`SELECT COUNT(*) AS count FROM transactions t ${clause}`).get(parameters) as { count: number }).count;
      const totalPages = Math.max(1, Math.ceil(totalCount / filters.pageSize)); const page = Math.min(filters.page, totalPages);
      parameters.limit = filters.pageSize; parameters.offset = (page - 1) * filters.pageSize;
      const direction = filters.dateSort === "oldest" ? "ASC" : "DESC";
      const items = (database.prepare(`${select} ${clause} ORDER BY t.date ${direction}, t.created_at ${direction}, t.id ${direction} LIMIT @limit OFFSET @offset`).all(parameters) as TransactionRow[]).map(mapTransaction);
      return { items, totalCount, page, pageSize: filters.pageSize, totalPages };
    },
    findById(id: string): Transaction | null {
      const row = database.prepare(`${select} WHERE t.id = ? AND t.is_deleted = 0`).get(id) as TransactionRow | undefined;
      return row ? mapTransaction(row) : null;
    },
    create(input: TransactionWrite): Transaction {
      const id = makeId(); const timestamp = now().toISOString();
      database.prepare(`INSERT INTO transactions (id, account_id, date, posted_at, description, normalized_description, merchant, amount_cents, transaction_type, category_id, notes,
        is_recurring, is_exceptional, excluded_from_forecast_baseline, excluded_from_account_balance, is_deleted, created_at, updated_at) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`)
        .run(id, input.accountId, input.date, input.description, normalizeDescription(input.description), input.merchant, input.amountCents, input.transactionType, input.categoryId, input.notes,
          Number(input.isRecurring ?? false), Number(input.isExceptional ?? false), Number(input.excludedFromForecastBaseline ?? false), Number(input.excludedFromAccountBalance ?? false), timestamp, timestamp);
      return this.findById(id)!;
    },
    update(id: string, input: TransactionWrite): Transaction | null {
      const existing = this.findById(id);
      if (!existing) return null;
      if (existing.splitCount > 0 && (input.amountCents !== existing.amountCents || input.transactionType === "transfer" || input.categoryId !== null)) {
        throw new Error("Remove or update the splits before changing the amount, type, or category.");
      }
      const linked = database.prepare("SELECT 1 FROM transfer_links WHERE source_transaction_id = ? OR destination_transaction_id = ?").get(id, id);
      if (linked && (input.accountId !== existing.accountId || input.amountCents !== existing.amountCents || input.transactionType !== "transfer")) {
        throw new Error("Unlink this transfer before changing its account, amount, or type.");
      }
      const result = database.prepare(`UPDATE transactions SET account_id = ?, date = ?, description = ?, normalized_description = ?, merchant = ?, amount_cents = ?, transaction_type = ?, category_id = ?, notes = ?,
        is_recurring = ?, is_exceptional = ?, excluded_from_forecast_baseline = ?, excluded_from_account_balance = ?, updated_at = ? WHERE id = ? AND is_deleted = 0`)
        .run(input.accountId, input.date, input.description, normalizeDescription(input.description), input.merchant, input.amountCents, input.transactionType, input.categoryId, input.notes,
          Number(input.isRecurring ?? existing.isRecurring), Number(input.isExceptional ?? existing.isExceptional),
          Number(input.excludedFromForecastBaseline ?? existing.excludedFromForecastBaseline), Number(input.excludedFromAccountBalance ?? existing.excludedFromAccountBalance), now().toISOString(), id);
      return result.changes ? this.findById(id) : null;
    },
    updateCategory(id: string, categoryId: string | null): Transaction | null {
      const existing = this.findById(id);
      if (!existing) return null;
      if (existing.splitCount > 0) throw new Error("Edit split categories instead.");
      const category = categoryId
        ? database.prepare("SELECT kind FROM categories WHERE id = ? AND is_archived = 0").get(categoryId) as { kind: CategoryOption["kind"] } | undefined
        : undefined;
      if (categoryId && !category) throw new Error("Category unavailable.");
      const transactionType = category?.kind === "transfer"
        ? "transfer"
        : existing.transactionType === "transfer"
          ? existing.amountCents < 0 ? "expense" : "income"
          : existing.transactionType;
      const result = database.prepare("UPDATE transactions SET category_id = ?, transaction_type = ?, updated_at = ? WHERE id = ? AND is_deleted = 0")
        .run(categoryId, transactionType, now().toISOString(), id);
      return result.changes ? this.findById(id) : null;
    },
    softDelete(id: string): boolean {
      return database.transaction(() => {
        database.prepare("DELETE FROM transfer_links WHERE source_transaction_id = ? OR destination_transaction_id = ?").run(id, id);
        return database.prepare("UPDATE transactions SET is_deleted = 1, updated_at = ? WHERE id = ? AND is_deleted = 0").run(now().toISOString(), id).changes === 1;
      })();
    },
    monthlyTotals(month: string) {
      const [year, monthNumber] = month.split("-").map(Number); const nextMonth = monthNumber === 12 ? `${year + 1}-01` : `${year}-${String(monthNumber + 1).padStart(2, "0")}`;
      const rows = database.prepare("SELECT transaction_type AS transactionType, amount_cents AS amountCents FROM transactions WHERE is_deleted = 0 AND date >= ? AND date < ?")
        .all(`${month}-01`, `${nextMonth}-01`) as Array<{ transactionType: TransactionType; amountCents: number }>;
      return calculateMonthlyTotals(rows, month);
    }
  };
}

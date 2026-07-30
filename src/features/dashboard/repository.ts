import type Database from "better-sqlite3";
import { calculateCategorySpending, calculateDashboardActuals } from "./calculations";
import type { DashboardCategoryRow, DashboardData, DashboardTransactionRow } from "./model";
import { dashboardDateSchema } from "./validation";
import { effectiveBalanceSql } from "@/features/accounts/balance";

export function createDashboardRepository(database: Database.Database) {
  return {
    get(asOfInput: string): DashboardData {
      const asOf = dashboardDateSchema.parse(asOfInput);
      const currentMonth = asOf.slice(0, 7);
      const nextMonth = currentMonth.endsWith("-12") ? `${Number(currentMonth.slice(0, 4)) + 1}-01` : `${currentMonth.slice(0, 4)}-${String(Number(currentMonth.slice(5, 7)) + 1).padStart(2, "0")}`;
      const yearStart = `${asOf.slice(0, 4)}-01-01`;
      const accountSummary = database.prepare(`SELECT
        COALESCE(SUM(CASE WHEN a.included_in_available_cash = 1 THEN ${effectiveBalanceSql} ELSE 0 END), 0) AS availableCashCents,
        COALESCE(SUM(CASE WHEN a.included_in_available_cash = 1 THEN 1 ELSE 0 END), 0) AS includedAccountCount,
        COUNT(*) AS activeAccountCount FROM accounts a WHERE a.is_archived = 0`).get() as
        { availableCashCents: number; includedAccountCount: number; activeAccountCount: number };
      const transactionCount = database.prepare("SELECT COUNT(*) FROM transactions WHERE is_deleted = 0").pluck().get() as number;
      const transactions = database.prepare(`SELECT date, transaction_type AS transactionType, amount_cents AS amountCents
        FROM transactions WHERE is_deleted = 0 AND date >= ? AND date < ? ORDER BY date`).all(yearStart, `${nextMonth}-01`) as DashboardTransactionRow[];
      const categoryRows = database.prepare(`SELECT t.date, t.category_id AS categoryId, c.name AS categoryName, t.amount_cents AS amountCents
        FROM transactions t LEFT JOIN categories c ON c.id = t.category_id
        WHERE t.is_deleted = 0 AND t.date >= ? AND t.date < ? AND t.transaction_type IN ('expense', 'refund')
          AND NOT EXISTS (SELECT 1 FROM transaction_splits s WHERE s.transaction_id = t.id)
        UNION ALL
        SELECT t.date, s.category_id AS categoryId, c.name AS categoryName, s.amount_cents AS amountCents
        FROM transaction_splits s JOIN transactions t ON t.id = s.transaction_id JOIN categories c ON c.id = s.category_id
        WHERE t.is_deleted = 0 AND t.date >= ? AND t.date < ? AND t.transaction_type IN ('expense', 'refund')`)
        .all(yearStart, `${nextMonth}-01`, yearStart, `${nextMonth}-01`) as DashboardCategoryRow[];
      const actuals = calculateDashboardActuals(transactions, asOf);
      const categorySpending = calculateCategorySpending(categoryRows);
      return {
        asOf,
        ...actuals,
        ...accountSummary,
        transactionCount,
        categorySpending,
        uncategorizedSpendingCents: categorySpending.find((category) => category.categoryId === null)?.monthlySpending[currentMonth] ?? 0
      };
    }
  };
}

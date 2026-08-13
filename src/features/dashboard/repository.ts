import type Database from "better-sqlite3";
import { calculateCategorySpending, calculateDashboardActuals } from "./calculations";
import type { DashboardCategoryRow, DashboardData, DashboardMonthlyBalancePoint, DashboardTransactionRow } from "./model";
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
      const balanceAtDate = database.prepare(`SELECT COUNT(*) AS accountCount, COUNT(balance_cents) AS knownBalanceCount,
        COALESCE(SUM(balance_cents), 0) AS balanceCents FROM (
          SELECT CASE
            WHEN a.balance_mode = 'calculated' AND a.opening_balance_date <= @date THEN
              a.opening_balance_cents + COALESCE((SELECT SUM(t.amount_cents) FROM transactions t
                WHERE t.account_id = a.id AND t.is_deleted = 0 AND t.excluded_from_account_balance = 0
                  AND t.date >= a.opening_balance_date AND t.date <= @date), 0)
            WHEN a.balance_mode = 'manual' THEN (SELECT s.balance_cents FROM balance_snapshots s
              WHERE s.account_id = a.id AND s.date <= @date ORDER BY s.date DESC, s.created_at DESC LIMIT 1)
            ELSE NULL END AS balance_cents
          FROM accounts a WHERE a.is_archived = 0 AND a.included_in_available_cash = 1
        )`);
      const monthlyBalances: DashboardMonthlyBalancePoint[] = [];
      for (let monthNumber = 1; monthNumber <= Number(currentMonth.slice(5, 7)); monthNumber += 1) {
        const month = `${asOf.slice(0, 4)}-${String(monthNumber).padStart(2, "0")}`;
        const followingMonth = monthNumber === 12 ? `${Number(asOf.slice(0, 4)) + 1}-01` : `${asOf.slice(0, 4)}-${String(monthNumber + 1).padStart(2, "0")}`;
        const monthEndDate = new Date(`${followingMonth}-01T00:00:00.000Z`);
        monthEndDate.setUTCDate(monthEndDate.getUTCDate() - 1);
        const date = month === currentMonth ? asOf : monthEndDate.toISOString().slice(0, 10);
        const balance = balanceAtDate.get({ date }) as { accountCount: number; knownBalanceCount: number; balanceCents: number };
        monthlyBalances.push({
          month,
          label: new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00.000Z`)),
          date,
          balanceCents: balance.accountCount > 0 && balance.knownBalanceCount === balance.accountCount ? balance.balanceCents : null,
          isCurrentMonth: month === currentMonth
        });
      }
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
        monthlyBalances,
        categorySpending,
        uncategorizedSpendingCents: categorySpending.find((category) => category.categoryId === null)?.monthlySpending[currentMonth] ?? 0
      };
    }
  };
}

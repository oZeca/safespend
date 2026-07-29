import { calculateMonthlyTotals } from "@/features/transactions/totals";
import type { DashboardCategoryRow, DashboardCategorySpending, DashboardMonthlyPoint, DashboardTransactionRow } from "./model";

export function monthAfter(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return monthNumber === 12 ? `${year + 1}-01` : `${year}-${String(monthNumber + 1).padStart(2, "0")}`;
}

export function calculateDashboardActuals(rows: DashboardTransactionRow[], asOf: string) {
  const currentMonth = asOf.slice(0, 7);
  const monthStart = `${currentMonth}-01`;
  const nextMonthStart = `${monthAfter(currentMonth)}-01`;
  const yearStart = `${asOf.slice(0, 4)}-01-01`;
  const currentRows = rows.filter((row) => row.date >= monthStart && row.date < nextMonthStart);
  const current = calculateMonthlyTotals(currentRows, currentMonth);
  const ytd = calculateMonthlyTotals(rows.filter((row) => row.date >= yearStart && row.date <= asOf), "ytd");
  const monthlyTrend: DashboardMonthlyPoint[] = [];
  for (let monthNumber = 1; monthNumber <= Number(currentMonth.slice(5, 7)); monthNumber += 1) {
    const month = `${asOf.slice(0, 4)}-${String(monthNumber).padStart(2, "0")}`;
    const totals = calculateMonthlyTotals(rows.filter((row) => row.date.startsWith(month)), month);
    monthlyTrend.push({ month, label: new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00.000Z`)), incomeCents: totals.incomeCents, expenseCents: totals.expenseCents, savingsCents: totals.savingsCents });
  }
  return {
    currentMonth,
    monthStart,
    nextMonthStart,
    yearStart,
    currentMonthTransactionCount: currentRows.length,
    currentMonthTotals: { incomeCents: current.incomeCents, expenseCents: current.expenseCents, savingsCents: current.savingsCents },
    yearToDateSavingsCents: ytd.savingsCents,
    monthlyTrend
  };
}

export function calculateCategorySpending(rows: DashboardCategoryRow[]): DashboardCategorySpending[] {
  const totals = new Map<string, DashboardCategorySpending>();
  for (const row of rows) {
    const key = row.categoryId ?? "uncategorized";
    const existing = totals.get(key) ?? { categoryId: row.categoryId, categoryName: row.categoryName ?? "Uncategorized", spendingCents: 0, monthlySpending: {} };
    existing.spendingCents -= row.amountCents;
    const month = row.date.slice(0, 7);
    existing.monthlySpending[month] = (existing.monthlySpending[month] ?? 0) - row.amountCents;
    totals.set(key, existing);
  }
  return [...totals.values()].filter((category) => category.spendingCents !== 0)
    .sort((left, right) => right.spendingCents - left.spendingCents || left.categoryName.localeCompare(right.categoryName));
}

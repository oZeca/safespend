export interface DashboardTransactionRow {
  date: string;
  transactionType: "income" | "expense" | "transfer" | "refund";
  amountCents: number;
}

export interface DashboardCategoryRow {
  date: string;
  categoryId: string | null;
  categoryName: string | null;
  amountCents: number;
}

export interface DashboardMonthlyPoint {
  month: string;
  label: string;
  incomeCents: number;
  expenseCents: number;
  savingsCents: number;
  isForecast: boolean;
}

export interface DashboardCategorySpending {
  categoryId: string | null;
  categoryName: string;
  spendingCents: number;
  monthlySpending: Record<string, number>;
}

export interface DashboardData {
  asOf: string;
  currentMonth: string;
  monthStart: string;
  nextMonthStart: string;
  yearStart: string;
  availableCashCents: number;
  includedAccountCount: number;
  activeAccountCount: number;
  transactionCount: number;
  currentMonthTransactionCount: number;
  currentMonthTotals: { incomeCents: number; expenseCents: number; savingsCents: number };
  yearToDateSavingsCents: number;
  monthlyTrend: DashboardMonthlyPoint[];
  categorySpending: DashboardCategorySpending[];
  uncategorizedSpendingCents: number;
}

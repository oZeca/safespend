export const transactionTypes = ["income", "expense", "transfer", "refund"] as const;
export type TransactionType = (typeof transactionTypes)[number];

export const transactionTypeLabels: Record<TransactionType, string> = { income: "Income", expense: "Expense", transfer: "Transfer", refund: "Refund" };

export interface CategoryOption { id: string; name: string; kind: "income" | "expense" | "transfer" | "mixed"; }
export interface AccountOption { id: string; name: string; currency: string; }

export interface Transaction {
  id: string; accountId: string; accountName: string; date: string; description: string; normalizedDescription: string; merchant: string | null;
  amountCents: number; transactionType: TransactionType; categoryId: string | null; categoryName: string | null; notes: string | null; splitCount: number;
  isRecurring: boolean; isExceptional: boolean; excludedFromForecastBaseline: boolean; createdAt: string; updatedAt: string;
}

export type TransactionFlow = "spending" | "actual";
export const amountComparisons = ["equal", "more", "less"] as const;
export type AmountComparison = (typeof amountComparisons)[number];
export interface TransactionFilters {
  search?: string; accountId?: string; categoryId?: string; transactionType?: TransactionType; flow?: TransactionFlow; dateFrom?: string; dateTo?: string;
  amountComparison?: AmountComparison; amountCents?: number; page: number; pageSize: number;
}
export interface TransactionPage { items: Transaction[]; totalCount: number; page: number; pageSize: number; totalPages: number; }
export interface MonthlyTotals { month: string; incomeCents: number; expenseCents: number; savingsCents: number; }

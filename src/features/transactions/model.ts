import type { AccountType } from "@/features/accounts/model";

export const transactionTypes = ["income", "expense", "transfer", "refund"] as const;
export type TransactionType = (typeof transactionTypes)[number];

export const transactionTypeLabels: Record<TransactionType, string> = { income: "Income", expense: "Expense", transfer: "Transfer", refund: "Refund" };
export const orphanedAccountFilter = "orphaned";

export interface CategoryOption { id: string; name: string; kind: "income" | "expense" | "transfer" | "mixed"; }
export interface AccountOption { id: string; name: string; currency: string; accountType: AccountType; }

export interface Transaction {
  id: string; accountId: string; accountName: string; accountType: AccountType | null; date: string; description: string; normalizedDescription: string; merchant: string | null;
  amountCents: number; transactionType: TransactionType; categoryId: string | null; categoryName: string | null; notes: string | null; splitCount: number;
  isRecurring: boolean; isExceptional: boolean; excludedFromForecastBaseline: boolean; excludedFromAccountBalance: boolean; createdAt: string; updatedAt: string;
}

export type TransactionFlow = "spending" | "actual";
export const transactionDateSorts = ["newest", "oldest"] as const;
export type TransactionDateSort = (typeof transactionDateSorts)[number];
export const amountComparisons = ["equal", "more", "less"] as const;
export type AmountComparison = (typeof amountComparisons)[number];
export const accountBalanceTreatments = ["internal", "included"] as const;
export type AccountBalanceTreatment = (typeof accountBalanceTreatments)[number];
export interface TransactionFilters {
  search?: string; accountId?: string; categoryId?: string; transactionType?: TransactionType; flow?: TransactionFlow; dateFrom?: string; dateTo?: string;
  amountComparison?: AmountComparison; amountCents?: number; accountBalanceTreatment?: AccountBalanceTreatment; dateSort?: TransactionDateSort; page: number; pageSize: number;
}
export interface TransactionPage { items: Transaction[]; totalCount: number; page: number; pageSize: number; totalPages: number; }
export interface MonthlyTotals { month: string; incomeCents: number; expenseCents: number; savingsCents: number; }

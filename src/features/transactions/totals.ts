import type { MonthlyTotals, TransactionTotals, TransactionType } from "./model";

export function calculateTransactionTotals(rows: Array<{ transactionType: TransactionType; amountCents: number }>): TransactionTotals {
  let incomeCents = 0; let expenseNetCents = 0;
  for (const row of rows) {
    if (row.transactionType === "income") incomeCents += row.amountCents;
    if (row.transactionType === "expense" || row.transactionType === "refund") expenseNetCents += row.amountCents;
  }
  const expenseCents = expenseNetCents === 0 ? 0 : -expenseNetCents;
  return { incomeCents, expenseCents, savingsCents: incomeCents - expenseCents };
}

export function calculateMonthlyTotals(rows: Array<{ transactionType: TransactionType; amountCents: number }>, month: string): MonthlyTotals {
  return { month, ...calculateTransactionTotals(rows) };
}

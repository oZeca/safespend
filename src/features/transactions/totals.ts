import type { MonthlyTotals, TransactionType } from "./model";

export function calculateMonthlyTotals(rows: Array<{ transactionType: TransactionType; amountCents: number }>, month: string): MonthlyTotals {
  let incomeCents = 0; let expenseNetCents = 0;
  for (const row of rows) {
    if (row.transactionType === "income") incomeCents += row.amountCents;
    if (row.transactionType === "expense" || row.transactionType === "refund") expenseNetCents += row.amountCents;
  }
  const expenseCents = -expenseNetCents;
  return { month, incomeCents, expenseCents, savingsCents: incomeCents - expenseCents };
}

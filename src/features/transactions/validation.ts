import { z } from "zod";
import { parseMoneyToCents } from "@/features/accounts/validation";
import { accountBalanceTreatments, amountComparisons, transactionTypes, type AccountBalanceTreatment, type AmountComparison, type TransactionType } from "./model";

export function normalizeDescription(value: string): string { return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en"); }

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number); const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

const amount = z.string().trim().refine((value) => { const cents = parseMoneyToCents(value); return cents !== null && cents !== 0; }, "Enter a non-zero amount with at most 2 decimal places");

export const transactionInputSchema = z.object({
  accountId: z.string().trim().min(1, "Select an account"), date: z.string().refine(isCalendarDate, "Enter a valid date"),
  description: z.string().trim().min(1, "Description is required").max(250, "Description must be 250 characters or fewer"),
  merchant: z.string().trim().max(150, "Merchant must be 150 characters or fewer"), amount,
  transactionType: z.enum(transactionTypes, { message: "Select a transaction type" }), categoryId: z.string().trim(), notes: z.string().trim().max(1000, "Notes must be 1000 characters or fewer"),
  isRecurring: z.boolean().default(false), isExceptional: z.boolean().default(false), excludedFromForecastBaseline: z.boolean().default(false), excludedFromAccountBalance: z.boolean().default(false)
}).superRefine((value, context) => {
  const cents = parseMoneyToCents(value.amount); if (cents === null) return;
  if (value.transactionType === "expense" && cents > 0) context.addIssue({ code: z.ZodIssueCode.custom, path: ["amount"], message: "Expenses must use a negative amount" });
  if ((value.transactionType === "income" || value.transactionType === "refund") && cents < 0) context.addIssue({ code: z.ZodIssueCode.custom, path: ["amount"], message: `${value.transactionType === "income" ? "Income" : "Refunds"} must use a positive amount` });
});

export type TransactionInput = z.infer<typeof transactionInputSchema>;
export function transactionInputFromFormData(formData: FormData): Record<string, unknown> {
  return { accountId: formData.get("accountId"), date: formData.get("date"), description: formData.get("description"), merchant: formData.get("merchant"), amount: formData.get("amount"), transactionType: formData.get("transactionType"), categoryId: formData.get("categoryId"), notes: formData.get("notes"),
    isRecurring: formData.get("isRecurring") === "on", isExceptional: formData.get("isExceptional") === "on", excludedFromForecastBaseline: formData.get("excludedFromForecastBaseline") === "on", excludedFromAccountBalance: formData.get("excludedFromAccountBalance") === "on" };
}

export function isTransactionType(value: string | undefined): value is TransactionType { return transactionTypes.includes(value as TransactionType); }
export function isAmountComparison(value: string | undefined): value is AmountComparison { return amountComparisons.includes(value as AmountComparison); }
export function isAccountBalanceTreatment(value: string | undefined): value is AccountBalanceTreatment { return accountBalanceTreatments.includes(value as AccountBalanceTreatment); }

export function parseTransactionFilterAmount(value: string | undefined): number | undefined {
  if (!value?.trim()) return undefined;
  return parseMoneyToCents(value) ?? undefined;
}

import { z } from "zod";
import { parseMoneyToCents } from "@/features/accounts/validation";

function calendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

const date = z.string().refine(calendarDate, "Enter a valid date");
const nonNegativeMoney = z.string().trim().refine((value) => {
  const cents = parseMoneyToCents(value);
  return cents !== null && cents >= 0;
}, "Enter a non-negative amount with at most 2 decimal places");
const positiveMoney = z.string().trim().refine((value) => {
  const cents = parseMoneyToCents(value);
  return cents !== null && cents > 0;
}, "Enter an amount greater than zero with at most 2 decimal places");

export const goalInputSchema = z.object({
  name: z.string().trim().min(1, "Goal name is required").max(100, "Goal name must be 100 characters or fewer"),
  startDate: date,
  targetDate: date,
  targetAmount: positiveMoney,
  startingAmount: nonNegativeMoney,
  minimumCashBuffer: nonNegativeMoney,
  includeInvestmentTransfers: z.boolean()
}).superRefine((value, context) => {
  if (value.targetDate < value.startDate) context.addIssue({ code: z.ZodIssueCode.custom, path: ["targetDate"], message: "Target date must be on or after the start date" });
  if (value.targetDate.slice(0, 4) !== value.startDate.slice(0, 4)) context.addIssue({ code: z.ZodIssueCode.custom, path: ["targetDate"], message: "An annual goal must start and end in the same calendar year" });
});

export const incomeInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be 100 characters or fewer"),
  expectedDate: date,
  amount: positiveMoney
});

export const plannedExpenseInputSchema = incomeInputSchema;

export const recurringInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be 100 characters or fewer"),
  transactionType: z.enum(["income", "expense"]),
  amount: positiveMoney,
  frequency: z.enum(["weekly", "monthly", "quarterly", "yearly"]),
  nextExpectedDate: date,
  endDate: z.union([date, z.literal("")])
}).superRefine((value, context) => {
  if (value.endDate && value.endDate < value.nextExpectedDate) context.addIssue({ code: z.ZodIssueCode.custom, path: ["endDate"], message: "End date must be on or after the next date" });
});

export function formValues(formData: FormData, keys: string[]) {
  return Object.fromEntries(keys.map((key) => [key, String(formData.get(key) ?? "")]));
}

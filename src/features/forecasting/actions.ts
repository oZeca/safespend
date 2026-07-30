"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseMoneyToCents } from "@/features/accounts/validation";
import { getForecastRepository } from "./server-repository";
import { formValues, goalInputSchema, incomeInputSchema, plannedExpenseInputSchema, recurringInputSchema } from "./validation";

export interface ForecastFormState { message?: string; errors?: Record<string, string[]>; values?: Record<string, string>; }

function refresh() {
  revalidatePath("/forecast");
  revalidatePath("/dashboard");
}

export async function saveGoalAction(_state: ForecastFormState, formData: FormData): Promise<ForecastFormState> {
  const keys = ["name", "startDate", "targetDate", "targetAmount", "startingAmount", "minimumCashBuffer"];
  const values = formValues(formData, keys);
  values.includeInvestmentTransfers = formData.get("includeInvestmentTransfers") === "on" ? "on" : "";
  const result = goalInputSchema.safeParse({ ...values, includeInvestmentTransfers: formData.get("includeInvestmentTransfers") === "on" });
  if (!result.success) return { message: "Check the highlighted goal fields.", errors: result.error.flatten().fieldErrors, values };
  try {
    getForecastRepository().saveGoal({
      name: result.data.name, startDate: result.data.startDate, targetDate: result.data.targetDate,
      targetAmountCents: parseMoneyToCents(result.data.targetAmount)!, startingAmountCents: parseMoneyToCents(result.data.startingAmount)!,
      minimumCashBufferCents: parseMoneyToCents(result.data.minimumCashBuffer)!, includeInvestmentTransfers: result.data.includeInvestmentTransfers
    });
  } catch (error) {
    console.error("Failed to save forecast goal", error);
    return { message: "The savings goal could not be saved.", values };
  }
  refresh(); redirect("/forecast?status=goal-saved");
}

export async function toggleProjectedVariableExpensesAction(formData: FormData): Promise<void> {
  const include = formData.get("include") === "true";
  const returnTo = formData.get("returnTo") === "/dashboard" ? "/dashboard" : "/forecast";
  try {
    getForecastRepository().setIncludeProjectedVariableExpenses(include);
  } catch (error) {
    console.error("Failed to update projected variable expense preference", error);
    redirect(`${returnTo}?status=forecast-setting-error`);
  }
  refresh(); redirect(returnTo === "/forecast" ? "/forecast?status=forecast-setting-saved" : returnTo);
}

export async function createIncomeAction(_state: ForecastFormState, formData: FormData): Promise<ForecastFormState> {
  const values = formValues(formData, ["name", "expectedDate", "amount"]);
  const result = incomeInputSchema.safeParse(values);
  if (!result.success) return { message: "Check the expected income fields.", errors: result.error.flatten().fieldErrors, values };
  try { getForecastRepository().createIncome({ name: result.data.name, expectedDate: result.data.expectedDate, amountCents: parseMoneyToCents(result.data.amount)! }); }
  catch (error) { console.error("Failed to create income expectation", error); return { message: "The expected income could not be added.", values }; }
  refresh(); redirect("/forecast?status=income-added");
}

export async function updateIncomeAction(id: string, _state: ForecastFormState, formData: FormData): Promise<ForecastFormState> {
  const values = formValues(formData, ["name", "expectedDate", "amount"]);
  const result = incomeInputSchema.safeParse(values);
  if (!result.success) return { message: "Check the expected income fields.", errors: result.error.flatten().fieldErrors, values };
  try {
    const updated = getForecastRepository().updateIncome(id, { name: result.data.name, expectedDate: result.data.expectedDate, amountCents: parseMoneyToCents(result.data.amount)! });
    if (!updated) return { message: "This expected income no longer exists.", values };
  } catch (error) { console.error("Failed to update income expectation", error); return { message: "The expected income could not be saved.", values }; }
  refresh(); redirect("/forecast?status=income-updated");
}

export async function createPlannedExpenseAction(_state: ForecastFormState, formData: FormData): Promise<ForecastFormState> {
  const values = formValues(formData, ["name", "expectedDate", "amount"]);
  const result = plannedExpenseInputSchema.safeParse(values);
  if (!result.success) return { message: "Check the planned expense fields.", errors: result.error.flatten().fieldErrors, values };
  try { getForecastRepository().createPlannedExpense({ name: result.data.name, expectedDate: result.data.expectedDate, amountCents: parseMoneyToCents(result.data.amount)! }); }
  catch (error) { console.error("Failed to create planned expense", error); return { message: "The planned expense could not be added.", values }; }
  refresh(); redirect("/forecast?status=expense-added");
}

export async function updatePlannedExpenseAction(id: string, _state: ForecastFormState, formData: FormData): Promise<ForecastFormState> {
  const values = formValues(formData, ["name", "expectedDate", "amount"]);
  const result = plannedExpenseInputSchema.safeParse(values);
  if (!result.success) return { message: "Check the planned expense fields.", errors: result.error.flatten().fieldErrors, values };
  try {
    const updated = getForecastRepository().updatePlannedExpense(id, { name: result.data.name, expectedDate: result.data.expectedDate, amountCents: parseMoneyToCents(result.data.amount)! });
    if (!updated) return { message: "This planned expense no longer exists.", values };
  } catch (error) { console.error("Failed to update planned expense", error); return { message: "The planned expense could not be saved.", values }; }
  refresh(); redirect("/forecast?status=expense-updated");
}

export async function createRecurringAction(_state: ForecastFormState, formData: FormData): Promise<ForecastFormState> {
  const values = formValues(formData, ["name", "transactionType", "amount", "frequency", "nextExpectedDate", "endDate"]);
  const result = recurringInputSchema.safeParse(values);
  if (!result.success) return { message: "Check the recurring item fields.", errors: result.error.flatten().fieldErrors, values };
  const cents = parseMoneyToCents(result.data.amount)!;
  try {
    getForecastRepository().createRecurring({
      name: result.data.name, transactionType: result.data.transactionType,
      expectedAmountCents: result.data.transactionType === "expense" ? -cents : cents,
      frequency: result.data.frequency, nextExpectedDate: result.data.nextExpectedDate, endDate: result.data.endDate || null
    });
  } catch (error) { console.error("Failed to create recurring item", error); return { message: "The recurring item could not be added.", values }; }
  refresh(); redirect("/forecast?status=recurring-added");
}

export async function updateRecurringAction(id: string, _state: ForecastFormState, formData: FormData): Promise<ForecastFormState> {
  const values = formValues(formData, ["name", "transactionType", "amount", "frequency", "nextExpectedDate", "endDate"]);
  const result = recurringInputSchema.safeParse(values);
  if (!result.success) return { message: "Check the recurring item fields.", errors: result.error.flatten().fieldErrors, values };
  const cents = parseMoneyToCents(result.data.amount)!;
  try {
    const updated = getForecastRepository().updateRecurring(id, {
      name: result.data.name, transactionType: result.data.transactionType,
      expectedAmountCents: result.data.transactionType === "expense" ? -cents : cents,
      frequency: result.data.frequency, nextExpectedDate: result.data.nextExpectedDate, endDate: result.data.endDate || null
    });
    if (!updated) return { message: "This recurring item no longer exists.", values };
  } catch (error) { console.error("Failed to update recurring item", error); return { message: "The recurring item could not be saved.", values }; }
  refresh(); redirect("/forecast?status=recurring-updated");
}

export async function deleteAssumptionAction(formData: FormData): Promise<void> {
  const kind = formData.get("kind");
  const id = formData.get("id");
  if ((kind === "income" || kind === "expense" || kind === "recurring") && typeof id === "string" && id) {
    try { getForecastRepository().deleteAssumption(kind, id); } catch (error) { console.error("Failed to delete forecast assumption", error); }
  }
  refresh(); redirect("/forecast?status=assumption-deleted");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAccountRepository } from "./server-repository";
import { accountInputFromFormData, accountInputSchema, parseMoneyToCents } from "./validation";

export interface AccountFormState { message?: string; errors?: Record<string, string[]>; values?: Record<string, string | boolean>; }

function valuesFromFormData(formData: FormData): Record<string, string | boolean> {
  return {
    name: String(formData.get("name") ?? ""), institution: String(formData.get("institution") ?? ""), accountType: String(formData.get("accountType") ?? "current"),
    currency: String(formData.get("currency") ?? "EUR"), currentBalance: String(formData.get("currentBalance") ?? "0.00"),
    includedInAvailableCash: formData.get("includedInAvailableCash") === "on", includedInNetWorth: formData.get("includedInNetWorth") === "on"
  };
}

function validate(formData: FormData): { success: false; state: AccountFormState } | { success: true; data: ReturnType<typeof toWrite> } {
  const result = accountInputSchema.safeParse(accountInputFromFormData(formData));
  if (!result.success) return { success: false, state: { message: "Check the highlighted fields.", errors: result.error.flatten().fieldErrors, values: valuesFromFormData(formData) } };
  return { success: true, data: toWrite(result.data) };
}

function toWrite(input: { name: string; institution: string; accountType: "current" | "savings" | "cash" | "credit" | "investment"; currency: "EUR"; currentBalance: string; includedInAvailableCash: boolean; includedInNetWorth: boolean }) {
  return { name: input.name, institution: input.institution || null, accountType: input.accountType, currency: input.currency, currentBalanceCents: parseMoneyToCents(input.currentBalance)!, includedInAvailableCash: input.includedInAvailableCash, includedInNetWorth: input.includedInNetWorth };
}

export async function createAccountAction(_state: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const result = validate(formData); if (!result.success) return result.state;
  try { getAccountRepository().create(result.data); }
  catch (error) { console.error("Failed to create account", error); return { message: "The account could not be created. Please try again.", values: valuesFromFormData(formData) }; }
  revalidatePath("/accounts"); redirect("/accounts?status=created");
}

export async function updateAccountAction(id: string, _state: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const result = validate(formData); if (!result.success) return result.state;
  try {
    if (!getAccountRepository().update(id, result.data)) return { message: "This account no longer exists.", values: valuesFromFormData(formData) };
  } catch (error) { console.error("Failed to update account", error); return { message: "The account could not be updated. Please try again.", values: valuesFromFormData(formData) }; }
  revalidatePath("/accounts"); revalidatePath(`/accounts/${id}/edit`); redirect("/accounts?status=updated");
}

export async function archiveAccountAction(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) redirect("/accounts?status=archive-error");
  try { if (!getAccountRepository().archive(id)) redirect("/accounts?status=archive-error"); }
  catch (error) { console.error("Failed to archive account", error); redirect("/accounts?status=archive-error"); }
  revalidatePath("/accounts"); redirect("/accounts?status=archived");
}

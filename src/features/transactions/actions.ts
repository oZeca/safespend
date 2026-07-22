"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseMoneyToCents } from "@/features/accounts/validation";
import type { TransactionWrite } from "./repository";
import { getTransactionRepository } from "./server-repository";
import { transactionInputFromFormData, transactionInputSchema, type TransactionInput } from "./validation";

export interface TransactionFormState { message?: string; errors?: Record<string, string[]>; values?: Record<string, string>; }

function valuesFromFormData(formData: FormData): Record<string, string> {
  return Object.fromEntries(["accountId", "date", "description", "merchant", "amount", "transactionType", "categoryId", "notes"].map((key) => [key, String(formData.get(key) ?? "")]));
}
function toWrite(input: TransactionInput): TransactionWrite {
  return { accountId: input.accountId, date: input.date, description: input.description, merchant: input.merchant || null, amountCents: parseMoneyToCents(input.amount)!, transactionType: input.transactionType, categoryId: input.categoryId || null, notes: input.notes || null };
}
function validate(formData: FormData, includeAccountId?: string): { success: false; state: TransactionFormState } | { success: true; data: TransactionWrite } {
  const result = transactionInputSchema.safeParse(transactionInputFromFormData(formData));
  if (!result.success) return { success: false, state: { message: "Check the highlighted fields.", errors: result.error.flatten().fieldErrors, values: valuesFromFormData(formData) } };
  const options = getTransactionRepository().listOptions(includeAccountId);
  if (!options.accounts.some((account) => account.id === result.data.accountId)) return { success: false, state: { message: "Select an active account.", errors: { accountId: ["The selected account is unavailable"] }, values: valuesFromFormData(formData) } };
  if (result.data.categoryId && !options.categories.some((category) => category.id === result.data.categoryId)) return { success: false, state: { message: "Select an active category.", errors: { categoryId: ["The selected category is unavailable"] }, values: valuesFromFormData(formData) } };
  return { success: true, data: toWrite(result.data) };
}

export async function createTransactionAction(_state: TransactionFormState, formData: FormData): Promise<TransactionFormState> {
  const result = validate(formData); if (!result.success) return result.state;
  try { getTransactionRepository().create(result.data); }
  catch (error) { console.error("Failed to create transaction", error); return { message: "The transaction could not be created. Please try again.", values: valuesFromFormData(formData) }; }
  revalidatePath("/transactions"); redirect("/transactions?status=created");
}
export async function updateTransactionAction(id: string, _state: TransactionFormState, formData: FormData): Promise<TransactionFormState> {
  const repository = getTransactionRepository(); const existing = repository.findById(id);
  if (!existing) return { message: "This transaction no longer exists.", values: valuesFromFormData(formData) };
  const result = validate(formData, existing.accountId); if (!result.success) return result.state;
  try { if (!repository.update(id, result.data)) return { message: "This transaction no longer exists.", values: valuesFromFormData(formData) }; }
  catch (error) { console.error("Failed to update transaction", error); return { message: "The transaction could not be updated. Please try again.", values: valuesFromFormData(formData) }; }
  revalidatePath("/transactions"); revalidatePath(`/transactions/${id}/edit`); redirect("/transactions?status=updated");
}
export async function deleteTransactionAction(formData: FormData): Promise<void> {
  const id = formData.get("id"); let deleted = false;
  if (typeof id === "string" && id) { try { deleted = getTransactionRepository().softDelete(id); } catch (error) { console.error("Failed to delete transaction", error); } }
  revalidatePath("/transactions"); redirect(`/transactions?status=${deleted ? "deleted" : "delete-error"}`);
}

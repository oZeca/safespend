"use server";

import { revalidatePath } from "next/cache";
import { getTransactionRepository } from "@/features/transactions/server-repository";
import { getTransferRepository } from "./server-repository";
import { parseSplitFormData, validateSplitInput } from "./validation";

export interface TransferFormState { message?: string; success?: string; revision?: number; }

function refresh(transactionId: string) {
  revalidatePath("/transactions");
  revalidatePath(`/transactions/${transactionId}/edit`);
}

export async function replaceSplitsAction(transactionId: string, _state: TransferFormState, formData: FormData): Promise<TransferFormState> {
  const transaction = getTransactionRepository().findById(transactionId);
  if (!transaction) return { message: "This transaction no longer exists." };
  const result = validateSplitInput(parseSplitFormData(formData), transaction.amountCents);
  if (!result.success) return { message: result.message };
  try {
    getTransferRepository().replaceSplits(transactionId, result.data);
    refresh(transactionId);
    return { success: "Splits saved.", revision: Date.now() };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "The splits could not be saved." };
  }
}

export async function clearSplitsAction(transactionId: string, _state: TransferFormState): Promise<TransferFormState> {
  void _state;
  try {
    const changed = getTransferRepository().clearSplits(transactionId);
    refresh(transactionId);
    return { success: changed ? "Splits removed. Choose a category in the transaction form if needed." : "There were no splits to remove.", revision: Date.now() };
  } catch {
    return { message: "The splits could not be removed." };
  }
}

export async function markAndLinkTransferAction(transactionId: string, _state: TransferFormState, formData: FormData): Promise<TransferFormState> {
  const rawDestination = formData.get("destinationTransactionId");
  const destinationId = typeof rawDestination === "string" && rawDestination ? rawDestination : null;
  try {
    getTransferRepository().markAndLink(transactionId, destinationId);
    refresh(transactionId);
    return { success: destinationId ? "Transfer marked and linked." : "Transaction marked as an unlinked transfer.", revision: Date.now() };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "The transfer could not be saved." };
  }
}

export async function unlinkTransferAction(transactionId: string, _state: TransferFormState): Promise<TransferFormState> {
  void _state;
  try {
    const changed = getTransferRepository().unlink(transactionId);
    refresh(transactionId);
    return { success: changed ? "Transfer unlinked. Both transactions remain classified as transfers." : "This transaction was not linked.", revision: Date.now() };
  } catch {
    return { message: "The transfer could not be unlinked." };
  }
}

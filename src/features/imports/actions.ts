"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { decodeCsv, parseCsv } from "./csv";
import type { CsvMapping } from "./model";
import { parseSpreadsheet } from "./spreadsheet";
import { getImportRepository } from "./server-repository";
import { mappingFromFormData, mappingSchema } from "./validation";
import { getTransactionRepository } from "@/features/transactions/server-repository";

export interface ImportActionState { message?: string; errors?: Record<string, string[]>; }
export interface ImportInlineCategoryState { saved?: boolean; error?: string; }

function mappingHeadersValid(mapping: CsvMapping, headers: string[]) { return [mapping.dateColumn, mapping.descriptionColumn, mapping.amountColumn, mapping.merchantColumn].filter(Boolean).every((column) => headers.includes(column!)); }

export async function uploadCsvAction(_state: ImportActionState, formData: FormData): Promise<ImportActionState> {
  const file = formData.get("file"); const accountId = String(formData.get("accountId") ?? ""); const profileId = String(formData.get("profileId") ?? "");
  if (!(file instanceof File) || !file.name) return { message: "Choose a CSV or Excel file.", errors: { file: ["Import file is required"] } };
  if (file.size > 5 * 1024 * 1024) return { message: "The file is too large.", errors: { file: ["Maximum file size is 5 MB"] } };
  const extension = file.name.toLocaleLowerCase("en").match(/\.(csv|xlsx|xls)$/)?.[1];
  if (!extension) return { message: "Choose a .csv, .xls, or .xlsx file.", errors: { file: ["Unsupported file extension"] } };
  if (!getTransactionRepository().listOptions().accounts.some((account) => account.id === accountId)) return { message: "Select an active account.", errors: { accountId: ["Account is required"] } };
  let csv; let bytes: Uint8Array;
  try { bytes = new Uint8Array(await file.arrayBuffer()); csv = extension === "csv" ? parseCsv(decodeCsv(bytes)) : parseSpreadsheet(bytes); }
  catch (error) { return { message: error instanceof Error ? error.message : "The file could not be read." }; }
  const repository = getImportRepository(); const importId = repository.stage(file.name, createHash("sha256").update(bytes).digest("hex"), accountId, csv, extension === "csv" ? "csv" : "spreadsheet");
  if (profileId) {
    const profile = repository.findProfile(profileId); if (!profile || !mappingHeadersValid(profile.configuration, csv.headers)) return { message: "The selected profile does not match this file's headers." };
    repository.prepare(importId, { ...profile.configuration, delimiter: csv.delimiter }, undefined, profile.id); revalidatePath("/imports"); redirect(`/imports/${importId}/preview`);
  }
  redirect(`/imports/${importId}/map`);
}

export async function mapImportAction(importId: string, _state: ImportActionState, formData: FormData): Promise<ImportActionState> {
  const repository = getImportRepository(); const detail = repository.findById(importId); if (!detail) return { message: "Import not found." };
  const result = mappingSchema.safeParse(mappingFromFormData(formData));
  if (!result.success) return { message: "Check the column mapping.", errors: result.error.flatten().fieldErrors };
  const headers = Object.keys(detail.rows[0]?.original ?? {}); if (!mappingHeadersValid(result.data, headers)) return { message: "A mapped column is not present in the file." };
  const saveProfile = formData.get("saveProfile") === "on"; const profileName = String(formData.get("profileName") ?? "").trim();
  if (saveProfile && !profileName) return { message: "Enter a profile name.", errors: { profileName: ["Profile name is required"] } };
  try { repository.prepare(importId, result.data, saveProfile ? profileName : undefined); }
  catch (error) { console.error("Failed to prepare import", error); return { message: "The import could not be prepared. Please try again." }; }
  revalidatePath("/imports"); redirect(`/imports/${importId}/preview`);
}

export async function confirmImportAction(formData: FormData): Promise<void> {
  const importId = String(formData.get("importId") ?? ""); const selectedRowIds = formData.getAll("selectedRowId").map(String); let completed = false;
  try { completed = Boolean(getImportRepository().confirm(importId, selectedRowIds)); } catch (error) { console.error("Failed to confirm import", error); }
  revalidatePath("/imports"); revalidatePath("/transactions"); redirect(completed ? `/imports/${importId}/preview?status=completed` : "/imports?status=confirm-error");
}

export async function updateImportRowCategoryAction(importId: string, rowId: string, formData: FormData): Promise<ImportInlineCategoryState> {
  const categoryValue = formData.get("categoryId");
  if (typeof categoryValue !== "string") return { error: "Invalid category." };
  const categoryId = categoryValue.trim() || null;
  const categories = getTransactionRepository().listOptions().categories;
  if (categoryId && !categories.some((category) => category.id === categoryId)) return { error: "Category unavailable." };
  try {
    if (!getImportRepository().updateSuggestedCategory(importId, rowId, categoryId)) return { error: "Import row unavailable." };
  } catch (error) {
    console.error("Failed to update import row category", error);
    return { error: error instanceof Error ? error.message : "Could not save category." };
  }
  revalidatePath(`/imports/${importId}/preview`);
  return { saved: true };
}

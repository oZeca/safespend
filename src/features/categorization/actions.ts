"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCategorizationRepository } from "./server-repository";
import { ruleInputFromFormData, ruleInputSchema } from "./validation";
import type { CategorizationRule, RuleMatchPreview, RuleWrite } from "./model";

export interface RuleFormState { message?: string; errors?: Record<string, string[]>; preview?: RuleMatchPreview; values?: Record<string, string>; }
function valuesFromFormData(formData: FormData): Record<string, string> { return Object.fromEntries(["name", "priority", "matchField", "matchType", "pattern", "categoryId", "transactionType", "isEnabled"].map((key) => [key, String(formData.get(key) ?? "")])); }
function validate(formData: FormData): { success: false; state: RuleFormState } | { success: true; data: RuleWrite; categoryName: string } {
  const result = ruleInputSchema.safeParse(ruleInputFromFormData(formData)); if (!result.success) return { success: false, state: { message: "Check the highlighted fields.", errors: result.error.flatten().fieldErrors, values: valuesFromFormData(formData) } };
  const category = getCategorizationRepository().categories().find((item) => item.id === result.data.categoryId); if (!category) return { success: false, state: { message: "Select an active category.", errors: { categoryId: ["The selected category is unavailable"] }, values: valuesFromFormData(formData) } };
  return { success: true, categoryName: category.name, data: { ...result.data, transactionType: result.data.transactionType || null } };
}
export async function previewRuleAction(_state: RuleFormState, formData: FormData): Promise<RuleFormState> {
  const result = validate(formData); if (!result.success) return result.state; const temporary: CategorizationRule = { id: "preview", ...result.data, categoryName: result.categoryName, createdAt: "", updatedAt: "" };
  return { message: "Preview updated.", preview: getCategorizationRepository().preview(temporary), values: valuesFromFormData(formData) };
}
export async function createRuleAction(_state: RuleFormState, formData: FormData): Promise<RuleFormState> {
  const result = validate(formData); if (!result.success) return result.state;
  try { getCategorizationRepository().create(result.data); } catch (error) { console.error("Failed to create rule", error); return { message: "The rule could not be created.", values: valuesFromFormData(formData) }; }
  revalidatePath("/rules"); redirect("/rules?status=created");
}
export async function updateRuleAction(id: string, _state: RuleFormState, formData: FormData): Promise<RuleFormState> {
  const result = validate(formData); if (!result.success) return result.state;
  try { if (!getCategorizationRepository().update(id, result.data)) return { message: "This rule no longer exists." }; } catch (error) { console.error("Failed to update rule", error); return { message: "The rule could not be updated." }; }
  revalidatePath("/rules"); redirect("/rules?status=updated");
}
export async function toggleRuleAction(formData: FormData): Promise<void> { const id = String(formData.get("id") ?? ""); const enabled = formData.get("enabled") === "true"; let ok = false; try { ok = getCategorizationRepository().setEnabled(id, enabled); } catch (error) { console.error("Failed to toggle rule", error); } revalidatePath("/rules"); redirect(`/rules?status=${ok ? (enabled ? "enabled" : "disabled") : "action-error"}`); }
export async function deleteRuleAction(formData: FormData): Promise<void> { const id = String(formData.get("id") ?? ""); let ok = false; try { ok = getCategorizationRepository().delete(id); } catch (error) { console.error("Failed to delete rule", error); } revalidatePath("/rules"); redirect(`/rules?status=${ok ? "deleted" : "action-error"}`); }
export async function bulkApplyRulesAction(): Promise<void> { let count: number | null = null; try { count = getCategorizationRepository().bulkApply(); } catch (error) { console.error("Failed to bulk apply rules", error); } revalidatePath("/rules"); revalidatePath("/transactions"); redirect(count === null ? "/rules?status=action-error" : `/rules?status=applied&count=${count}`); }

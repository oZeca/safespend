import { z } from "zod";
import { parseMoneyToCents } from "@/features/accounts/validation";
import type { SplitWrite } from "./model";

const splitRowSchema = z.object({
  categoryId: z.string().trim().min(1, "Choose a category"),
  amount: z.string().trim().min(1, "Enter an amount"),
  notes: z.string().trim().max(500, "Notes must be 500 characters or fewer")
});

export type SplitInput = z.infer<typeof splitRowSchema>;

export function validateSplitInput(raw: unknown, parentAmountCents: number):
  | { success: true; data: SplitWrite[] }
  | { success: false; message: string } {
  const parsed = z.array(splitRowSchema).min(2, "Add at least two split rows").safeParse(raw);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Check the split rows." };
  const splitWrites: SplitWrite[] = [];
  for (const row of parsed.data) {
    const amountCents = parseMoneyToCents(row.amount);
    if (amountCents === null || amountCents === 0) return { success: false, message: "Every split needs a valid, non-zero amount." };
    if (Math.sign(amountCents) !== Math.sign(parentAmountCents)) return { success: false, message: "Every split must use the same sign as the transaction." };
    splitWrites.push({ categoryId: row.categoryId, amountCents, notes: row.notes || null });
  }
  if (splitWrites.reduce((sum, split) => sum + split.amountCents, 0) !== parentAmountCents) {
    return { success: false, message: "Split amounts must add up exactly to the transaction amount." };
  }
  return { success: true, data: splitWrites };
}

export function parseSplitFormData(formData: FormData): unknown {
  const value = formData.get("splits");
  if (typeof value !== "string") return null;
  try { return JSON.parse(value); } catch { return null; }
}

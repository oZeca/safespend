import { z } from "zod";
import { transactionTypes } from "@/features/transactions/model";
import { categorizationRulePatternMaxLength, matchFields, matchTypes } from "./model";

export const ruleInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be 100 characters or fewer"), matchField: z.enum(matchFields), matchType: z.enum(matchTypes),
  pattern: z.string().trim().min(1, "Pattern is required").max(categorizationRulePatternMaxLength, `Pattern must be ${categorizationRulePatternMaxLength.toLocaleString("en")} characters or fewer`), categoryId: z.string().trim().min(1, "Select a category"),
  transactionType: z.union([z.enum(transactionTypes), z.literal("")]), priority: z.coerce.number().int("Priority must be a whole number").min(0, "Priority cannot be negative").max(10000, "Priority must be 10000 or less"),
  isEnabled: z.preprocess((value) => value === "on" || value === true, z.boolean())
}).superRefine((value, context) => { if (value.matchType === "regex") { try { new RegExp(value.pattern, "i"); } catch { context.addIssue({ code: z.ZodIssueCode.custom, path: ["pattern"], message: "Enter a valid regular expression" }); } } });

export function ruleInputFromFormData(formData: FormData) { return { name: formData.get("name"), matchField: formData.get("matchField"), matchType: formData.get("matchType"), pattern: formData.get("pattern"), categoryId: formData.get("categoryId"), transactionType: formData.get("transactionType"), priority: formData.get("priority"), isEnabled: formData.get("isEnabled") }; }

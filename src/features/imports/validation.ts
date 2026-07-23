import { z } from "zod";
import { dateFormats, decimalFormats } from "./model";

export const mappingSchema = z.object({
  dateColumn: z.string().min(1, "Select the date column"), descriptionColumn: z.string().min(1, "Select the description column"), amountColumn: z.string().min(1, "Select the amount column"),
  merchantColumn: z.string().nullable(), dateFormat: z.enum(dateFormats), decimalFormat: z.enum(decimalFormats), delimiter: z.string().min(1)
}).superRefine((value, context) => {
  const required = [value.dateColumn, value.descriptionColumn, value.amountColumn]; if (new Set(required).size !== required.length) context.addIssue({ code: z.ZodIssueCode.custom, message: "Date, description, and amount must use different columns" });
});

export function mappingFromFormData(formData: FormData) {
  return { dateColumn: String(formData.get("dateColumn") ?? ""), descriptionColumn: String(formData.get("descriptionColumn") ?? ""), amountColumn: String(formData.get("amountColumn") ?? ""), merchantColumn: String(formData.get("merchantColumn") ?? "") || null,
    dateFormat: String(formData.get("dateFormat") ?? ""), decimalFormat: String(formData.get("decimalFormat") ?? ""), delimiter: String(formData.get("delimiter") ?? ",") };
}

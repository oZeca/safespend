import { createHash } from "node:crypto";
import type { CsvMapping, DateFormat, DecimalFormat, NormalizedImportRow } from "./model";
import { normalizeDescription } from "@/features/transactions/validation";

export function parseLocalizedMoney(value: string, format: DecimalFormat): number | null {
  let cleaned = value.trim().replace(/[\s\u00A0€$£]/g, ""); let negative = false;
  if (/^\(.*\)$/.test(cleaned)) { negative = true; cleaned = cleaned.slice(1, -1); }
  if (cleaned.startsWith("-")) { negative = true; cleaned = cleaned.slice(1); } else if (cleaned.startsWith("+")) cleaned = cleaned.slice(1);
  const decimal = format === "decimal_comma" ? "," : "."; const thousands = format === "decimal_comma" ? "." : ",";
  cleaned = cleaned.split(thousands).join(""); const parts = cleaned.split(decimal);
  if (parts.length > 2 || !/^\d+$/.test(parts[0] ?? "") || (parts[1] !== undefined && !/^\d{1,2}$/.test(parts[1]))) return null;
  const cents = BigInt(parts[0]) * 100n + BigInt((parts[1] ?? "").padEnd(2, "0") || "0"); const signed = negative ? -cents : cents;
  if (signed > BigInt(Number.MAX_SAFE_INTEGER) || signed < BigInt(Number.MIN_SAFE_INTEGER)) return null;
  return Number(signed);
}

export function parseLocalizedDate(value: string, format: DateFormat): string | null {
  const pattern = format === "YYYY-MM-DD" ? /^(\d{4})-(\d{2})-(\d{2})$/ : format === "DD\/MM\/YYYY" ? /^(\d{2})\/(\d{2})\/(\d{4})$/ : /^(\d{2})-(\d{2})-(\d{4})$/;
  const match = pattern.exec(value.trim()); if (!match) return null;
  const [year, month, day] = format === "YYYY-MM-DD" ? [Number(match[1]), Number(match[2]), Number(match[3])] : [Number(match[3]), Number(match[2]), Number(match[1])];
  const date = new Date(Date.UTC(year, month - 1, day)); if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function fingerprintRow(accountId: string, rowNumber: number, date: string, amountCents: number, description: string): string {
  return createHash("sha256").update(`${accountId}|${date}|${amountCents}|${normalizeDescription(description)}|${rowNumber}`).digest("hex");
}

export function normalizeImportRow(original: Record<string, string>, mapping: CsvMapping, accountId: string, rowNumber: number): NormalizedImportRow {
  const date = parseLocalizedDate(original[mapping.dateColumn] ?? "", mapping.dateFormat); const description = (original[mapping.descriptionColumn] ?? "").trim();
  const amountCents = parseLocalizedMoney(original[mapping.amountColumn] ?? "", mapping.decimalFormat); const errors: string[] = [];
  if (!date) errors.push("Invalid date"); if (!description) errors.push("Description is required"); if (description.length > 250) errors.push("Description exceeds 250 characters");
  if (amountCents === null || amountCents === 0) errors.push("Invalid or zero amount");
  const merchantValue = mapping.merchantColumn ? (original[mapping.merchantColumn] ?? "").trim() : ""; if (merchantValue.length > 150) errors.push("Merchant exceeds 150 characters");
  return { date, description: description || null, merchant: merchantValue || null, amountCents, fingerprint: errors.length || !date || amountCents === null || !description ? null : fingerprintRow(accountId, rowNumber, date, amountCents, description), error: errors.length ? errors.join("; ") : null };
}

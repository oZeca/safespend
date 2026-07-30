import { z } from "zod";
import { accountTypes, balanceModes } from "./model";

const MAX_CENTS = Number.MAX_SAFE_INTEGER;

export function parseMoneyToCents(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(normalized);
  if (!match) return null;
  const cents = BigInt(match[2]) * 100n + BigInt((match[3] ?? "").padEnd(2, "0") || "0");
  const signed = match[1] ? -cents : cents;
  if (signed > BigInt(MAX_CENTS) || signed < BigInt(-MAX_CENTS)) return null;
  return Number(signed);
}

export function formatMoneyInput(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const absolute = Math.abs(cents);
  return `${sign}${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, "0")}`;
}

const checkbox = z.preprocess((value) => value === "on" || value === true, z.boolean());
const balance = z.string().trim().refine((value) => parseMoneyToCents(value) !== null, "Enter a valid amount with at most 2 decimal places");
const calendarDate = z.string().refine((value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number); const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}, "Enter a valid opening date");

export const accountInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be 100 characters or fewer"),
  institution: z.string().trim().max(100, "Institution must be 100 characters or fewer"),
  accountType: z.enum(accountTypes, { message: "Select an account type" }),
  currency: z.literal("EUR", { message: "Only EUR is currently supported" }),
  currentBalance: balance,
  balanceMode: z.enum(balanceModes), openingBalance: balance, openingBalanceDate: calendarDate,
  includedInAvailableCash: checkbox,
  includedInNetWorth: checkbox
});

export type AccountInput = z.infer<typeof accountInputSchema>;

export function accountInputFromFormData(formData: FormData): Record<string, unknown> {
  return {
    name: formData.get("name"), institution: formData.get("institution"), accountType: formData.get("accountType"), currency: formData.get("currency"),
    currentBalance: formData.get("currentBalance"), balanceMode: formData.get("balanceMode"), openingBalance: formData.get("openingBalance"), openingBalanceDate: formData.get("openingBalanceDate"),
    includedInAvailableCash: formData.get("includedInAvailableCash"), includedInNetWorth: formData.get("includedInNetWorth")
  };
}

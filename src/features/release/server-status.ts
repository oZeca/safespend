import "server-only";
import { getAppDatabase } from "@/db/app-database";
import { getDatabaseHealth } from "@/db/queries/health";

export function getReleaseStatus() {
  const database = getAppDatabase();
  const settingRows = database.prepare("SELECT key, value_json AS valueJson FROM settings WHERE key IN ('default_currency', 'financial_month_start_day')").all() as Array<{ key: string; valueJson: string }>;
  const settings = Object.fromEntries(settingRows.map((row) => [row.key, JSON.parse(row.valueJson) as unknown]));
  return {
    ...getDatabaseHealth(database),
    defaultCurrency: typeof settings.default_currency === "string" ? settings.default_currency : "EUR",
    financialMonthStartDay: Number.isInteger(settings.financial_month_start_day) ? Number(settings.financial_month_start_day) : 1
  };
}

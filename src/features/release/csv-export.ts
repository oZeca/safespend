import type Database from "better-sqlite3";

interface ExportRow {
  id: string; date: string; account: string; description: string; merchant: string | null; amountCents: number; transactionType: string;
  category: string | null; notes: string | null; isRecurring: number; isExceptional: number; excludedFromForecastBaseline: number; excludedFromAccountBalance: number;
  sourceImportId: string | null; sourceRowNumber: number | null;
}

function csvCell(value: string | number | null): string {
  const text = value === null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
}

function decimalAmount(cents: number) {
  const absolute = Math.abs(cents);
  return `${cents < 0 ? "-" : ""}${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, "0")}`;
}

export function exportTransactionsCsv(database: Database.Database): string {
  const rows = database.prepare(`SELECT t.id, t.date, a.name AS account, t.description, t.merchant, t.amount_cents AS amountCents,
    t.transaction_type AS transactionType, c.name AS category, t.notes, t.is_recurring AS isRecurring, t.is_exceptional AS isExceptional,
    t.excluded_from_forecast_baseline AS excludedFromForecastBaseline, t.excluded_from_account_balance AS excludedFromAccountBalance, t.source_import_id AS sourceImportId, t.source_row_number AS sourceRowNumber
    FROM transactions t JOIN accounts a ON a.id = t.account_id LEFT JOIN categories c ON c.id = t.category_id
    WHERE t.is_deleted = 0 ORDER BY t.date, t.created_at, t.id`).all() as ExportRow[];
  const splitStatement = database.prepare(`SELECT c.name AS category, s.amount_cents AS amountCents, s.notes FROM transaction_splits s
    JOIN categories c ON c.id = s.category_id WHERE s.transaction_id = ? ORDER BY s.created_at, s.id`);
  const transferStatement = database.prepare(`SELECT CASE WHEN source_transaction_id = @id THEN destination_transaction_id ELSE source_transaction_id END
    FROM transfer_links WHERE source_transaction_id = @id OR destination_transaction_id = @id LIMIT 1`);
  const headers = ["id", "date", "account", "description", "merchant", "amount", "type", "category", "splits_json", "notes", "recurring", "exceptional", "excluded_from_forecast_baseline", "excluded_from_account_balance", "transfer_counterpart_id", "source_import_id", "source_row_number"];
  const lines = [headers.join(",")];
  for (const row of rows) {
    const splits = splitStatement.all(row.id) as Array<{ category: string; amountCents: number; notes: string | null }>;
    const splitJson = splits.length ? JSON.stringify(splits.map((split) => ({ category: split.category, amount: decimalAmount(split.amountCents), notes: split.notes }))) : "";
    const counterpart = transferStatement.pluck().get({ id: row.id }) as string | null | undefined;
    lines.push([
      row.id, row.date, row.account, row.description, row.merchant, decimalAmount(row.amountCents), row.transactionType, row.category,
      splitJson, row.notes, row.isRecurring, row.isExceptional, row.excludedFromForecastBaseline, row.excludedFromAccountBalance, counterpart ?? null, row.sourceImportId, row.sourceRowNumber
    ].map(csvCell).join(","));
  }
  return `${lines.join("\r\n")}\r\n`;
}

export const dateFormats = ["YYYY-MM-DD", "YYYY-MM-DD hh:mm:ss", "DD/MM/YYYY", "DD-MM-YYYY"] as const;
export const decimalFormats = ["decimal_comma", "decimal_dot"] as const;
export type DateFormat = (typeof dateFormats)[number];
export type DecimalFormat = (typeof decimalFormats)[number];

export interface CsvMapping { dateColumn: string; descriptionColumn: string; amountColumn: string; merchantColumn: string | null; dateFormat: DateFormat; decimalFormat: DecimalFormat; delimiter: string; }
export interface ParsedCsv { headers: string[]; rows: Record<string, string>[]; delimiter: string; }
export interface NormalizedImportRow { date: string | null; description: string | null; merchant: string | null; amountCents: number | null; fingerprint: string | null; error: string | null; }
export interface ImportSummary { id: string; fileName: string; status: string; rowCount: number; importedCount: number; skippedCount: number; errorCount: number; createdAt: string; accountName: string; profileName: string | null; }
export interface ImportPreviewRow extends NormalizedImportRow { id: string; rowNumber: number; original: Record<string, string>; isExactDuplicate: boolean; matchedRuleId: string | null; matchedRuleName: string | null; suggestedCategoryId: string | null; suggestedCategoryName: string | null; suggestedTransactionType: string | null; }
export interface ImportDetail extends ImportSummary { accountId: string; profileId: string | null; detectedDelimiter: string; rows: ImportPreviewRow[]; }
export interface ImportProfile { id: string; name: string; configuration: CsvMapping; }

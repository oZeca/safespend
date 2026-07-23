import type { ParsedCsv } from "./model";

const delimiters = [",", ";", "\t"];

function countDelimiter(line: string, delimiter: string): number {
  let count = 0; let quoted = false;
  for (let index = 0; index < line.length; index += 1) { if (line[index] === '"') quoted = !quoted; else if (!quoted && line[index] === delimiter) count += 1; }
  return count;
}

export function detectDelimiter(text: string): string {
  const line = text.replace(/^\uFEFF/, "").split(/\r?\n/).find((item) => item.trim()) ?? "";
  return delimiters.map((delimiter) => ({ delimiter, count: countDelimiter(line, delimiter) })).sort((a, b) => b.count - a.count)[0]?.delimiter ?? ",";
}

export function parseCsv(text: string, maximumRows = 5000): ParsedCsv {
  const cleaned = text.replace(/^\uFEFF/, ""); const delimiter = detectDelimiter(cleaned); const records: string[][] = [];
  let record: string[] = []; let field = ""; let quoted = false;
  for (let index = 0; index < cleaned.length; index += 1) {
    const character = cleaned[index];
    if (quoted) { if (character === '"' && cleaned[index + 1] === '"') { field += '"'; index += 1; } else if (character === '"') quoted = false; else field += character; }
    else if (character === '"' && field.length === 0) quoted = true;
    else if (character === delimiter) { record.push(field); field = ""; }
    else if (character === "\n" || character === "\r") { if (character === "\r" && cleaned[index + 1] === "\n") index += 1; record.push(field); if (record.some((value) => value.length > 0)) records.push(record); record = []; field = ""; }
    else field += character;
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted field");
  record.push(field); if (record.some((value) => value.length > 0)) records.push(record);
  if (records.length < 2) throw new Error("CSV must contain a header and at least one data row");
  const headers = records[0].map((header) => header.trim());
  if (headers.some((header) => !header)) throw new Error("CSV headers cannot be empty");
  if (new Set(headers).size !== headers.length) throw new Error("CSV headers must be unique");
  const data = records.slice(1); if (data.length > maximumRows) throw new Error(`CSV exceeds the ${maximumRows} row limit`);
  return { headers, delimiter, rows: data.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]))) };
}

import type { ParsedCsv } from "./model";

const delimiters = [",", ";", "\t"];

function detectBomlessUtf16(bytes: Uint8Array): "utf-16le" | "utf-16be" | null {
  const sampleLength = Math.min(bytes.length - (bytes.length % 2), 4096);
  if (sampleLength < 8) return null;

  let evenNulls = 0;
  let oddNulls = 0;
  const pairCount = sampleLength / 2;
  for (let index = 0; index < sampleLength; index += 2) {
    if (bytes[index] === 0) evenNulls += 1;
    if (bytes[index + 1] === 0) oddNulls += 1;
  }

  // Latin-based CSV exports have null high bytes for most characters. Requiring
  // the opposite byte position to contain almost no nulls avoids misclassifying
  // ordinary UTF-8 and Windows-1252 text.
  if (oddNulls / pairCount >= 0.3 && evenNulls / pairCount <= 0.05) return "utf-16le";
  if (evenNulls / pairCount >= 0.3 && oddNulls / pairCount <= 0.05) return "utf-16be";
  return null;
}

export function decodeCsv(bytes: Uint8Array): string {
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder("utf-16le", { fatal: true }).decode(bytes);
  }

  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder("utf-16be", { fatal: true }).decode(bytes);
  }

  const bomlessUtf16 = detectBomlessUtf16(bytes);
  if (bomlessUtf16) return new TextDecoder(bomlessUtf16, { fatal: true }).decode(bytes);

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    // Windows-1252 is still common in CSV exports from banks and spreadsheet apps.
    return new TextDecoder("windows-1252", { fatal: true }).decode(bytes);
  }
}

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

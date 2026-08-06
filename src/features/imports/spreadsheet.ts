import * as XLSX from "xlsx";
import type { ParsedCsv } from "./model";

function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function parseSpreadsheet(bytes: Uint8Array, maximumRows = 5000): ParsedCsv {
  const workbook = XLSX.read(bytes, { type: "array", cellDates: false });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) throw new Error("The spreadsheet does not contain a worksheet");

  const records = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[firstSheetName], {
    header: 1,
    defval: "",
    raw: false,
    blankrows: true,
  });
  if (records.length < 2) throw new Error("The first worksheet must contain a header and at least one data row");

  const populatedCellCount = (row: unknown[]) => row.map(cellText).filter(Boolean).length;
  const maximumPopulatedCells = Math.max(...records.map(populatedCellCount));
  const headerRowIndex = records.findIndex((row) => populatedCellCount(row) === maximumPopulatedCells);
  const headers = records[headerRowIndex].map(cellText);
  if (headers.some((header) => !header)) throw new Error("Spreadsheet headers cannot be empty");
  if (new Set(headers).size !== headers.length) throw new Error("Spreadsheet headers must be unique");

  const data = records
    .map((values, index) => ({ values, index }))
    .slice(headerRowIndex + 1)
    .filter(({ values }) => populatedCellCount(values) > 0);
  if (data.length > maximumRows) throw new Error(`Spreadsheet exceeds the ${maximumRows} row limit`);
  return {
    headers,
    delimiter: ",",
    rowNumbers: data.map(({ index }) => index + 1),
    rows: data.map(({ values }) => Object.fromEntries(headers.map((header, index) => [header, cellText(values[index])]))),
  };
}

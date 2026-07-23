import { z } from "zod";

export const RESTORE_CONFIRMATION = "RESTORE";
export const MAX_RESTORE_BYTES = 100 * 1024 * 1024;

export const restoreConfirmationSchema = z.literal(RESTORE_CONFIRMATION, {
  errorMap: () => ({ message: `Type ${RESTORE_CONFIRMATION} exactly to confirm` })
});

export function hasSqliteHeader(bytes: Uint8Array): boolean {
  if (bytes.byteLength < 16) return false;
  return new TextDecoder("ascii").decode(bytes.slice(0, 16)) === "SQLite format 3\u0000";
}

export function validDatabaseFileName(name: string): boolean {
  return /\.(db|sqlite|sqlite3)$/i.test(name);
}

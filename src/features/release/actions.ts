"use server";

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { replaceAppDatabase } from "@/db/app-database";
import { validateAndMigrateRestoreCandidate } from "./backup";
import { hasSqliteHeader, MAX_RESTORE_BYTES, restoreConfirmationSchema, validDatabaseFileName } from "./validation";

export interface RestoreState { message?: string; errors?: Record<string, string[]>; }

export async function restoreDatabaseAction(_state: RestoreState, formData: FormData): Promise<RestoreState> {
  const confirmation = restoreConfirmationSchema.safeParse(String(formData.get("confirmation") ?? ""));
  if (!confirmation.success) return { message: "Restore confirmation is required.", errors: { confirmation: [confirmation.error.issues[0]?.message ?? "Invalid confirmation"] } };
  const file = formData.get("database");
  if (!(file instanceof File) || !file.name) return { message: "Choose a SafeSpend database backup.", errors: { database: ["Database file is required"] } };
  if (!validDatabaseFileName(file.name)) return { message: "Choose a .db, .sqlite, or .sqlite3 file.", errors: { database: ["Unsupported file extension"] } };
  if (file.size > MAX_RESTORE_BYTES) return { message: "The backup is too large.", errors: { database: ["Maximum restore size is 100 MB"] } };
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasSqliteHeader(bytes)) return { message: "The uploaded file is not a SQLite database.", errors: { database: ["Invalid SQLite header"] } };
  const directory = mkdtempSync(path.join(tmpdir(), "safespend-restore-"));
  const candidate = path.join(directory, "candidate.db");
  try {
    writeFileSync(candidate, bytes);
    validateAndMigrateRestoreCandidate(candidate);
    replaceAppDatabase(candidate);
  } catch (error) {
    console.error("Failed to restore database", error);
    return { message: error instanceof Error ? error.message : "The database could not be restored." };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
  revalidatePath("/", "layout");
  redirect("/settings?status=restored");
}

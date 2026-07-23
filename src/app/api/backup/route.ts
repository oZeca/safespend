import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { getAppDatabase } from "@/db/app-database";
import { createDatabaseBackup } from "@/features/release/backup";
import { localDateString } from "@/lib/dates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const directory = mkdtempSync(path.join(tmpdir(), "safespend-backup-"));
  const destination = path.join(directory, "safespend.db");
  try {
    await createDatabaseBackup(getAppDatabase(), destination);
    const bytes = readFileSync(destination);
    return new Response(bytes, {
      headers: {
        "Content-Type": "application/vnd.sqlite3",
        "Content-Disposition": `attachment; filename="safespend-${localDateString()}-backup.db"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    console.error("Failed to create database backup", error);
    return Response.json({ error: "The database backup could not be created." }, { status: 500 });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

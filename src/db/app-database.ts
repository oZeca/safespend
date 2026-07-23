import "server-only";

import type Database from "better-sqlite3";
import { copyFileSync, existsSync, renameSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { openDatabase, resolveDatabasePath } from "./connection";

declare global {
  var safespendDatabase: Database.Database | undefined;
}

export function getAppDatabase(): Database.Database {
  if (!globalThis.safespendDatabase) globalThis.safespendDatabase = openDatabase();
  return globalThis.safespendDatabase;
}

export function replaceAppDatabase(validatedCandidatePath: string): { recoveryPath: string | null } {
  const databasePath = resolveDatabasePath();
  const suffix = `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`;
  const stagedPath = path.join(path.dirname(databasePath), `.safespend-restore-${suffix}.db`);
  const parsedPath = path.parse(databasePath);
  const recoveryPath = existsSync(databasePath) ? path.join(parsedPath.dir, `${parsedPath.name}.pre-restore-${suffix}${parsedPath.ext || ".db"}`) : null;
  copyFileSync(validatedCandidatePath, stagedPath);
  if (globalThis.safespendDatabase) {
    globalThis.safespendDatabase.close();
    globalThis.safespendDatabase = undefined;
  }
  try {
    if (recoveryPath) {
      renameSync(databasePath, recoveryPath);
      for (const sidecar of ["-wal", "-shm"]) if (existsSync(`${databasePath}${sidecar}`)) renameSync(`${databasePath}${sidecar}`, `${recoveryPath}${sidecar}`);
    }
    renameSync(stagedPath, databasePath);
    globalThis.safespendDatabase = openDatabase(databasePath);
    return { recoveryPath };
  } catch (error) {
    if (existsSync(databasePath)) renameSync(databasePath, `${databasePath}.failed-restore-${suffix}`);
    if (recoveryPath && existsSync(recoveryPath)) renameSync(recoveryPath, databasePath);
    globalThis.safespendDatabase = openDatabase(databasePath);
    throw error;
  }
}

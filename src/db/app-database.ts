import "server-only";

import type Database from "better-sqlite3";
import { openDatabase } from "./connection";

declare global {
  var safespendDatabase: Database.Database | undefined;
}

export function getAppDatabase(): Database.Database {
  if (!globalThis.safespendDatabase) globalThis.safespendDatabase = openDatabase();
  return globalThis.safespendDatabase;
}

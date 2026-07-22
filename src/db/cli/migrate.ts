import { openDatabase, resolveDatabasePath } from "../connection";
import { runMigrations } from "../migrate";

const database = openDatabase();
try {
  const result = runMigrations(database);
  console.log(`Database: ${resolveDatabasePath()}`);
  console.log(result.applied.length ? `Applied: ${result.applied.join(", ")}` : "Database is up to date.");
} finally { database.close(); }

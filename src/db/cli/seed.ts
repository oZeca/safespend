import { openDatabase, resolveDatabasePath } from "../connection";
import { runMigrations } from "../migrate";

const database = openDatabase();
try {
  runMigrations(database);
  console.log(`No Task 1 seed data required. Database ready: ${resolveDatabasePath()}`);
} finally { database.close(); }

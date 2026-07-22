import { openDatabase, resolveDatabasePath } from "../connection";
import { runMigrations } from "../migrate";

const database = openDatabase();
try {
  runMigrations(database);
  console.log(`Default data and migrations ready: ${resolveDatabasePath()}`);
} finally { database.close(); }

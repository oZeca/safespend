import { openDatabase, resolveDatabasePath } from "../connection";
import { seedDemoData } from "../demo-seed";
import { runMigrations } from "../migrate";
import { localDateString } from "../../lib/dates";

const database = openDatabase();
try {
  runMigrations(database);
  if (process.argv.includes("--demo")) {
    const result = seedDemoData(database, localDateString());
    console.log(`Synthetic demo data ready: ${resolveDatabasePath()} (${result.transactionsCreated} transactions added)`);
  } else {
    console.log(`Default data and migrations ready: ${resolveDatabasePath()}. Pass --demo to add synthetic demo data.`);
  }
} finally { database.close(); }

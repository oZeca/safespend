import { existsSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { assertSafeE2eDatabasePath } from "../src/test/e2e-database";

const databasePath = assertSafeE2eDatabasePath(process.env.DATABASE_PATH ?? "");
const directory = path.dirname(databasePath);
const databaseName = path.basename(databasePath);

if (existsSync(directory)) {
  for (const file of readdirSync(directory)) {
    if (file === databaseName || file === `${databaseName}-wal` || file === `${databaseName}-shm` || file.startsWith(`${path.parse(databaseName).name}.pre-restore-`)) {
      rmSync(path.join(directory, file), { force: true });
    }
  }
}

console.log(`Prepared isolated E2E database: ${databasePath}`);

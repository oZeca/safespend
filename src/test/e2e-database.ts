import path from "node:path";

export const E2E_DATABASE_PATH = path.join(process.cwd(), ".playwright", "safespend-e2e.db");

export function assertSafeE2eDatabasePath(databasePath: string): string {
  const resolvedPath = path.resolve(databasePath);
  const expectedPath = path.resolve(E2E_DATABASE_PATH);
  const applicationPath = path.resolve(process.cwd(), "data", "safespend.db");

  if (resolvedPath === applicationPath) {
    throw new Error(`Refusing to run E2E tests against the application database: ${applicationPath}`);
  }

  if (resolvedPath !== expectedPath) {
    throw new Error(`E2E database must be the dedicated test database: ${expectedPath}`);
  }

  return resolvedPath;
}

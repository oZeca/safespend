import path from "node:path";
import { describe, expect, it } from "vitest";
import { assertSafeE2eDatabasePath, E2E_DATABASE_PATH } from "./e2e-database";

describe("E2E database safety", () => {
  it("accepts only the dedicated Playwright database", () => {
    expect(assertSafeE2eDatabasePath(E2E_DATABASE_PATH)).toBe(path.resolve(E2E_DATABASE_PATH));
    expect(() => assertSafeE2eDatabasePath(path.join(process.cwd(), "data", "safespend.db"))).toThrow(
      "Refusing to run E2E tests against the application database",
    );
    expect(() => assertSafeE2eDatabasePath(path.join(process.cwd(), "data", "another.db"))).toThrow(
      "E2E database must be the dedicated test database",
    );
  });
});

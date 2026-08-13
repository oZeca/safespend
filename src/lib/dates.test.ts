import { describe, expect, it } from "vitest";
import { transactionDateRangePresets } from "@/lib/dates";

describe("transactionDateRangePresets", () => {
  it("builds deterministic calendar and rolling ranges", () => {
    expect(transactionDateRangePresets(new Date(2026, 7, 13))).toEqual([
      { id: "this-month", label: "This month", from: "2026-08-01", to: "2026-08-31" },
      { id: "last-month", label: "Last month", from: "2026-07-01", to: "2026-07-31" },
      { id: "last-30-days", label: "Last 30 days", from: "2026-07-15", to: "2026-08-13" },
      { id: "this-quarter", label: "This quarter", from: "2026-07-01", to: "2026-08-13" },
      { id: "year-to-date", label: "Year to date", from: "2026-01-01", to: "2026-08-13" },
      { id: "all-time", label: "All time" },
    ]);
  });

  it("crosses year boundaries and respects leap years", () => {
    const presets = transactionDateRangePresets(new Date(2024, 0, 10));
    expect(presets.find(({ id }) => id === "last-month")).toMatchObject({ from: "2023-12-01", to: "2023-12-31" });
    expect(presets.find(({ id }) => id === "last-30-days")).toMatchObject({ from: "2023-12-12", to: "2024-01-10" });
    expect(transactionDateRangePresets(new Date(2024, 1, 10))[0]).toMatchObject({ from: "2024-02-01", to: "2024-02-29" });
  });
});

import { describe, expect, test } from "vitest";
import { parseSidebarExpanded, parseTheme } from "./appearance-state";

describe("appearance preferences", () => {
  test("accepts supported themes and safely defaults invalid values", () => {
    expect(parseTheme("light")).toBe("light");
    expect(parseTheme("dark")).toBe("dark");
    expect(parseTheme("system")).toBe("system");
    expect(parseTheme("sepia")).toBe("system");
    expect(parseTheme(null)).toBe("system");
  });

  test("only the explicit true value expands the sidebar", () => {
    expect(parseSidebarExpanded("true")).toBe(true);
    expect(parseSidebarExpanded("false")).toBe(false);
    expect(parseSidebarExpanded(null)).toBe(false);
  });
});

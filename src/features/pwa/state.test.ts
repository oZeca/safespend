import { describe, expect, it } from "vitest";
import { isIosUserAgent, isStandaloneDisplay, pwaRegistrationEnabled } from "./state";

describe("PWA environment state", () => {
  it("detects iOS devices without treating desktop browsers as iOS", () => {
    expect(isIosUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)")).toBe(true);
    expect(isIosUserAgent("Mozilla/5.0 (X11; Linux x86_64) Chrome/140")).toBe(false);
  });

  it("recognizes browser and legacy iOS standalone modes", () => {
    expect(isStandaloneDisplay(true, false)).toBe(true);
    expect(isStandaloneDisplay(false, true)).toBe(true);
    expect(isStandaloneDisplay(false, false)).toBe(false);
  });

  it("enables registration in production or with the explicit override", () => {
    expect(pwaRegistrationEnabled("production", undefined)).toBe(true);
    expect(pwaRegistrationEnabled("development", "1")).toBe(true);
    expect(pwaRegistrationEnabled("development", undefined)).toBe(false);
  });
});

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const worker = readFileSync(path.join(process.cwd(), "public/sw.js"), "utf8");
const offlinePage = readFileSync(path.join(process.cwd(), "public/offline.html"), "utf8");

describe("PWA offline boundary", () => {
  it("pre-caches only the offline document and public branding", () => {
    expect(worker).toContain('"/offline.html"');
    expect(worker).toContain('"/icons/safespend-192.png"');
    expect(worker).not.toMatch(/\/dashboard|\/transactions|\/api\//);
    expect(worker).not.toContain("cache.put");
  });

  it("handles navigation only and supports controlled updates", () => {
    expect(worker).toContain('event.request.mode !== "navigate"');
    expect(worker).toContain('event.request.method !== "GET"');
    expect(worker).toContain('event.data?.type === "SKIP_WAITING"');
  });

  it("keeps the offline page self-contained and explains the privacy boundary", () => {
    expect(offlinePage).toContain("SafeSpend does not save financial pages");
    expect(offlinePage).not.toMatch(/<link[^>]+stylesheet/i);
    expect(offlinePage).not.toMatch(/<script[^>]+src=/i);
  });
});

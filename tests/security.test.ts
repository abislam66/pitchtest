import { describe, expect, it } from "vitest";
import { checkDemoCode, testModeEnabled } from "@/lib/testMode";
import { voterKey } from "@/lib/voterKey";

describe("test mode", () => {
  it("is off by default and when the code is missing or short", () => {
    expect(testModeEnabled({})).toBe(false);
    expect(testModeEnabled({ TEST_MODE: "true" })).toBe(false);
    expect(testModeEnabled({ TEST_MODE: "true", DEMO_ACCESS_CODE: "short" })).toBe(false);
    expect(testModeEnabled({ TEST_MODE: "false", DEMO_ACCESS_CODE: "long-enough-code" })).toBe(false);
  });
  it("requires the exact code", () => {
    const e = { TEST_MODE: "true", DEMO_ACCESS_CODE: "judge-demo-2026" };
    expect(checkDemoCode("judge-demo-2026", e)).toBe(true);
    expect(checkDemoCode("judge-demo-2027", e)).toBe(false);
    expect(checkDemoCode("", e)).toBe(false);
    expect(checkDemoCode(undefined, e)).toBe(false);
    expect(checkDemoCode("judge-demo-2026", { DEMO_ACCESS_CODE: "judge-demo-2026" })).toBe(false);
  });
});

describe("voterKey", () => {
  const base = { orderId: "o1", salt: "s" };
  it("is stable per voter and order", () => {
    expect(voterKey({ ...base, teracSubmissionId: "sub1" })).toBe(voterKey({ ...base, teracSubmissionId: "sub1" }));
  });
  it("differs across voters, orders and salts", () => {
    const k = voterKey({ ...base, teracSubmissionId: "sub1" });
    expect(voterKey({ ...base, teracSubmissionId: "sub2" })).not.toBe(k);
    expect(voterKey({ ...base, orderId: "o2", teracSubmissionId: "sub1" })).not.toBe(k);
    expect(voterKey({ ...base, salt: "t", teracSubmissionId: "sub1" })).not.toBe(k);
  });
  it("falls back to ip + user agent and never contains raw identifiers", () => {
    const k = voterKey({ ...base, ip: "1.2.3.4", userAgent: "UA" });
    expect(k).toMatch(/^[0-9a-f]{64}$/);
    expect(k).not.toContain("1.2.3.4");
  });
});

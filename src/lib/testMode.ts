import { timingSafeEqual } from "node:crypto";

/**
 * Judge-demo bypass. Off unless TEST_MODE=true AND a DEMO_ACCESS_CODE is configured,
 * and even then the caller must supply that code. Orders unlocked this way get status
 * "test" (never "paid") and are labelled as test data everywhere they appear.
 */
type Env = Record<string, string | undefined>;

export function testModeEnabled(e: Env = process.env): boolean {
  return e.TEST_MODE === "true" && !!e.DEMO_ACCESS_CODE && e.DEMO_ACCESS_CODE.length >= 8;
}

export function checkDemoCode(supplied: unknown, e: Env = process.env): boolean {
  if (!testModeEnabled(e) || typeof supplied !== "string") return false;
  const a = Buffer.from(supplied);
  const b = Buffer.from(e.DEMO_ACCESS_CODE!);
  return a.length === b.length && timingSafeEqual(a, b);
}

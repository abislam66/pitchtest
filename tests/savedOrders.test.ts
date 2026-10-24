import { describe, expect, it } from "vitest";
import {
  MAX_SAVED,
  STORAGE_KEY,
  dashboardHref,
  forgetOrders,
  mergeSaved,
  parseIdsParam,
  parseOrderRef,
  readSavedOrders,
  rememberOrder,
  sanitizeSaved,
  type SavedOrder,
} from "@/app/dashboard/savedOrders";

const A = "9bf3745e-45a6-427d-91bf-f607bfd76c49";
const B = "11111111-2222-4333-8444-555555555555";
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

function memoryStorage(initial?: string) {
  const data = new Map<string, string>();
  if (initial !== undefined) data.set(STORAGE_KEY, initial);
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  };
}

describe("parseOrderRef", () => {
  it("accepts a bare UUID (any case) and lowercases it", () => {
    expect(parseOrderRef(A)).toBe(A);
    expect(parseOrderRef(`  ${A.toUpperCase()}  `)).toBe(A);
  });

  it("extracts the UUID from order, vote and results URLs", () => {
    expect(parseOrderRef(`https://pitchtest.example/results/${A}`)).toBe(A);
    expect(parseOrderRef(`https://pitchtest.example/vote/${A}?taskId=x&submissionId=y`)).toBe(A);
    expect(parseOrderRef(`/order/${A}?status=succeeded`)).toBe(A);
  });

  it("rejects input without a UUID", () => {
    expect(parseOrderRef("")).toBeNull();
    expect(parseOrderRef("https://pitchtest.example/results/not-an-id")).toBeNull();
    expect(parseOrderRef("9bf3745e-45a6-427d-91bf")).toBeNull();
  });
});

describe("parseIdsParam", () => {
  it("keeps valid UUIDs, de-duplicates and drops junk", () => {
    expect(parseIdsParam(`${A}, ${B.toUpperCase()},nope,,${A}`)).toEqual([A, B]);
  });

  it("handles missing and repeated params", () => {
    expect(parseIdsParam(undefined)).toEqual([]);
    expect(parseIdsParam("")).toEqual([]);
    expect(parseIdsParam([A, B])).toEqual([A, B]);
  });

  it(`caps the list at ${MAX_SAVED}`, () => {
    const many = Array.from({ length: 30 }, (_, i) => uuid(i)).join(",");
    expect(parseIdsParam(many)).toHaveLength(MAX_SAVED);
  });
});

describe("sanitizeSaved / mergeSaved", () => {
  it("ignores malformed storage contents", () => {
    expect(sanitizeSaved("x")).toEqual([]);
    expect(sanitizeSaved([null, 1, { id: "bad" }, { id: A, companyName: 5 }])).toEqual([
      { id: A, companyName: "", createdAt: "" },
    ]);
  });

  it("puts the newest entry first without duplicates and keeps a known company name", () => {
    const list: SavedOrder[] = [
      { id: B, companyName: "Beta", createdAt: "2026-01-01" },
      { id: A, companyName: "Acme", createdAt: "2026-01-02" },
    ];
    const merged = mergeSaved(list, { id: A.toUpperCase(), companyName: "", createdAt: "2026-02-01" });
    expect(merged.map((o) => o.id)).toEqual([A, B]);
    expect(merged[0]).toEqual({ id: A, companyName: "Acme", createdAt: "2026-01-02" });
  });

  it(`never stores more than ${MAX_SAVED} orders`, () => {
    let list: SavedOrder[] = [];
    for (let i = 0; i < 25; i++) list = mergeSaved(list, { id: uuid(i), companyName: `C${i}`, createdAt: "" });
    expect(list).toHaveLength(MAX_SAVED);
    expect(list[0].id).toBe(uuid(24));
  });
});

describe("storage helpers", () => {
  it("round-trips through storage", () => {
    const s = memoryStorage();
    expect(rememberOrder({ id: A, companyName: "Acme", createdAt: "t" }, s)?.map((o) => o.id)).toEqual([A]);
    expect(rememberOrder({ id: B, companyName: "Beta", createdAt: "t" }, s)?.map((o) => o.id)).toEqual([B, A]);
    expect(readSavedOrders(s).map((o) => o.id)).toEqual([B, A]);
    expect(forgetOrders([B], s)?.map((o) => o.id)).toEqual([A]);
  });

  it("survives corrupt JSON and unavailable or throwing storage", () => {
    expect(readSavedOrders(memoryStorage("{not json"))).toEqual([]);
    expect(readSavedOrders(null)).toEqual([]);
    expect(rememberOrder({ id: A, companyName: "", createdAt: "" }, null)).toBeNull();
    const throwing = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(readSavedOrders(throwing)).toEqual([]);
    expect(rememberOrder({ id: A, companyName: "", createdAt: "" }, throwing)).toBeNull();
  });

  it("refuses to store a non-UUID id", () => {
    const s = memoryStorage();
    expect(rememberOrder({ id: "../../etc", companyName: "", createdAt: "" }, s)).toBeNull();
    expect(s.data.size).toBe(0);
  });

  it("builds the dashboard URL", () => {
    expect(dashboardHref([A, B])).toBe(`/dashboard?ids=${A},${B}`);
    expect(dashboardHref([])).toBe("/dashboard?ids=");
  });
});

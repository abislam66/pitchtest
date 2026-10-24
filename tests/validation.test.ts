import { describe, expect, it } from "vitest";
import { isValidRanking, orderInput, voteInput } from "@/lib/validation";

const good = {
  companyName: "Acme",
  description: "We review websites with AI and humans.",
  features: ["Speed audit", "Copy review", "Accessibility scan"],
};

describe("orderInput", () => {
  it("accepts 3–5 distinct features", () => {
    expect(orderInput.safeParse(good).success).toBe(true);
    expect(orderInput.safeParse({ ...good, features: [...good.features, "SEO", "Mobile"] }).success).toBe(true);
  });
  it("rejects too few, too many, or duplicate features", () => {
    expect(orderInput.safeParse({ ...good, features: ["a1", "b1"] }).success).toBe(false);
    expect(orderInput.safeParse({ ...good, features: ["a1", "b1", "c1", "d1", "e1", "f1"] }).success).toBe(false);
    expect(orderInput.safeParse({ ...good, features: ["Same", "same", "Other"] }).success).toBe(false);
  });
  it("rejects a blank company or short description", () => {
    expect(orderInput.safeParse({ ...good, companyName: "   " }).success).toBe(false);
    expect(orderInput.safeParse({ ...good, description: "short" }).success).toBe(false);
  });
});

describe("voteInput / isValidRanking", () => {
  it("requires a uuid order id", () => {
    expect(voteInput.safeParse({ orderId: "x", ranking: [0, 1, 2], reason: "because" }).success).toBe(false);
  });
  it("requires a full permutation", () => {
    expect(isValidRanking([2, 0, 1], 3)).toBe(true);
    expect(isValidRanking([0, 0, 1], 3)).toBe(false);
    expect(isValidRanking([0, 1], 3)).toBe(false);
    expect(isValidRanking([0, 1, 3], 3)).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { recommend, type FeatureResult } from "@/lib/scoring";

const row = (index: number, feature: string, points: number, firstPlaceVotes: number, voteCount: number): FeatureResult => ({
  index,
  feature,
  points,
  firstPlaceVotes,
  averageRank: voteCount ? 1 : null,
  voteCount,
});

describe("recommend", () => {
  it("has no winner without votes", () => {
    const r = recommend([row(0, "A", 0, 0, 0), row(1, "B", 0, 0, 0), row(2, "C", 0, 0, 0)]);
    expect(r.totalVotes).toBe(0);
    expect(r.winner).toBeNull();
    expect(r.tie).toBe(false);
  });

  it("picks the highest Borda score", () => {
    const r = recommend([row(0, "A", 3, 1, 3), row(1, "B", 5, 2, 3), row(2, "C", 1, 0, 3)]);
    expect(r.scores.map((s) => s.feature)).toEqual(["B", "A", "C"]);
    expect(r.winner?.feature).toBe("B");
    expect(r.totalVotes).toBe(3);
    expect(r.tie).toBe(false);
  });

  it("breaks point ties on first-place votes", () => {
    const r = recommend([row(0, "A", 4, 1, 3), row(1, "B", 4, 2, 3), row(2, "C", 1, 0, 3)]);
    expect(r.winner?.feature).toBe("B");
    expect(r.tie).toBe(false);
  });

  it("reports a tie when points and first-place votes match", () => {
    const r = recommend([row(0, "A", 2, 1, 2), row(1, "B", 2, 1, 2), row(2, "C", 2, 0, 2)]);
    expect(r.tie).toBe(true);
    expect(r.scores.at(-1)?.feature).toBe("C");
  });
});

/** One row of the feature_results view (Borda points computed in Postgres). */
export type FeatureResult = {
  index: number;
  feature: string;
  /** Borda points: top pick earns n-1, last earns 0. */
  points: number;
  firstPlaceVotes: number;
  averageRank: number | null;
  voteCount: number;
};

export type Recommendation = {
  totalVotes: number;
  scores: FeatureResult[];
  winner: FeatureResult | null;
  /** True when the top two are tied on points and first-place votes. */
  tie: boolean;
};

/** Every vote ranks every feature, so each feature's vote_count equals the number of votes. */
export function recommend(results: FeatureResult[]): Recommendation {
  const totalVotes = results.reduce((m, r) => Math.max(m, r.voteCount), 0);
  const scores = [...results].sort(
    (a, b) => b.points - a.points || b.firstPlaceVotes - a.firstPlaceVotes || a.index - b.index,
  );
  const [first, second] = scores;
  const tie =
    totalVotes > 0 && !!second && first.points === second.points && first.firstPlaceVotes === second.firstPlaceVotes;
  return { totalVotes, scores, winner: totalVotes > 0 ? first : null, tie };
}

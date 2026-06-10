export type ResultAccuracyTier = 'exact' | 'partial' | 'wrong';

type ScoreDirection = 'home' | 'away' | 'draw';

function scoreDirection(home: number, away: number): ScoreDirection {
  if (home > away) return 'home';
  if (away > home) return 'away';
  return 'draw';
}

export function getResultAccuracyTier(
  actualHome: number,
  actualAway: number,
  predHome: number,
  predAway: number,
): ResultAccuracyTier {
  if (scoreDirection(actualHome, actualAway) !== scoreDirection(predHome, predAway)) {
    return 'wrong';
  }
  if (predHome === actualHome && predAway === actualAway) {
    return 'exact';
  }
  return 'partial';
}

export const RESULT_SECTION_STYLES: Record<ResultAccuracyTier, string> = {
  exact: 'bg-wc-green/10 border-wc-green/25',
  partial: 'bg-amber-500/10 border-amber-500/25',
  wrong: 'bg-red-500/10 border-red-500/25',
};

export const RESULT_TEXT_STYLES: Record<ResultAccuracyTier, string> = {
  exact: 'text-wc-green',
  partial: 'text-amber-600',
  wrong: 'text-red-500',
};

export const MVP_SECTION_STYLES = {
  correct: 'bg-wc-green/10 border-wc-green/25',
  wrong: 'bg-red-500/10 border-red-500/25',
} as const;

export type AccuracyTone = 'success' | 'partial' | 'fail';

export function resultTierToTone(tier: ResultAccuracyTier): AccuracyTone {
  if (tier === 'exact') return 'success';
  if (tier === 'partial') return 'partial';
  return 'fail';
}

export function mvpCorrectToTone(correct: boolean): AccuracyTone {
  return correct ? 'success' : 'fail';
}

export const POINT_CHIP_STYLES: Record<AccuracyTone, string> = {
  success: 'border-wc-green/30 bg-wc-green/15 text-wc-green',
  partial: 'border-amber-500/30 bg-amber-500/15 text-amber-600',
  fail: 'border-red-500/30 bg-red-500/15 text-red-500',
};

export type OverallPredictionTier = 'perfect' | 'partial' | 'none';

interface MatchScoreInput {
  home_goals: number;
  away_goals: number;
  mvp_player_id?: string | null;
}

interface PredictionScoreInput extends MatchScoreInput {
  points_awarded: number;
}

/** Overall card tone: none = 0 pts, partial = some pts, perfect = exact score + MVP ok (if picked). */
export function getOverallPredictionTier(
  match: MatchScoreInput,
  prediction: PredictionScoreInput,
): OverallPredictionTier {
  if (prediction.points_awarded <= 0) return 'none';

  const resultTier = getResultAccuracyTier(
    match.home_goals,
    match.away_goals,
    prediction.home_goals,
    prediction.away_goals,
  );

  const pickedMvp = prediction.mvp_player_id != null;
  const mvpOk =
    !pickedMvp ||
    (match.mvp_player_id != null && prediction.mvp_player_id === match.mvp_player_id);

  if (resultTier === 'exact' && mvpOk) return 'perfect';
  return 'partial';
}

export const OVERALL_CARD_STYLES: Record<OverallPredictionTier, string> = {
  perfect: 'bg-wc-green/10',
  partial: 'bg-amber-500/10',
  none: 'bg-red-500/10',
};

/** Finished match with no user prediction submitted. */
export const NO_PREDICTION_CARD_STYLE = 'bg-muted/50';

export function getFinishedMatchCardStyle(
  match: MatchScoreInput,
  prediction: PredictionScoreInput | null | undefined,
): string {
  if (!prediction) return NO_PREDICTION_CARD_STYLE;
  return OVERALL_CARD_STYLES[getOverallPredictionTier(match, prediction)];
}

export const OVERALL_POINTS_STYLES: Record<OverallPredictionTier, string> = {
  perfect: 'text-wc-green',
  partial: 'text-amber-600',
  none: 'text-red-500',
};

export function overallTierToTone(tier: OverallPredictionTier): AccuracyTone {
  if (tier === 'perfect') return 'success';
  if (tier === 'partial') return 'partial';
  return 'fail';
}

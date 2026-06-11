import type { components } from '@/types/api';

type MatchPrediction = components['schemas']['MatchPredictionResponse'];

export function isMatchPredictionDirty(
  isEditable: boolean,
  homeInput: string,
  awayInput: string,
  mvpPlayerId: string | null,
  prediction: MatchPrediction | undefined,
): boolean {
  if (!isEditable) return false;

  const homeParsed = homeInput === '' ? null : parseInt(homeInput, 10);
  const awayParsed = awayInput === '' ? null : parseInt(awayInput, 10);
  const hasValidScore =
    homeParsed !== null &&
    awayParsed !== null &&
    !Number.isNaN(homeParsed) &&
    !Number.isNaN(awayParsed);

  const savedHome = prediction?.home_goals ?? null;
  const savedAway = prediction?.away_goals ?? null;
  const savedMvp = prediction?.mvp_player_id ?? null;

  if (!prediction) {
    return hasValidScore || mvpPlayerId !== null;
  }

  if (!hasValidScore) {
    return homeInput !== String(savedHome) || awayInput !== String(savedAway) || mvpPlayerId !== savedMvp;
  }

  return homeParsed !== savedHome || awayParsed !== savedAway || mvpPlayerId !== savedMvp;
}

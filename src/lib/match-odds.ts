import type { components } from '@/types/api';

type MatchStatus = components['schemas']['MatchStatus'];
type MatchResponse = components['schemas']['MatchResponse'];

const LIVE_OR_UPCOMING: MatchStatus[] = [
  'DEFINED',
  'STARTED',
  'HALF_TIME',
  'EXTRA_TIME',
  'PENALTIES',
];

/** Same formula as `Match.normalize_odds` in the backend. */
export function normalizeMatchOdds(odds: number | null | undefined): number {
  if (odds == null) return 1.0;
  return Math.round((1.0 + (Math.min(odds, 10.0) - 1.0) / 9.0) * 100) / 100;
}

export function hasMatchOdds(match: Pick<MatchResponse, 'home_win_odds' | 'draw_odds' | 'away_win_odds'>): boolean {
  return match.home_win_odds != null || match.draw_odds != null || match.away_win_odds != null;
}

export function shouldShowMatchOdds(status: MatchStatus): boolean {
  return LIVE_OR_UPCOMING.includes(status);
}

/** Raw opening odds from the API (e.g. 1.45). */
export function formatOpeningOdds(value: number | null | undefined): string {
  if (value == null) return '—';
  return value.toFixed(2);
}

/** Scoring multiplier derived from opening odds (×1.0 – ×2.0). */
export function formatMatchMultiplier(value: number | null | undefined): string {
  if (value == null) return '—';
  const mult = normalizeMatchOdds(value);
  return mult === 1 ? '×1' : `×${mult.toFixed(2).replace(/\.?0+$/, '')}`;
}

export type OddsOutcome = 'home' | 'draw' | 'away';

export function openingOddsForPredictedScore(
  homeGoals: number,
  awayGoals: number,
  match: Pick<MatchResponse, 'home_win_odds' | 'draw_odds' | 'away_win_odds'>,
): number | null {
  if (homeGoals > awayGoals) return match.home_win_odds;
  if (homeGoals < awayGoals) return match.away_win_odds;
  return match.draw_odds;
}

/** Normalized multiplier for the predicted 1X2 outcome (used in scoring). */
export function multiplierForPredictedScore(
  homeGoals: number,
  awayGoals: number,
  match: Pick<MatchResponse, 'home_win_odds' | 'draw_odds' | 'away_win_odds'>,
): number | null {
  const raw = openingOddsForPredictedScore(homeGoals, awayGoals, match);
  if (raw == null) return null;
  return normalizeMatchOdds(raw);
}

export function predictedOutcomeFromInputs(homeInput: string, awayInput: string): OddsOutcome | null {
  const home = parseInt(homeInput, 10);
  const away = parseInt(awayInput, 10);
  if (homeInput === '' || awayInput === '' || Number.isNaN(home) || Number.isNaN(away)) {
    return null;
  }
  if (home > away) return 'home';
  if (away > home) return 'away';
  return 'draw';
}

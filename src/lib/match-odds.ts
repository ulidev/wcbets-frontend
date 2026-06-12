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

/** Same formula as `Match.normalize_odds` in the backend (raw bookmaker odds → ×1–×2). */
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

/** Scoring multiplier from the API (already normalized ×1.0 – ×2.0 in `home_win_odds`, etc.). */
export function formatMatchMultiplier(value: number | null | undefined): string {
  if (value == null) return '—';
  if (value === 1) return '1';
  return value.toFixed(2).replace(/\.?0+$/, '');
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

/** Multiplier for the predicted 1X2 outcome (API values are already normalized). */
export function multiplierForPredictedScore(
  homeGoals: number,
  awayGoals: number,
  match: Pick<MatchResponse, 'home_win_odds' | 'draw_odds' | 'away_win_odds'>,
): number | null {
  return openingOddsForPredictedScore(homeGoals, awayGoals, match);
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

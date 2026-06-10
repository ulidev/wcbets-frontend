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

/** Backend stores tier multipliers in home_win_odds / draw_odds / away_win_odds (1 | 1.3 | 1.6 | 2). */
export function hasMatchOdds(match: Pick<MatchResponse, 'home_win_odds' | 'draw_odds' | 'away_win_odds'>): boolean {
  return match.home_win_odds != null || match.draw_odds != null || match.away_win_odds != null;
}

export function shouldShowMatchOdds(status: MatchStatus): boolean {
  return LIVE_OR_UPCOMING.includes(status);
}

export function formatMatchMultiplier(value: number | null | undefined): string {
  if (value == null) return '—';
  return value === 1 ? '×1' : `×${value}`;
}

export type OddsOutcome = 'home' | 'draw' | 'away';

export function multiplierForPredictedScore(
  homeGoals: number,
  awayGoals: number,
  match: Pick<MatchResponse, 'home_win_odds' | 'draw_odds' | 'away_win_odds'>,
): number | null {
  if (homeGoals > awayGoals) return match.home_win_odds;
  if (homeGoals < awayGoals) return match.away_win_odds;
  return match.draw_odds;
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

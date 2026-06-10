import type { components } from '@/types/api';
import { hasMatchOdds } from '@/lib/match-odds';
import placeholder from './match-odds-placeholder.json';

type Match = components['schemas']['MatchResponse'];

export type MatchOddsMultipliers = Pick<
  Match,
  'home_win_odds' | 'draw_odds' | 'away_win_odds'
>;

function isPlaceholderDisabled(): boolean {
  if (!import.meta.env.DEV) return true;
  return import.meta.env.VITE_MATCH_ODDS_PLACEHOLDER === 'false';
}

function pickPlaceholder(index: number): MatchOddsMultipliers {
  const variants = placeholder.variants as MatchOddsMultipliers[];
  return variants[index % variants.length] ?? (placeholder.default as MatchOddsMultipliers);
}

/**
 * In dev, fills missing 1X2 multipliers on every match using the backend contract
 * (home_win_odds / draw_odds / away_win_odds → 1 | 1.3 | 1.6 | 2).
 * Skips matches that already have values from the API.
 */
export function applyMatchOddsPlaceholder(matches: Match[]): Match[] {
  if (isPlaceholderDisabled()) return matches;

  return matches.map((match, index) => {
    if (hasMatchOdds(match)) return match;
    return { ...match, ...pickPlaceholder(index) };
  });
}

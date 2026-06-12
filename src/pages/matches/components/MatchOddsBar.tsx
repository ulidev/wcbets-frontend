import { cn } from '@/lib/utils';
import {
  formatMatchMultiplier,
  predictedOutcomeFromInputs,
  type OddsOutcome,
} from '@/lib/match-odds';
import { getMatchOddsCellSurface } from '../match.utils';
import type { components } from '@/types/api';

type MatchResponse = components['schemas']['MatchResponse'];

const OUTCOME_LABELS: Record<OddsOutcome, string> = {
  home: 'Local',
  draw: 'Empat',
  away: 'Visitant',
};

interface MatchOddsBarProps {
  match: Pick<MatchResponse, 'home_win_odds' | 'draw_odds' | 'away_win_odds'>;
  homeTeamName: string;
  awayTeamName: string;
  homeInput?: string;
  awayInput?: string;
  showMultiplierHint?: boolean;
}

function OddsCell({
  label,
  multiplier,
  variant,
  teamName,
  isActive,
}: {
  label: string;
  multiplier: number | null;
  variant: OddsOutcome;
  teamName: string;
  isActive: boolean;
}) {
  const { className, style } = getMatchOddsCellSurface(variant, teamName, isActive);

  return (
    <div className={cn('match-odds-bar__cell', className)} style={style}>
      <span className="match-odds-bar__label">{label}</span>
      <span className={cn('match-odds-bar__value', isActive && 'text-wc-hermes')}>
        {formatMatchMultiplier(multiplier)}
      </span>
    </div>
  );
}

export function MatchOddsBar({
  match,
  homeTeamName,
  awayTeamName,
  homeInput,
  awayInput,
  showMultiplierHint = false,
}: MatchOddsBarProps) {
  const predicted =
    showMultiplierHint && homeInput != null && awayInput != null
      ? predictedOutcomeFromInputs(homeInput, awayInput)
      : null;

  return (
    <div className="match-odds-bar">
      <p className="match-odds-bar__heading">Multiplicador de punts</p>
      <div className="match-odds-bar__row">
        <OddsCell
          label={OUTCOME_LABELS.home}
          multiplier={match.home_win_odds}
          variant="home"
          teamName={homeTeamName}
          isActive={predicted === 'home'}
        />
        <OddsCell
          label={OUTCOME_LABELS.draw}
          multiplier={match.draw_odds}
          variant="draw"
          teamName=""
          isActive={predicted === 'draw'}
        />
        <OddsCell
          label={OUTCOME_LABELS.away}
          multiplier={match.away_win_odds}
          variant="away"
          teamName={awayTeamName}
          isActive={predicted === 'away'}
        />
      </div>
    </div>
  );
}

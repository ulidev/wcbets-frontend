import type { CSSProperties, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { TeamFlag } from '@/components/app/TeamFlag';
import { cn } from '@/lib/utils';
import { teamCardBorderGradient, teamFifaCode, WC_2026_CENTER_LOGO } from '../match.utils';

type MatchScoreboardProps = {
  homeTeamName: string;
  awayTeamName: string;
  homeGoals?: number | null;
  awayGoals?: number | null;
  editable?: boolean;
  homeInput?: string;
  awayInput?: string;
  onHomeInputChange?: (value: string) => void;
  onAwayInputChange?: (value: string) => void;
  isLive?: boolean;
  matchMinute?: string | null;
  addedTime?: string | null;
  predictionLine?: string | null;
  predictionSuffix?: ReactNode;
  onPredictionClick?: () => void;
  predictionOpen?: boolean;
  homeTeamLabel?: string | null;
  awayTeamLabel?: string | null;
  homeWin?: boolean;
  awayWin?: boolean;
};

function ScoreValue({
  value,
  editable,
  onChange,
  highlight,
  side,
}: {
  value: string;
  editable?: boolean;
  onChange?: (v: string) => void;
  highlight?: boolean;
  side: 'home' | 'away';
}) {
  if (editable) {
    return (
      <input
        type="number"
        min={0}
        max={20}
        value={value}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '' || /^\d{1,2}$/.test(raw)) onChange?.(raw);
        }}
        className={cn(
          'match-scoreboard-score-input',
          side === 'home' ? 'match-scoreboard-score-input--home' : 'match-scoreboard-score-input--away',
        )}
        inputMode="numeric"
        placeholder="–"
      />
    );
  }

  return (
    <span
      className={cn(
        'match-scoreboard-score',
        side === 'home' ? 'match-scoreboard-score--home' : 'match-scoreboard-score--away',
        highlight && 'match-scoreboard-score--live',
        value === '–' && 'match-scoreboard-score--empty',
      )}
    >
      {value}
    </span>
  );
}

function TeamCard({
  teamName,
  teamLabel,
  code,
  winning,
  align,
}: {
  teamName: string;
  teamLabel?: string | null;
  code: string;
  winning?: boolean;
  align: 'home' | 'away';
}) {
  const borderGradient = teamCardBorderGradient(teamName, align);

  return (
    <div
      className={cn(
        'match-team-card',
        align === 'home' ? 'match-team-card--home' : 'match-team-card--away',
      )}
      style={{ '--team-border': borderGradient } as CSSProperties}
    >
      <div className="match-team-card__inner">
        <div className="match-team-card__row">
          <span className={cn('match-team-card__code', winning && 'match-team-card__code--win')}>
            {code}
          </span>
          <TeamFlag teamName={teamName} size="md" />
        </div>
        {teamLabel && <span className="match-team-card__label">{teamLabel}</span>}
      </div>
    </div>
  );
}

export function MatchScoreboard({
  homeTeamName,
  awayTeamName,
  homeGoals,
  awayGoals,
  editable = false,
  homeInput = '',
  awayInput = '',
  onHomeInputChange,
  onAwayInputChange,
  isLive = false,
  matchMinute,
  addedTime,
  predictionLine,
  predictionSuffix,
  onPredictionClick,
  predictionOpen = false,
  homeTeamLabel,
  awayTeamLabel,
  homeWin = false,
  awayWin = false,
}: MatchScoreboardProps) {
  const homeCode = teamFifaCode(homeTeamName);
  const awayCode = teamFifaCode(awayTeamName);

  const homeDisplay =
    editable ? homeInput : homeGoals != null ? String(homeGoals) : '–';
  const awayDisplay =
    editable ? awayInput : awayGoals != null ? String(awayGoals) : '–';

  const liveLabel =
    isLive && matchMinute
      ? `${matchMinute}${addedTime ? ` ${addedTime}` : ''}`
      : null;

  return (
    <div className="match-scoreboard">
      <div className="match-scoreboard-row">
        <TeamCard
          teamName={homeTeamName}
          teamLabel={homeTeamLabel}
          code={homeCode}
          winning={homeWin}
          align="home"
        />

        <div className="match-scoreboard-center">
          <ScoreValue
            value={homeDisplay}
            editable={editable}
            onChange={onHomeInputChange}
            highlight={isLive}
            side="home"
          />

          <div className="match-scoreboard-emblem" aria-hidden>
            <img src={WC_2026_CENTER_LOGO} alt="" />
          </div>

          <ScoreValue
            value={awayDisplay}
            editable={editable}
            onChange={onAwayInputChange}
            highlight={isLive}
            side="away"
          />
        </div>

        <TeamCard
          teamName={awayTeamName}
          teamLabel={awayTeamLabel}
          code={awayCode}
          winning={awayWin}
          align="away"
        />
      </div>

      {liveLabel && (
        <div className="flex justify-center">
          <span className="match-scoreboard-live-pill">{liveLabel}</span>
        </div>
      )}

      {predictionLine && (
        <div className="match-scoreboard-footer">
          {onPredictionClick ? (
            <button
              type="button"
              onClick={onPredictionClick}
              className="match-scoreboard-prediction match-scoreboard-prediction--clickable"
            >
              {predictionLine}
              {predictionSuffix}
              <ChevronDown
                className={cn(
                  'h-3 w-3 transition-transform duration-200',
                  predictionOpen && 'rotate-180',
                )}
              />
            </button>
          ) : (
            <div className="match-scoreboard-prediction">
              {predictionLine}
              {predictionSuffix}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

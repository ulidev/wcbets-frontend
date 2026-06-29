import { CheckCircle2, XCircle } from 'lucide-react';
import { TeamFlag } from '@/components/app/TeamFlag';
import { isTopTwoSwap } from '@/lib/pickem-scoring-help';
import { cn } from '@/lib/utils';
import { wcFontBody } from '@/lib/wc-ui';
import { MatchScoreboard } from '@/pages/matches/components/MatchScoreboard';

const GROUP_A_COLOR = '#3CAC3B';

export type OddsMultipliers = {
  home: number;
  draw: number;
  away: number;
};

function formatMult(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return `×${rounded.toFixed(2).replace(/\.?0+$/, '')}`;
}

export function HelpOddsMultipliers({
  multipliers,
  active,
}: {
  multipliers: OddsMultipliers;
  active: 'home' | 'draw' | 'away';
}) {
  const cells = [
    { key: 'home' as const, label: 'Local', value: multipliers.home },
    { key: 'draw' as const, label: 'Empat', value: multipliers.draw },
    { key: 'away' as const, label: 'Visitant', value: multipliers.away },
  ];

  return (
    <div className="match-odds-bar">
      <p className="match-odds-bar__heading">Multiplicador odds</p>
      <div className="match-odds-bar__row">
        {cells.map((cell) => (
          <div
            key={cell.key}
            className={cn(
              'match-odds-bar__cell match-odds-bar__cell--neutral',
              active === cell.key && 'ring-2 ring-primary/50',
            )}
          >
            <span className="match-odds-bar__label">{cell.label}</span>
            <span className="match-odds-bar__value">{formatMult(cell.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type HelpMatchCardProps = {
  metaLine: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamLabel?: string;
  awayTeamLabel?: string;
  homeGoals: number;
  awayGoals: number;
  predHome: number;
  predAway: number;
  pointsLabel: string;
  cardStyle?: string;
  pointsStyle?: string;
  oddsMultipliers?: OddsMultipliers;
  oddsActive?: 'home' | 'draw' | 'away';
};

export function HelpMatchCard({
  metaLine,
  homeTeam,
  awayTeam,
  homeTeamLabel,
  awayTeamLabel,
  homeGoals,
  awayGoals,
  predHome,
  predAway,
  pointsLabel,
  cardStyle = 'bg-wc-green/10',
  pointsStyle = 'text-wc-green',
  oddsMultipliers,
  oddsActive = 'home',
}: HelpMatchCardProps) {
  const homeWin = homeGoals > awayGoals;
  const awayWin = awayGoals > homeGoals;

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border border-border',
        cardStyle,
      )}
    >
      <div className="flex items-center justify-between border-b border-border/60 bg-black/[0.03] px-3 py-2">
        <span className="text-xs text-muted-foreground">{metaLine}</span>
        <span className={cn('text-xs font-bold tabular-nums', pointsStyle)}>{pointsLabel}</span>
      </div>
      <div className="px-2 py-2.5 sm:px-3 sm:py-3">
        <MatchScoreboard
          homeTeamName={homeTeam}
          awayTeamName={awayTeam}
          homeTeamLabel={homeTeamLabel}
          awayTeamLabel={awayTeamLabel}
          homeGoals={homeGoals}
          awayGoals={awayGoals}
          homeWin={homeWin}
          awayWin={awayWin}
          predictionLine={`La teva predicció ${predHome} – ${predAway}`}
          predictionSuffix={
            <span className={cn('font-bold tabular-nums', pointsStyle)}>{pointsLabel}</span>
          }
        />
        {oddsMultipliers && (
          <HelpOddsMultipliers multipliers={oddsMultipliers} active={oddsActive} />
        )}
      </div>
    </div>
  );
}

type HelpGroupTeamRow = {
  name: string;
  label: string;
  predictedPosition: number;
  actualPosition: number;
  points: number;
};

type HelpGroupResultCardProps = {
  groupName: string;
  groupColor?: string;
  totalPoints: number;
  teams: HelpGroupTeamRow[];
};

export function HelpGroupResultCard({
  groupName,
  groupColor = GROUP_A_COLOR,
  totalPoints,
  teams,
}: HelpGroupResultCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-wc-light-gray shadow-sm">
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ backgroundColor: groupColor }}
      >
        <h3 className="wc-group-card-title">{groupName}</h3>
        <span className="rounded-full bg-black/25 px-2 py-0.5 text-xs font-bold tabular-nums text-white">
          +{totalPoints} pts
        </span>
      </div>
      <div className="divide-y divide-border">
        {teams.map((team) => {
          const isCorrect = team.actualPosition === team.predictedPosition;
          const isSwap =
            !isCorrect && isTopTwoSwap(team.predictedPosition, team.actualPosition);
          const isWrong = !isCorrect && !isSwap;

          return (
            <div
              key={team.name}
              className={cn(
                'flex items-center gap-2.5 bg-card px-3 py-2.5',
                isCorrect && 'bg-green-500/10',
              )}
            >
              <span
                className={cn(
                  'w-5 shrink-0 text-center text-xs font-bold tabular-nums',
                  isCorrect && 'text-green-500',
                  isWrong && 'text-muted-foreground/30',
                  isSwap && 'text-amber-600',
                )}
              >
                {team.predictedPosition}
              </span>
              <TeamFlag teamName={team.name} size="md" />
              <span
                className={cn(
                  'min-w-0 flex-1 truncate text-sm',
                  wcFontBody,
                  isWrong && 'text-muted-foreground/70',
                )}
              >
                {team.label}
              </span>
              {isCorrect ? (
                <div className="flex shrink-0 items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-xs font-bold tabular-nums text-wc-green">+{team.points}</span>
                </div>
              ) : isSwap ? (
                <div className="flex shrink-0 items-center gap-1.5 text-xs tabular-nums">
                  <span className="text-muted-foreground/40 line-through">#{team.predictedPosition}</span>
                  <span className="font-bold text-amber-600">→ #{team.actualPosition}</span>
                  <span className="font-bold text-wc-green">+{team.points}</span>
                </div>
              ) : (
                <span className="shrink-0 text-xs font-bold tabular-nums text-muted-foreground">0</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type BracketSemiSlotProps = {
  label: string;
  home: string;
  away: string;
  homeLabel: string;
  awayLabel: string;
  pick: string;
  pickLabel: string;
  winner: string;
  winnerLabel: string;
  points: number;
};

function BracketSemiSlot({
  label,
  home,
  away,
  homeLabel,
  awayLabel,
  pick,
  pickLabel,
  winner,
  winnerLabel,
  points,
}: BracketSemiSlotProps) {
  const correct = pick === winner;

  return (
    <div
      className={cn(
        'rounded-xl border p-3',
        correct ? 'border-wc-green/30 bg-wc-green/5' : 'border-border bg-muted/20',
      )}
    >
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mb-2 flex items-center justify-center gap-2">
        <span className="flex items-center gap-1 text-xs font-semibold text-foreground">
          <TeamFlag teamName={home} size="sm" />
          {homeLabel}
        </span>
        <span className="text-[10px] text-muted-foreground">vs</span>
        <span className="flex items-center gap-1 text-xs font-semibold text-foreground">
          <TeamFlag teamName={away} size="sm" />
          {awayLabel}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span>
          Pick: <span className="font-semibold text-foreground">{pickLabel}</span>
        </span>
        {correct ? (
          <span className="flex items-center gap-1 font-bold text-wc-green">
            <CheckCircle2 className="h-3.5 w-3.5" />
            +{points}
          </span>
        ) : (
          <span className="flex items-center gap-1 font-bold text-muted-foreground">
            <XCircle className="h-3.5 w-3.5" />
            0
          </span>
        )}
      </div>
      <p className="mt-1.5 text-[10px] text-muted-foreground">
        Guanyador real: <span className="font-medium text-foreground">{winnerLabel}</span>
      </p>
    </div>
  );
}

export function HelpBracketSemiExample() {
  return (
    <div className="flex flex-col gap-2.5">
      <BracketSemiSlot
        label="Semifinal 1"
        home="Spain"
        away="France"
        homeLabel="Espanya"
        awayLabel="França"
        pick="Spain"
        pickLabel="Espanya"
        winner="Spain"
        winnerLabel="Espanya"
        points={20}
      />
      <BracketSemiSlot
        label="Semifinal 2"
        home="Argentina"
        away="England"
        homeLabel="Argentina"
        awayLabel="Anglaterra"
        pick="England"
        pickLabel="Anglaterra"
        winner="Argentina"
        winnerLabel="Argentina"
        points={20}
      />
      <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-xs leading-relaxed">
        <p>
          Has fallat la semifinal 2, però a la <span className="font-semibold text-foreground">Final</span>{' '}
          prediu <span className="font-semibold text-foreground">Espanya</span> i Espanya guanya →{' '}
          <span className="font-bold text-wc-green">+30 pts</span>. Cada slot es puntua per separat.
        </p>
      </div>
    </div>
  );
}

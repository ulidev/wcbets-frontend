import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMatchPlayers } from '@/api/matches';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { cn } from '@/lib/utils';
import { MatchScoreboard } from '@/pages/matches/components/MatchScoreboard';
import { MatchPredictionBreakdown } from '@/pages/matches/components/MatchPredictionBreakdown';
import {
  getFinishedMatchCardStyle,
  getOverallPredictionTier,
  OVERALL_POINTS_STYLES,
} from '@/lib/match-prediction-score';
import type { components } from '@/types/api';

type Match = components['schemas']['MatchResponse'];
type MatchPrediction = components['schemas']['MatchPredictionResponse'];

function formatMatchTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', {
    timeZone: 'Europe/Madrid',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export interface FinishedMatchPredictionCardProps {
  match: Match;
  prediction: MatchPrediction;
  homeTeam: string;
  awayTeam: string;
  homeTeamLabel: string;
  awayTeamLabel: string;
  roundLabel: string;
  scoreLabel?: string;
  predictionLinePrefix?: string;
  showBreakdown?: boolean;
  collapsible?: boolean;
  statusBadge?: ReactNode;
}

export function FinishedMatchPredictionCard({
  match,
  prediction,
  homeTeam,
  awayTeam,
  homeTeamLabel,
  awayTeamLabel,
  roundLabel,
  scoreLabel = 'La teva predicció',
  predictionLinePrefix = 'La teva predicció',
  showBreakdown = true,
  collapsible = false,
  statusBadge,
}: FinishedMatchPredictionCardProps) {
  const isDesktop = useBreakpoint(768);
  const [detailOpen, setDetailOpen] = useState(!collapsible);

  useEffect(() => {
    if (collapsible) {
      setDetailOpen(isDesktop);
    }
  }, [collapsible, isDesktop]);

  const breakdownVisible = showBreakdown && (!collapsible || detailOpen);

  const needsPlayers =
    breakdownVisible &&
    (prediction.mvp_player_id != null || match.mvp_player_id != null);

  const playersQuery = useQuery({
    queryKey: ['match-players', match.id],
    queryFn: () => fetchMatchPlayers(match.id),
    enabled: needsPlayers,
  });

  const allPlayers = [
    ...(playersQuery.data?.home_team ?? []),
    ...(playersQuery.data?.away_team ?? []),
  ];
  const pickedMvp = allPlayers.find((p) => p.id === prediction.mvp_player_id) ?? null;
  const officialMvp = allPlayers.find((p) => p.id === match.mvp_player_id) ?? null;
  const pickedTeam =
    pickedMvp && playersQuery.data
      ? playersQuery.data.home_team.some((p) => p.id === pickedMvp.id)
        ? homeTeam
        : awayTeam
      : null;
  const officialTeam =
    officialMvp && playersQuery.data
      ? playersQuery.data.home_team.some((p) => p.id === officialMvp.id)
        ? homeTeam
        : awayTeam
      : null;

  const homeWins = match.home_goals > match.away_goals;
  const awayWins = match.away_goals > match.home_goals;
  const overallTier = getOverallPredictionTier(match, prediction);
  const pointsStyle = OVERALL_POINTS_STYLES[overallTier];
  const cardSurfaceStyle = getFinishedMatchCardStyle(match, prediction);

  const predictionSuffix = (
    <span className={cn('font-bold', pointsStyle)}>
      {prediction.points_awarded > 0 ? `+${prediction.points_awarded}` : '0'}
    </span>
  );

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border border-border',
        cardSurfaceStyle,
      )}
    >
      <div className="flex items-center justify-between border-b border-border/60 bg-black/[0.03] px-3 py-2">
        <span className="text-xs text-muted-foreground">
          {formatMatchTime(match.scheduled_at)} · {roundLabel}
        </span>
        {statusBadge ?? (
          <span className={cn('text-xs font-bold', pointsStyle)}>
            {prediction.points_awarded > 0
              ? `+${prediction.points_awarded} pts`
              : '0 pts'}
          </span>
        )}
      </div>

      <div className="px-3 py-3">
        <MatchScoreboard
          homeTeamName={homeTeam}
          awayTeamName={awayTeam}
          homeTeamLabel={homeTeamLabel}
          awayTeamLabel={awayTeamLabel}
          homeGoals={match.home_goals}
          awayGoals={match.away_goals}
          homeWin={homeWins}
          awayWin={awayWins}
          predictionLine={`${predictionLinePrefix} ${prediction.home_goals} – ${prediction.away_goals}`}
          predictionSuffix={predictionSuffix}
          onPredictionClick={collapsible ? () => setDetailOpen((v) => !v) : undefined}
          predictionOpen={detailOpen}
        />
      </div>

      {breakdownVisible && (
        <MatchPredictionBreakdown
          match={match}
          prediction={prediction}
          scoreLabel={scoreLabel}
          pickedMvp={pickedMvp}
          pickedTeam={pickedTeam}
          officialMvp={officialMvp}
          officialTeam={officialTeam}
        />
      )}
    </div>
  );
}

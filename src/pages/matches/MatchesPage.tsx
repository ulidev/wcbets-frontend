import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import {
  fetchMatches,
  fetchTeams,
  fetchRounds,
  fetchMyPredictions,
  createMatchPrediction,
  updateMatchPrediction,
} from '@/api/matches';
import type { components } from '@/types/api';
import { cn } from '@/lib/utils';
import { getFlagEmoji } from '@/lib/flags';

type Match = components['schemas']['MatchResponse'];
type Phase = components['schemas']['Phase'];
type RoundResponse = components['schemas']['RoundResponse'];
type MatchPrediction = components['schemas']['MatchPredictionResponse'];

const PHASE_LABELS: Record<Phase, string> = {
  GROUP_STAGE: 'Group Stage',
  ROUND_OF_32: 'Round of 32',
  ROUND_OF_16: 'Round of 16',
  QUARTER_FINAL: 'Quarter-Finals',
  SEMI_FINAL: 'Semi-Finals',
  THIRD_FOURTH_POSITION: 'Third Place Play-off',
  FINAL: 'Final',
};

function getSpanishDateKey(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date(iso));
}

function formatDayHeader(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatMatchTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', {
    timeZone: 'Europe/Madrid',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getRoundLabel(round: RoundResponse): string {
  if (round.phase === 'GROUP_STAGE') return `Matchday ${round.round_number}`;
  return PHASE_LABELS[round.phase];
}

function StatusBadge({ status }: { status: Match['status'] }) {
  if (status === 'STARTED') {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-bold text-green-500">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
        LIVE
      </span>
    );
  }
  if (status === 'HALF_TIME') {
    return (
      <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-500">
        HT
      </span>
    );
  }
  if (status === 'FINISHED') {
    return (
      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
        FT
      </span>
    );
  }
  return null;
}

function ScoreInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="number"
      min={0}
      max={20}
      value={value}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === '' || /^\d{1,2}$/.test(raw)) onChange(raw);
      }}
      className="h-11 w-11 rounded-lg border border-border bg-background text-center text-xl font-bold tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      inputMode="numeric"
      placeholder="–"
    />
  );
}

interface PredictionCardProps {
  match: Match;
  homeTeam: string;
  awayTeam: string;
  roundLabel: string;
  prediction: MatchPrediction | undefined;
}

function PredictionCard({ match, homeTeam, awayTeam, roundLabel, prediction }: PredictionCardProps) {
  const queryClient = useQueryClient();
  const isLive = match.status === 'STARTED' || match.status === 'HALF_TIME';
  const isFinished = match.status === 'FINISHED';
  const isEditable =
    match.status === 'DEFINED' && new Date(match.scheduled_at) > new Date();

  const [homeInput, setHomeInput] = useState(() =>
    prediction ? String(prediction.home_goals) : '',
  );
  const [awayInput, setAwayInput] = useState(() =>
    prediction ? String(prediction.away_goals) : '',
  );

  const mutation = useMutation({
    mutationFn: () => {
      const home = parseInt(homeInput, 10);
      const away = parseInt(awayInput, 10);
      if (prediction) {
        return updateMatchPrediction(match.id, { home_goals: home, away_goals: away });
      }
      return createMatchPrediction({ match_id: match.id, home_goals: home, away_goals: away });
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['my-predictions'] }),
  });

  const canSave =
    isEditable &&
    homeInput !== '' &&
    awayInput !== '' &&
    !isNaN(parseInt(homeInput, 10)) &&
    !isNaN(parseInt(awayInput, 10));

  const homeWins = (isLive || isFinished) && match.home_goals > match.away_goals;
  const awayWins = (isLive || isFinished) && match.away_goals > match.home_goals;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-card',
        isLive && 'border-green-500/30',
      )}
    >
      {/* Header: time + round label + status */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2">
        <span className="text-xs text-muted-foreground">
          {formatMatchTime(match.scheduled_at)} · {roundLabel}
        </span>
        <StatusBadge status={match.status} />
      </div>

      {/* Teams + score area */}
      <div className="flex items-center gap-2 px-4 py-4">
        {/* Home team */}
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <span className="text-2xl leading-none" aria-hidden>
            {getFlagEmoji(homeTeam)}
          </span>
          <span
            className={cn(
              'w-full truncate text-center text-xs font-medium',
              homeWins && 'font-bold',
            )}
          >
            {homeTeam}
          </span>
        </div>

        {/* Score / inputs */}
        <div className="flex shrink-0 items-center gap-1.5">
          {isEditable ? (
            <>
              <ScoreInput value={homeInput} onChange={setHomeInput} />
              <span className="text-sm font-bold text-muted-foreground">–</span>
              <ScoreInput value={awayInput} onChange={setAwayInput} />
            </>
          ) : (
            <span
              className={cn(
                'font-mono text-2xl font-bold tabular-nums',
                isLive && 'text-green-500',
              )}
            >
              {match.home_goals}&nbsp;–&nbsp;{match.away_goals}
            </span>
          )}
        </div>

        {/* Away team */}
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <span className="text-2xl leading-none" aria-hidden>
            {getFlagEmoji(awayTeam)}
          </span>
          <span
            className={cn(
              'w-full truncate text-center text-xs font-medium',
              awayWins && 'font-bold',
            )}
          >
            {awayTeam}
          </span>
        </div>
      </div>

      {/* Save / update button for editable matches */}
      {isEditable && (
        <div className="border-t border-border px-4 pb-3 pt-2.5">
          <button
            onClick={() => mutation.mutate()}
            disabled={!canSave || mutation.isPending}
            className={cn(
              'w-full rounded-lg py-2 text-sm font-semibold transition-opacity',
              prediction
                ? 'bg-muted text-foreground hover:opacity-80'
                : 'bg-primary text-primary-foreground hover:opacity-90',
              (!canSave || mutation.isPending) && 'cursor-not-allowed opacity-50',
            )}
          >
            {mutation.isPending ? 'Saving…' : prediction ? 'Update Prediction' : 'Save Prediction'}
          </button>
          {mutation.isError && (
            <p className="mt-1 text-center text-xs text-destructive">Failed to save. Try again.</p>
          )}
          {mutation.isSuccess && (
            <p className="mt-1 text-center text-xs text-green-500">Saved!</p>
          )}
        </div>
      )}

      {/* User's prediction footer for live / finished matches */}
      {(isLive || isFinished) && (
        <div className="border-t border-border px-4 py-2">
          {prediction ? (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Your pick:&nbsp;
                <span className="font-semibold tabular-nums text-foreground">
                  {prediction.home_goals}&nbsp;–&nbsp;{prediction.away_goals}
                </span>
              </p>
              {isFinished && prediction.points_awarded > 0 && (
                <span className="text-xs font-semibold text-primary">
                  +{prediction.points_awarded} pts
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground/50">No prediction made</p>
          )}
        </div>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="h-9 animate-pulse bg-muted/50" />
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex flex-1 flex-col items-center gap-2">
          <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-11 w-11 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-3 animate-pulse rounded bg-muted" />
          <div className="h-11 w-11 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="flex flex-1 flex-col items-center gap-2">
          <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="border-t border-border px-4 pb-3 pt-2.5">
        <div className="h-9 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}

export default function MatchesPage() {
  const matchesQuery = useQuery({ queryKey: ['matches'], queryFn: fetchMatches });
  const teamsQuery = useQuery({ queryKey: ['teams'], queryFn: fetchTeams });
  const roundsQuery = useQuery({ queryKey: ['rounds'], queryFn: fetchRounds });
  const predictionsQuery = useQuery({ queryKey: ['my-predictions'], queryFn: fetchMyPredictions });

  const isLoading =
    matchesQuery.isLoading ||
    teamsQuery.isLoading ||
    roundsQuery.isLoading ||
    predictionsQuery.isLoading;

  const isError = matchesQuery.isError || teamsQuery.isError || roundsQuery.isError;

  const teamMap = new Map((teamsQuery.data ?? []).map((t) => [t.id, t.name]));
  const roundMap = new Map((roundsQuery.data ?? []).map((r) => [r.id, r]));
  const predictionMap = new Map((predictionsQuery.data ?? []).map((p) => [p.match_id, p]));

  // Group matches by day in Europe/Madrid timezone, sorted chronologically
  type DayGroup = { dateKey: string; matches: Match[] };
  const dayGroups: DayGroup[] = [];

  if (!isLoading && !isError && matchesQuery.data) {
    const byDay = new Map<string, Match[]>();
    for (const match of matchesQuery.data) {
      const key = getSpanishDateKey(match.scheduled_at);
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key)!.push(match);
    }
    for (const dateKey of [...byDay.keys()].sort()) {
      const matches = byDay
        .get(dateKey)!
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
      dayGroups.push({ dateKey, matches });
    }
  }

  return (
    <div className="flex flex-col">
      {/* Desktop header */}
      <div className="hidden border-b border-border px-6 py-5 md:block">
        <h1 className="text-xl font-bold">Matches</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Predict match scores for World Cup 2026
        </p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
          {Array.from({ length: 6 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-2 px-4 py-20 text-center text-muted-foreground">
          <AlertCircle className="h-8 w-8" />
          <p className="text-sm font-medium">Failed to load matches</p>
          <p className="text-xs">Check your connection and try again.</p>
        </div>
      )}

      {!isLoading && !isError && dayGroups.length === 0 && (
        <div className="px-4 py-20 text-center text-sm text-muted-foreground">
          No matches scheduled yet.
        </div>
      )}

      {!isLoading &&
        !isError &&
        dayGroups.map(({ dateKey, matches }) => (
          <section key={dateKey}>
            <div className="sticky top-0 z-10 border-b border-border bg-muted/80 px-4 py-2 backdrop-blur">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {formatDayHeader(dateKey)}
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
              {matches.map((match) => {
                const round = roundMap.get(match.round_id);
                return (
                  <PredictionCard
                    key={match.id}
                    match={match}
                    homeTeam={teamMap.get(match.home_team_id) ?? '—'}
                    awayTeam={teamMap.get(match.away_team_id) ?? '—'}
                    roundLabel={round ? getRoundLabel(round) : ''}
                    prediction={predictionMap.get(match.id)}
                  />
                );
              })}
            </div>
          </section>
        ))}
    </div>
  );
}

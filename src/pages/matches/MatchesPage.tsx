import { useQuery } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { fetchMatches, fetchTeams, fetchRounds } from '@/api/matches';
import type { components } from '@/types/api';
import { cn } from '@/lib/utils';

type Match = components['schemas']['MatchResponse'];
type Phase = components['schemas']['Phase'];

const PHASE_ORDER: Phase[] = [
  'GROUP_STAGE',
  'ROUND_OF_32',
  'ROUND_OF_16',
  'QUARTER_FINAL',
  'SEMI_FINAL',
  'THIRD_FOURTH_POSITION',
  'FINAL',
];

const PHASE_LABELS: Record<Phase, string> = {
  GROUP_STAGE: 'Group Stage',
  ROUND_OF_32: 'Round of 32',
  ROUND_OF_16: 'Round of 16',
  QUARTER_FINAL: 'Quarter-Finals',
  SEMI_FINAL: 'Semi-Finals',
  THIRD_FOURTH_POSITION: 'Third Place Play-off',
  FINAL: 'Final',
};

function formatMatchDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatMatchTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
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

interface MatchCardProps {
  match: Match;
  homeTeam: string;
  awayTeam: string;
}

function MatchCard({ match, homeTeam, awayTeam }: MatchCardProps) {
  const isLive = match.status === 'STARTED' || match.status === 'HALF_TIME';
  const hasScore = isLive || match.status === 'FINISHED';
  const isUpcoming = match.status === 'DEFINED';

  return (
    <div
      className={cn(
        'flex items-center gap-3 border-b border-border px-4 py-3',
        isLive && 'bg-green-500/5',
      )}
    >
      {/* Date / time column */}
      <div className="w-14 shrink-0 text-center">
        <p className="text-[10px] leading-tight text-muted-foreground">
          {formatMatchDate(match.scheduled_at)}
        </p>
        <p className={cn('text-xs font-semibold', isLive ? 'text-green-500' : 'text-foreground')}>
          {isUpcoming ? formatMatchTime(match.scheduled_at) : ''}
        </p>
      </div>

      {/* Teams + score */}
      <div className="flex flex-1 items-center gap-2">
        {/* Home team */}
        <span
          className={cn(
            'flex-1 truncate text-right text-sm font-medium',
            hasScore && match.home_goals > match.away_goals && 'font-bold',
          )}
        >
          {homeTeam}
        </span>

        {/* Score or vs */}
        <div className="shrink-0 text-center">
          {hasScore ? (
            <span className="font-mono text-base font-bold tabular-nums">
              {match.home_goals}&nbsp;–&nbsp;{match.away_goals}
            </span>
          ) : (
            <span className="text-xs font-semibold text-muted-foreground">vs</span>
          )}
        </div>

        {/* Away team */}
        <span
          className={cn(
            'flex-1 truncate text-sm font-medium',
            hasScore && match.away_goals > match.home_goals && 'font-bold',
          )}
        >
          {awayTeam}
        </span>
      </div>

      {/* Status */}
      <div className="w-14 shrink-0 text-right">
        <StatusBadge status={match.status} />
      </div>
    </div>
  );
}

function SkeletonCards({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-border px-4 py-3">
          <div className="w-14 space-y-1">
            <div className="h-2.5 animate-pulse rounded bg-muted" />
            <div className="h-3 animate-pulse rounded bg-muted" />
          </div>
          <div className="flex flex-1 items-center gap-2">
            <div className="h-3 flex-1 animate-pulse rounded bg-muted" />
            <div className="h-5 w-10 animate-pulse rounded bg-muted" />
            <div className="h-3 flex-1 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-6 w-10 animate-pulse rounded-full bg-muted" />
        </div>
      ))}
    </>
  );
}

export default function MatchesPage() {
  const matchesQuery = useQuery({ queryKey: ['matches'], queryFn: fetchMatches });
  const teamsQuery = useQuery({ queryKey: ['teams'], queryFn: fetchTeams });
  const roundsQuery = useQuery({ queryKey: ['rounds'], queryFn: fetchRounds });

  const isLoading = matchesQuery.isLoading || teamsQuery.isLoading || roundsQuery.isLoading;
  const isError = matchesQuery.isError || teamsQuery.isError || roundsQuery.isError;

  const teamMap = new Map((teamsQuery.data ?? []).map((t) => [t.id, t.name]));
  const roundMap = new Map((roundsQuery.data ?? []).map((r) => [r.id, r]));

  // Group matches by phase then by round_number
  type RoundGroup = { roundNumber: number; matches: Match[] };
  type PhaseGroup = { phase: Phase; rounds: RoundGroup[] };

  const grouped: PhaseGroup[] = [];

  if (!isLoading && !isError && matchesQuery.data) {
    const byPhase = new Map<Phase, Map<number, Match[]>>();

    for (const match of matchesQuery.data) {
      const round = roundMap.get(match.round_id);
      if (!round) continue;
      const phase = round.phase;
      const rn = round.round_number;
      if (!byPhase.has(phase)) byPhase.set(phase, new Map());
      const rounds = byPhase.get(phase)!;
      if (!rounds.has(rn)) rounds.set(rn, []);
      rounds.get(rn)!.push(match);
    }

    for (const phase of PHASE_ORDER) {
      const rounds = byPhase.get(phase);
      if (!rounds) continue;
      const sortedRounds = [...rounds.entries()]
        .sort(([a], [b]) => a - b)
        .map(([roundNumber, matches]) => ({
          roundNumber,
          matches: matches.sort(
            (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
          ),
        }));
      grouped.push({ phase, rounds: sortedRounds });
    }
  }

  return (
    <div className="flex flex-col">
      {/* Desktop header */}
      <div className="hidden border-b border-border px-6 py-5 md:block">
        <h1 className="text-xl font-bold">Matches</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          All World Cup 2026 matches and results
        </p>
      </div>

      {isLoading && <SkeletonCards count={10} />}

      {isError && (
        <div className="flex flex-col items-center gap-2 px-4 py-20 text-center text-muted-foreground">
          <AlertCircle className="h-8 w-8" />
          <p className="text-sm font-medium">Failed to load matches</p>
          <p className="text-xs">Check your connection and try again.</p>
        </div>
      )}

      {!isLoading && !isError && grouped.length === 0 && (
        <div className="px-4 py-20 text-center text-sm text-muted-foreground">
          No matches scheduled yet.
        </div>
      )}

      {!isLoading &&
        !isError &&
        grouped.map(({ phase, rounds }) => (
          <section key={phase}>
            {/* Phase header */}
            <div className="sticky top-0 z-10 border-b border-border bg-muted/80 px-4 py-2 backdrop-blur">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {PHASE_LABELS[phase]}
              </h2>
            </div>

            {rounds.map(({ roundNumber, matches }) => (
              <div key={roundNumber}>
                {/* Round sub-header (only for Group Stage with multiple matchdays) */}
                {phase === 'GROUP_STAGE' && rounds.length > 1 && (
                  <div className="border-b border-border/60 bg-background px-4 py-1.5">
                    <p className="text-[11px] font-semibold text-muted-foreground">
                      Matchday {roundNumber}
                    </p>
                  </div>
                )}

                {matches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    homeTeam={teamMap.get(match.home_team_id) ?? '—'}
                    awayTeam={teamMap.get(match.away_team_id) ?? '—'}
                  />
                ))}
              </div>
            ))}
          </section>
        ))}
    </div>
  );
}

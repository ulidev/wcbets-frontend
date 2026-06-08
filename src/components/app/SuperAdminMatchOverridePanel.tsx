import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ChevronDown, Search, Shield, X } from 'lucide-react';
import {
  fetchMatches,
  fetchTeams,
  fetchRounds,
  fetchMatchPlayers,
  overrideMatchResult,
  updateMatchStatus,
} from '@/api/matches';
import { TeamFlag } from '@/components/app/TeamFlag';
import { cn } from '@/lib/utils';
import { wcBtnPrimaryFull, wcFontBody } from '@/lib/wc-ui';
import type { components } from '@/types/api';

type Match = components['schemas']['MatchResponse'];
type MatchOutcome = components['schemas']['MatchOutcome'];
type MatchStatus = components['schemas']['MatchStatus'];
type Phase = components['schemas']['Phase'];
type RoundResponse = components['schemas']['RoundResponse'];
type PlayerResponse = components['schemas']['PlayerResponse'];

const STATUS_LABELS: Record<MatchStatus, string> = {
  DEFINED: 'Defined',
  STARTED: 'Started',
  HALF_TIME: 'Half Time',
  EXTRA_TIME: 'Extra Time',
  PENALTIES: 'Penalties',
  FINISHED: 'Finished',
};

const OUTCOME_LABELS: Record<MatchOutcome, string> = {
  LOCAL_W: 'Home wins',
  AWAY_W: 'Away wins',
  DRAW: 'Draw',
  LOCAL_PEN_W: 'Home wins (penalties)',
  AWAY_PEN_W: 'Away wins (penalties)',
};

function deriveOutcome(home: string, away: string, prev: MatchOutcome): MatchOutcome {
  const h = parseInt(home, 10);
  const a = parseInt(away, 10);
  if (isNaN(h) || isNaN(a)) return prev;
  if (h > a) return 'LOCAL_W';
  if (a > h) return 'AWAY_W';
  if (prev === 'DRAW' || prev === 'LOCAL_PEN_W' || prev === 'AWAY_PEN_W') return prev;
  return 'DRAW';
}

const PHASE_LABELS: Record<Phase, string> = {
  GROUP_STAGE: 'Group Stage',
  ROUND_OF_32: 'Round of 32',
  ROUND_OF_16: 'Round of 16',
  QUARTER_FINAL: 'Quarter-Finals',
  SEMI_FINAL: 'Semi-Finals',
  THIRD_FOURTH_POSITION: 'Third Place',
  FINAL: 'Final',
};

const POSITION_COLORS: Record<PlayerResponse['position'], string> = {
  GK: 'text-amber-400 bg-amber-400/10',
  DEF: 'text-blue-400 bg-blue-400/10',
  MID: 'text-green-400 bg-green-400/10',
  FWD: 'text-red-400 bg-red-400/10',
};

function getRoundLabel(round: RoundResponse): string {
  if (round.phase === 'GROUP_STAGE') return `MD ${round.round_number}`;
  return PHASE_LABELS[round.phase];
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

function MvpSheet({
  matchId,
  homeTeamName,
  awayTeamName,
  selectedPlayerId,
  onSelect,
  onClose,
}: {
  matchId: string;
  homeTeamName: string;
  awayTeamName: string;
  selectedPlayerId: string | null;
  onSelect: (id: string | null) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const playersQuery = useQuery({
    queryKey: ['match-players', matchId],
    queryFn: () => fetchMatchPlayers(matchId),
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const q = search.toLowerCase().trim();
  const filter = (players: PlayerResponse[]) =>
    !q
      ? players
      : players.filter(
          (p) => p.name.toLowerCase().includes(q) || String(p.dorsal_number).includes(q),
        );

  const homePlayers = filter(playersQuery.data?.home_team ?? []);
  const awayPlayers = filter(playersQuery.data?.away_team ?? []);

  function PlayerRow({ player }: { player: PlayerResponse }) {
    const selected = player.id === selectedPlayerId;
    return (
      <button
        onClick={() => {
          onSelect(selected ? null : player.id);
          onClose();
        }}
        className={cn(
          'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
          selected ? 'bg-primary/10' : 'hover:bg-muted/50',
        )}
      >
        <span className="w-7 shrink-0 text-center text-xs tabular-nums text-muted-foreground">
          #{player.dorsal_number}
        </span>
        <span className={cn('flex-1 truncate text-sm uppercase', wcFontBody)}>{player.name}</span>
        <span
          className={cn(
            'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold',
            POSITION_COLORS[player.position],
          )}
        >
          {player.position}
        </span>
        {selected && <span className="shrink-0 text-xs font-bold text-primary">✓</span>}
      </button>
    );
  }

  function TeamSection({ players, teamName }: { players: PlayerResponse[]; teamName: string }) {
    if (players.length === 0 && q) return null;
    return (
      <div>
        <div className="sticky top-0 flex items-center gap-2 border-b border-border bg-background/95 px-4 py-2 backdrop-blur">
          <TeamFlag teamName={teamName} size="sm" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {teamName}
          </span>
        </div>
        {players.length === 0 ? (
          <p className="px-4 py-3 text-xs text-muted-foreground">No players match.</p>
        ) : (
          <div className="divide-y divide-border/50">
            {players.map((p) => (
              <PlayerRow key={p.id} player={p} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative flex max-h-[75vh] flex-col rounded-t-2xl border border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="wc-section-heading text-base">Select MVP</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="border-b border-border px-3 py-2">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search player…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        {selectedPlayerId && (
          <button
            onClick={() => {
              onSelect(null);
              onClose();
            }}
            className="border-b border-border px-4 py-2.5 text-left text-xs font-medium text-destructive hover:bg-destructive/5"
          >
            Clear MVP
          </button>
        )}
        <div className="overflow-y-auto">
          {playersQuery.isLoading && (
            <div className="flex flex-col gap-1 p-4">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-muted/60" />
              ))}
            </div>
          )}
          {playersQuery.data && (
            <>
              <TeamSection players={homePlayers} teamName={homeTeamName} />
              <TeamSection players={awayPlayers} teamName={awayTeamName} />
              {homePlayers.length === 0 && awayPlayers.length === 0 && q && (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No players found.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MatchOverrideForm({
  match,
  homeTeamName,
  awayTeamName,
  onClose,
}: {
  match: Match;
  homeTeamName: string;
  awayTeamName: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  // Status
  const [status, setStatus] = useState<MatchStatus>(match.status);

  // Result
  const [homeInput, setHomeInput] = useState(String(match.home_goals));
  const [awayInput, setAwayInput] = useState(String(match.away_goals));
  const [outcome, setOutcome] = useState<MatchOutcome>(match.outcome ?? 'LOCAL_W');
  const [mvpPlayerId, setMvpPlayerId] = useState<string | null>(match.mvp_player_id ?? null);
  const [showMvpPicker, setShowMvpPicker] = useState(false);

  // Auto-derive outcome whenever score changes
  useEffect(() => {
    setOutcome((prev) => deriveOutcome(homeInput, awayInput, prev));
  }, [homeInput, awayInput]);

  const outcomeOptions = Object.keys(OUTCOME_LABELS) as MatchOutcome[];

  const playersQuery = useQuery({
    queryKey: ['match-players', match.id],
    queryFn: () => fetchMatchPlayers(match.id),
    enabled: mvpPlayerId !== null,
  });

  const allPlayers = [
    ...(playersQuery.data?.home_team ?? []),
    ...(playersQuery.data?.away_team ?? []),
  ];
  const selectedPlayer = allPlayers.find((p) => p.id === mvpPlayerId) ?? null;

  const invalidateMatches = () => void queryClient.invalidateQueries({ queryKey: ['matches'] });

  const statusMutation = useMutation({
    mutationFn: () => updateMatchStatus(match.id, { status }),
    onSuccess: invalidateMatches,
  });

  const resultMutation = useMutation({
    mutationFn: () =>
      overrideMatchResult(match.id, {
        home_goals: parseInt(homeInput, 10),
        away_goals: parseInt(awayInput, 10),
        outcome,
        mvp_player_id: mvpPlayerId,
      }),
    onSuccess: () => {
      invalidateMatches();
      onClose();
    },
  });

  const canSaveResult =
    homeInput !== '' &&
    awayInput !== '' &&
    !isNaN(parseInt(homeInput, 10)) &&
    !isNaN(parseInt(awayInput, 10));

  return (
    <div className="border-t border-border bg-muted/30 px-4 py-3 space-y-4">
      {/* Status section */}
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Match status</label>
        <div className="flex gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as MatchStatus)}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {(Object.keys(STATUS_LABELS) as MatchStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => statusMutation.mutate()}
            disabled={statusMutation.isPending || status === match.status}
            className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
          >
            {statusMutation.isPending ? 'Saving…' : 'Update'}
          </button>
        </div>
        {statusMutation.isSuccess && (
          <p className="mt-1 text-xs text-green-500">Status updated.</p>
        )}
        {statusMutation.isError && (
          <p className="mt-1 text-xs text-destructive">Failed to update status.</p>
        )}
      </div>

      <div className="border-t border-border/50" />

      {/* Score inputs */}
      <div className="flex items-center justify-center gap-4">
        <div className="flex flex-col items-center gap-1">
          <TeamFlag teamName={homeTeamName} size="sm" />
          <span className="text-[10px] uppercase text-muted-foreground">{homeTeamName}</span>
          <ScoreInput value={homeInput} onChange={setHomeInput} />
        </div>
        <span className="mt-5 text-sm font-bold text-muted-foreground">–</span>
        <div className="flex flex-col items-center gap-1">
          <TeamFlag teamName={awayTeamName} size="sm" />
          <span className="text-[10px] uppercase text-muted-foreground">{awayTeamName}</span>
          <ScoreInput value={awayInput} onChange={setAwayInput} />
        </div>
      </div>

      {/* Outcome — filtered to valid options for current score */}
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Outcome</label>
        <select
          value={outcome}
          onChange={(e) => setOutcome(e.target.value as MatchOutcome)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {outcomeOptions.map((o) => (
            <option key={o} value={o}>
              {OUTCOME_LABELS[o]}
            </option>
          ))}
        </select>
      </div>

      {/* MVP */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">MVP</span>
        <button
          onClick={() => setShowMvpPicker(true)}
          className={cn(
            'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
            selectedPlayer
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'border-border bg-muted/40 text-muted-foreground hover:border-primary/40 hover:text-foreground',
          )}
        >
          {selectedPlayer
            ? `#${selectedPlayer.dorsal_number} ${selectedPlayer.name}`
            : 'Pick player…'}
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => resultMutation.mutate()}
          disabled={!canSaveResult || resultMutation.isPending}
          className={cn(wcBtnPrimaryFull, 'flex-1')}
        >
          {resultMutation.isPending ? 'Saving…' : 'Override result'}
        </button>
      </div>

      {resultMutation.isError && (
        <p className="text-center text-xs text-destructive">Failed to override. Try again.</p>
      )}

      {showMvpPicker && (
        <MvpSheet
          matchId={match.id}
          homeTeamName={homeTeamName}
          awayTeamName={awayTeamName}
          selectedPlayerId={mvpPlayerId}
          onSelect={setMvpPlayerId}
          onClose={() => setShowMvpPicker(false)}
        />
      )}
    </div>
  );
}

export function SuperAdminMatchOverridePanel() {
  const [search, setSearch] = useState('');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const matchesQuery = useQuery({ queryKey: ['matches'], queryFn: fetchMatches, staleTime: 30_000 });
  const teamsQuery = useQuery({ queryKey: ['teams'], queryFn: fetchTeams, staleTime: 60_000 });
  const roundsQuery = useQuery({ queryKey: ['rounds'], queryFn: fetchRounds, staleTime: 60_000 });

  const teamMap = new Map((teamsQuery.data ?? []).map((t) => [t.id, t.name]));
  const roundMap = new Map((roundsQuery.data ?? []).map((r) => [r.id, r]));

  const q = search.toLowerCase().trim();
  const matches = (matchesQuery.data ?? []).filter((m) => {
    if (!q) return true;
    const home = teamMap.get(m.home_team_id)?.toLowerCase() ?? '';
    const away = teamMap.get(m.away_team_id)?.toLowerCase() ?? '';
    return home.includes(q) || away.includes(q);
  });

  return (
    <section className="w-full">
      <div className="mb-3 flex items-center gap-2">
        <Shield className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-wc-card-text">Override Match Result</h3>
      </div>

      <div className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by team name…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {matchesQuery.isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
      )}

      {matchesQuery.isError && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Failed to load matches.
        </div>
      )}

      {!matchesQuery.isLoading && !matchesQuery.isError && (
        <div className="overflow-hidden rounded-[18px] border border-wc-light-gray bg-white shadow-sm">
          {matches.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">No matches found.</p>
          )}
          {matches.map((match) => {
            const homeName = teamMap.get(match.home_team_id) ?? '—';
            const awayName = teamMap.get(match.away_team_id) ?? '—';
            const round = roundMap.get(match.round_id);
            const isSelected = match.id === selectedMatchId;

            return (
              <div key={match.id} className="border-b border-wc-light-gray last:border-b-0">
                <button
                  type="button"
                  onClick={() => setSelectedMatchId(isSelected ? null : match.id)}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                    isSelected ? 'bg-primary/5' : 'hover:bg-muted/30',
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <TeamFlag teamName={homeName} size="sm" />
                    <span className={cn('truncate text-xs uppercase', wcFontBody)}>{homeName}</span>
                    <span className="mx-1 shrink-0 font-mono text-xs font-bold tabular-nums text-muted-foreground">
                      {match.status === 'FINISHED'
                        ? `${match.home_goals}–${match.away_goals}`
                        : 'vs'}
                    </span>
                    <span className={cn('truncate text-xs uppercase', wcFontBody)}>{awayName}</span>
                    <TeamFlag teamName={awayName} size="sm" />
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {round && (
                      <span className="text-[10px] text-muted-foreground">
                        {getRoundLabel(round)}
                      </span>
                    )}
                    <ChevronDown
                      className={cn(
                        'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200',
                        isSelected && 'rotate-180',
                      )}
                    />
                  </div>
                </button>

                {isSelected && (
                  <MatchOverrideForm
                    match={match}
                    homeTeamName={homeName}
                    awayTeamName={awayName}
                    onClose={() => setSelectedMatchId(null)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

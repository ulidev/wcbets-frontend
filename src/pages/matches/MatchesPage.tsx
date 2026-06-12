import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ChevronDown, Clock, Search, X } from 'lucide-react';
import {
  fetchMatches,
  fetchTeams,
  fetchRounds,
  fetchMyPredictions,
  fetchMatchPlayers,
  createMatchPrediction,
  updateMatchPrediction,
} from '@/api/matches';
import type { components } from '@/types/api';
import { cn } from '@/lib/utils';
import { wcBtnPrimaryFull, wcFontBody } from '@/lib/wc-ui';
import { PageChrome } from '@/components/app/PageChrome';
import { TeamFlag } from '@/components/app/TeamFlag';
import { MatchScoreboard } from './components/MatchScoreboard';
import { MatchPredictionBreakdown } from './components/MatchPredictionBreakdown';
import { MatchOddsBar } from './components/MatchOddsBar';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useRegisterUnsavedChanges } from '@/contexts/UnsavedChangesContext';
import { useToast } from '@/contexts/ToastContext';
import { isMatchPredictionDirty } from '@/lib/match-prediction-dirty';
import { upsertMyMatchPrediction } from '@/lib/match-predictions-cache';
import { hasMatchOdds, shouldShowMatchOdds } from '@/lib/match-odds';
import {
  getFinishedMatchCardStyle,
  getOverallPredictionTier,
  OVERALL_POINTS_STYLES,
} from '@/lib/match-prediction-score';

type Match = components['schemas']['MatchResponse'];
type Phase = components['schemas']['Phase'];
type RoundResponse = components['schemas']['RoundResponse'];
type MatchPrediction = components['schemas']['MatchPredictionResponse'];
type PlayerResponse = components['schemas']['PlayerResponse'];

const PHASE_LABELS: Record<Phase, string> = {
  GROUP_STAGE: 'Fase de grups',
  ROUND_OF_32: 'Vuitens de final',
  ROUND_OF_16: 'Setzens de final',
  QUARTER_FINAL: 'Quarts de final',
  SEMI_FINAL: 'Semifinals',
  THIRD_FOURTH_POSITION: 'Tercer i quart lloc',
  FINAL: 'Final',
};

function getSpanishDateKey(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date(iso));
}

function formatDayHeader(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('ca-ES', {
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
  if (round.phase === 'GROUP_STAGE') return `Jornada ${round.round_number}`;
  return PHASE_LABELS[round.phase];
}

function StatusBadge({ status }: { status: Match['status'] }) {
  if (status === 'STARTED') {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-wc-hermes/10 px-2.5 py-1 text-xs font-bold text-wc-hermes">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-wc-hermes" />
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

function getTimeRemaining(iso: string): { label: string; urgency: 'low' | 'medium' | 'high' } | null {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return null;
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days > 0) return { label: `${days}d ${hours}h`, urgency: 'low' };
  if (hours > 0) return { label: `${hours}h ${minutes}m`, urgency: 'medium' };
  return { label: `${minutes}m`, urgency: 'high' };
}

function TimeRemaining({ scheduledAt }: { scheduledAt: string }) {
  const [state, setState] = useState(() => getTimeRemaining(scheduledAt));

  useEffect(() => {
    const id = setInterval(() => setState(getTimeRemaining(scheduledAt)), 30_000);
    return () => clearInterval(id);
  }, [scheduledAt]);

  if (!state) return null;

  const colorClass =
    state.urgency === 'high'
      ? 'text-red-400'
      : state.urgency === 'medium'
        ? 'text-amber-400'
        : 'text-muted-foreground';

  return (
    <span className={cn('flex items-center gap-1 text-xs font-medium', colorClass)}>
      <Clock className="h-3 w-3" />
      {state.label}
    </span>
  );
}

const POSITION_LABELS: Record<PlayerResponse['position'], string> = {
  GK: 'GK',
  DEF: 'DEF',
  MID: 'MID',
  FWD: 'FWD',
};

const POSITION_COLORS: Record<PlayerResponse['position'], string> = {
  GK: 'text-amber-400 bg-amber-400/10',
  DEF: 'text-blue-400 bg-blue-400/10',
  MID: 'text-green-400 bg-green-400/10',
  FWD: 'text-red-400 bg-red-400/10',
};

interface MvpPickerSheetProps {
  matchId: string;
  homeTeamName: string;
  homeTeamLabel: string;
  awayTeamName: string;
  awayTeamLabel: string;
  selectedPlayerId: string | null;
  onSelect: (playerId: string | null) => void;
  onClose: () => void;
}

function MvpPickerSheet({
  matchId,
  homeTeamName,
  homeTeamLabel,
  awayTeamName,
  awayTeamLabel,
  selectedPlayerId,
  onSelect,
  onClose,
}: MvpPickerSheetProps) {
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
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const q = search.toLowerCase().trim();

  function filterPlayers(players: PlayerResponse[]) {
    if (!q) return players;
    return players.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        POSITION_LABELS[p.position].toLowerCase().includes(q) ||
        String(p.dorsal_number).includes(q),
    );
  }

  const homePlayers = filterPlayers(playersQuery.data?.home_team ?? []);
  const awayPlayers = filterPlayers(playersQuery.data?.away_team ?? []);

  function PlayerRow({ player }: { player: PlayerResponse }) {
    const isSelected = player.id === selectedPlayerId;
    return (
      <button
        onClick={() => {
          onSelect(isSelected ? null : player.id);
          onClose();
        }}
        className={cn(
          'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
          isSelected ? 'bg-primary/10' : 'hover:bg-muted/50',
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
          {POSITION_LABELS[player.position]}
        </span>
        {isSelected && (
          <span className="shrink-0 text-xs font-bold text-primary">✓</span>
        )}
      </button>
    );
  }

  function TeamSection({ players, teamName, teamLabel }: { players: PlayerResponse[]; teamName: string; teamLabel: string }) {
    if (players.length === 0 && q) return null;
    return (
      <div>
        <div className="sticky top-0 flex items-center gap-2 border-b border-border bg-background/95 px-4 py-2 backdrop-blur">
          <TeamFlag teamName={teamName} size="sm" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {teamLabel}
          </span>
        </div>
        {players.length === 0 ? (
          <p className="px-4 py-3 text-xs text-muted-foreground">Cap jugador coincideix.</p>
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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Sheet */}
      <div className="relative flex max-h-[75vh] flex-col rounded-t-2xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="wc-section-heading text-base">Triar MVP</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-border px-3 py-2">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca per nom, posició, dorsal…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Clear selection row */}
        {selectedPlayerId && (
          <button
            onClick={() => { onSelect(null); onClose(); }}
            className="border-b border-border px-4 py-2.5 text-left text-xs font-medium text-destructive hover:bg-destructive/5"
          >
            Esborrar selecció MVP
          </button>
        )}

        {/* Player list */}
        <div className="overflow-y-auto">
          {playersQuery.isLoading && (
            <div className="flex flex-col gap-1 p-4">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-muted/60" />
              ))}
            </div>
          )}
          {playersQuery.isError && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No s'han pogut carregar els jugadors.
            </p>
          )}
          {playersQuery.data && (
            <>
              <TeamSection players={homePlayers} teamName={homeTeamName} teamLabel={homeTeamLabel} />
              <TeamSection players={awayPlayers} teamName={awayTeamName} teamLabel={awayTeamLabel} />
              {homePlayers.length === 0 && awayPlayers.length === 0 && q && (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No s'han trobat jugadors per a "{search}".
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface PredictionCardProps {
  match: Match;
  homeTeam: string;
  homeTeamLabel: string;
  awayTeam: string;
  awayTeamLabel: string;
  roundLabel: string;
  prediction: MatchPrediction | undefined;
}

function PredictionCard({ match, homeTeam, homeTeamLabel, awayTeam, awayTeamLabel, roundLabel, prediction }: PredictionCardProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const isDesktop = useBreakpoint(768);
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
  const [mvpPlayerId, setMvpPlayerId] = useState<string | null>(() =>
    prediction?.mvp_player_id ?? null,
  );
  const [showMvpPicker, setShowMvpPicker] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    if (isFinished && prediction) {
      setDetailOpen(isDesktop);
    }
  }, [isDesktop, isFinished, prediction?.id]);

  // Fetch players lazily so we can resolve the MVP name for display
  const playersQuery = useQuery({
    queryKey: ['match-players', match.id],
    queryFn: () => fetchMatchPlayers(match.id),
    enabled:
      showMvpPicker ||
      mvpPlayerId !== null ||
      match.mvp_player_id != null ||
      (isFinished && detailOpen && prediction != null),
  });

  const allPlayers = [
    ...(playersQuery.data?.home_team ?? []),
    ...(playersQuery.data?.away_team ?? []),
  ];
  const selectedPlayer = allPlayers.find((p) => p.id === mvpPlayerId) ?? null;
  const selectedPlayerTeam = selectedPlayer
    ? (playersQuery.data?.home_team.some((p) => p.id === selectedPlayer.id)
        ? homeTeam
        : awayTeam)
    : null;

  const pickedMvp = playersQuery.data
    ? allPlayers.find((p) => p.id === prediction?.mvp_player_id) ?? null
    : null;
  const pickedTeam = pickedMvp && playersQuery.data
    ? (playersQuery.data.home_team.some((p) => p.id === pickedMvp.id) ? homeTeam : awayTeam)
    : null;
  const officialMvp = playersQuery.data
    ? allPlayers.find((p) => p.id === match.mvp_player_id) ?? null
    : null;
  const officialTeam = officialMvp && playersQuery.data
    ? (playersQuery.data.home_team.some((p) => p.id === officialMvp.id) ? homeTeam : awayTeam)
    : null;

  const mutation = useMutation({
    mutationFn: () => {
      const home = parseInt(homeInput, 10);
      const away = parseInt(awayInput, 10);
      if (prediction) {
        return updateMatchPrediction(match.id, {
          home_goals: home,
          away_goals: away,
          mvp_player_id: mvpPlayerId,
        });
      }
      return createMatchPrediction({
        match_id: match.id,
        home_goals: home,
        away_goals: away,
        mvp_player_id: mvpPlayerId,
      });
    },
    onSuccess: (saved) => {
      upsertMyMatchPrediction(queryClient, saved);
      setHomeInput(String(saved.home_goals));
      setAwayInput(String(saved.away_goals));
      setMvpPlayerId(saved.mvp_player_id ?? null);
      showToast('Guardat!');
    },
  });

  const canSave =
    isEditable &&
    homeInput !== '' &&
    awayInput !== '' &&
    !isNaN(parseInt(homeInput, 10)) &&
    !isNaN(parseInt(awayInput, 10));

  const isDirty = isMatchPredictionDirty(isEditable, homeInput, awayInput, mvpPlayerId, prediction);
  useRegisterUnsavedChanges(`match-${match.id}`, isDirty);

  const homeWins = (isLive || isFinished) && match.home_goals > match.away_goals;
  const awayWins = (isLive || isFinished) && match.away_goals > match.home_goals;

  const liveMinute =
    match.status === 'HALF_TIME' ? 'HT' : match.status === 'STARTED' ? 'LIVE' : null;

  const predictionLine =
    !isEditable && prediction
      ? `La teva predicció ${prediction.home_goals} – ${prediction.away_goals}`
      : null;

  const overallTier =
    isFinished && prediction
      ? getOverallPredictionTier(match, prediction)
      : null;

  const predictionSuffix =
    isFinished && prediction && overallTier != null ? (
      <span className={cn('font-bold', OVERALL_POINTS_STYLES[overallTier])}>
        {prediction.points_awarded > 0 ? `+${prediction.points_awarded}` : '0'}
      </span>
    ) : null;

  const cardSurfaceStyle = isFinished
    ? getFinishedMatchCardStyle(match, prediction)
    : 'bg-card';

  const showOdds = shouldShowMatchOdds(match.status) && hasMatchOdds(match);

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
        {isEditable ? (
          <TimeRemaining scheduledAt={match.scheduled_at} />
        ) : (
          <StatusBadge status={match.status} />
        )}
      </div>

      <div className="flex flex-col px-3 py-3">
        <MatchScoreboard
          homeTeamName={homeTeam}
          awayTeamName={awayTeam}
          homeTeamLabel={homeTeamLabel}
          awayTeamLabel={awayTeamLabel}
          homeGoals={isEditable ? null : match.home_goals}
          awayGoals={isEditable ? null : match.away_goals}
          editable={isEditable}
          homeInput={homeInput}
          awayInput={awayInput}
          onHomeInputChange={setHomeInput}
          onAwayInputChange={setAwayInput}
          isLive={isLive}
          matchMinute={liveMinute}
          predictionLine={predictionLine}
          predictionSuffix={predictionSuffix}
          onPredictionClick={
            isFinished && prediction ? () => setDetailOpen((v) => !v) : undefined
          }
          predictionOpen={detailOpen}
          homeWin={homeWins}
          awayWin={awayWins}
        />

        {showOdds && (
          <MatchOddsBar
            match={match}
            homeTeamName={homeTeam}
            awayTeamName={awayTeam}
            homeInput={homeInput}
            awayInput={awayInput}
            showMultiplierHint={isEditable}
          />
        )}

        {isFinished && !prediction && (
          <p className="pt-3 text-center text-xs text-muted-foreground/70">
            No vas predir en aquest partit
          </p>
        )}
      </div>

      {isEditable && (
        <div className="border-t border-border px-4 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">MVP pick</span>
            <button
              onClick={() => setShowMvpPicker(true)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
                selectedPlayer
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border bg-muted/40 text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              {selectedPlayer ? (
                <>
                  <TeamFlag teamName={selectedPlayerTeam!} size="sm" />
                  <span>#{selectedPlayer.dorsal_number} {selectedPlayer.name}</span>
                </>
              ) : (
                <span>Triar jugador…</span>
              )}
            </button>
          </div>
        </div>
      )}

      {isEditable && (
        <div className="border-t border-border px-4 pb-3 pt-2.5">
          <button
            onClick={() => mutation.mutate()}
            disabled={!canSave || mutation.isPending || (Boolean(prediction) && !isDirty)}
            className={cn(
              wcBtnPrimaryFull,
              mutation.isPending && 'wc-btn-primary--loading',
              prediction &&
                !isDirty &&
                'bg-wc-dark-gray shadow-none hover:bg-wc-dark-gray/90 disabled:opacity-70',
            )}
          >
            {mutation.isPending ? 'Guardant…' : prediction ? 'Actualitzar predicció' : 'Guardar predicció'}
          </button>
          {mutation.isError && (
            <p className="mt-1 text-center text-xs text-destructive">Error en guardar. Torna-ho a provar.</p>
          )}
        </div>
      )}

      {isLive && (!prediction || pickedMvp) && (
        <div className="border-t border-border px-4 py-2.5">
          {prediction && pickedMvp && pickedTeam ? (
            <p className="text-xs text-muted-foreground">
              MVP:&nbsp;
              <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                <TeamFlag teamName={pickedTeam} size="sm" className="align-middle" />
                {pickedMvp.name}
              </span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground/50">Sense predicció</p>
          )}
        </div>
      )}

      {isFinished && prediction && detailOpen && (
        <MatchPredictionBreakdown
          match={match}
          prediction={prediction}
          pickedMvp={pickedMvp}
          pickedTeam={pickedTeam}
          officialMvp={officialMvp}
          officialTeam={officialTeam}
        />
      )}

      {/* MVP picker sheet */}
      {showMvpPicker && (
        <MvpPickerSheet
          matchId={match.id}
          homeTeamName={homeTeam}
          homeTeamLabel={homeTeamLabel}
          awayTeamName={awayTeam}
          awayTeamLabel={awayTeamLabel}
          selectedPlayerId={mvpPlayerId}
          onSelect={setMvpPlayerId}
          onClose={() => setShowMvpPicker(false)}
        />
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="h-9 animate-pulse bg-muted/50" />
      <div className="flex gap-2 px-3 py-3">
        <div className="h-[4.5rem] flex-1 animate-pulse rounded-[18px] bg-muted/60" />
        <div className="h-8 w-8 shrink-0 animate-pulse self-center rounded-full bg-muted/40" />
        <div className="h-[4.5rem] flex-1 animate-pulse rounded-[18px] bg-muted/60" />
      </div>
      <div className="border-t border-border px-4 pb-3 pt-2.5">
        <div className="h-9 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}

type DayGroup = { dateKey: string; matches: Match[] };

interface MatchesDaySectionProps extends DayGroup {
  teamMap: Map<string, string>;
  teamLabelMap: Map<string, string>;
  roundMap: Map<string, RoundResponse>;
  predictionMap: Map<string, MatchPrediction>;
}

function MatchesDaySection({
  dateKey,
  matches,
  teamMap,
  teamLabelMap,
  roundMap,
  predictionMap,
}: MatchesDaySectionProps) {
  return (
    <section>
      <div className="sticky top-0 z-10 border-b border-wc-light-gray bg-white/90 px-4 py-2 backdrop-blur">
        <h2 className="wc-day-heading">{formatDayHeader(dateKey)}</h2>
      </div>
      <div className="grid grid-cols-1 items-start gap-3 p-4 sm:grid-cols-2">
        {matches.map((match) => {
          const round = roundMap.get(match.round_id);
          return (
            <PredictionCard
              key={match.id}
              match={match}
              homeTeam={teamMap.get(match.home_team_id) ?? '—'}
              homeTeamLabel={teamLabelMap.get(match.home_team_id) ?? '—'}
              awayTeam={teamMap.get(match.away_team_id) ?? '—'}
              awayTeamLabel={teamLabelMap.get(match.away_team_id) ?? '—'}
              roundLabel={round ? getRoundLabel(round) : ''}
              prediction={predictionMap.get(match.id)}
            />
          );
        })}
      </div>
    </section>
  );
}

export default function MatchesPage() {
  const matchesQuery = useQuery({ queryKey: ['matches'], queryFn: fetchMatches });
  const teamsQuery = useQuery({ queryKey: ['teams'], queryFn: fetchTeams });
  const roundsQuery = useQuery({ queryKey: ['rounds'], queryFn: fetchRounds });
  const predictionsQuery = useQuery({ queryKey: ['my-predictions'], queryFn: fetchMyPredictions });
  const [pastExpanded, setPastExpanded] = useState(false);

  const isLoading =
    matchesQuery.isLoading ||
    teamsQuery.isLoading ||
    roundsQuery.isLoading ||
    predictionsQuery.isLoading;

  const isError = matchesQuery.isError || teamsQuery.isError || roundsQuery.isError;

  const teamMap = new Map((teamsQuery.data ?? []).map((t) => [t.id, t.name]));
  const teamLabelMap = new Map((teamsQuery.data ?? []).map((t) => [t.id, t.label_ca ?? t.name]));
  const roundMap = new Map((roundsQuery.data ?? []).map((r) => [r.id, r]));
  const predictionMap = new Map((predictionsQuery.data ?? []).map((p) => [p.match_id, p]));

  const matches = matchesQuery.data ?? [];

  // Group matches by day in Europe/Madrid timezone, sorted chronologically
  const activeDayGroups: DayGroup[] = [];
  const finishedDayGroups: DayGroup[] = [];

  if (!isLoading && !isError && matchesQuery.data) {
    const byDay = new Map<string, Match[]>();
    for (const match of matches) {
      const key = getSpanishDateKey(match.scheduled_at);
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key)!.push(match);
    }
    for (const dateKey of [...byDay.keys()].sort()) {
      const matches = byDay
        .get(dateKey)!
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
      const allFinished = matches.every((m) => m.status === 'FINISHED');
      if (allFinished) {
        finishedDayGroups.push({ dateKey, matches });
      } else {
        activeDayGroups.push({ dateKey, matches });
      }
    }
  }

  const totalDayGroups = activeDayGroups.length + finishedDayGroups.length;
  const finishedMatchCount = finishedDayGroups.reduce((n, g) => n + g.matches.length, 0);

  const daySectionProps = {
    teamMap,
    teamLabelMap,
    roundMap,
    predictionMap,
  };

  return (
    <div className="flex flex-col">
      <PageChrome
        title="Partits"
        description="Prediu el resultat dels partits del Mundial 2026"
      />

      {isLoading && (
        <div className="grid grid-cols-1 items-start gap-3 p-4 sm:grid-cols-2">
          {Array.from({ length: 6 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-2 px-4 py-20 text-center text-muted-foreground">
          <AlertCircle className="h-8 w-8" />
          <p className="text-sm font-medium">No s'han pogut carregar els partits</p>
          <p className="text-xs">Comprova la connexió i torna-ho a provar.</p>
        </div>
      )}

      {!isLoading && !isError && totalDayGroups === 0 && (
        <div className="px-4 py-20 text-center text-sm text-muted-foreground">
          Encara no hi ha partits programats.
        </div>
      )}

      {!isLoading && !isError && finishedDayGroups.length > 0 && (
        <div className="border-b border-border">
          <button
            onClick={() => setPastExpanded((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/30"
          >
            <span className="text-sm font-semibold text-muted-foreground">
              Resultats anteriors
              <span className="ml-1.5 text-xs font-normal">({finishedMatchCount} partits)</span>
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform duration-200',
                pastExpanded && 'rotate-180',
              )}
            />
          </button>
          {pastExpanded && finishedDayGroups.map((group) => (
            <MatchesDaySection key={group.dateKey} {...group} {...daySectionProps} />
          ))}
        </div>
      )}

      {!isLoading && !isError && activeDayGroups.map((group) => (
        <MatchesDaySection key={group.dateKey} {...group} {...daySectionProps} />
      ))}
    </div>
  );
}

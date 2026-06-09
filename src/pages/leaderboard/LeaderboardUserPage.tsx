import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, Lock } from 'lucide-react';
import {
  fetchUserGroupPickem,
  fetchUserBracketPickem,
  fetchPickemOverview,
  fetchGroups,
} from '@/api/pickem';
import { fetchUserCrystalBallAnswers, fetchCrystalBallQuestions, fetchTeams, fetchPlayers } from '@/api/crystal-ball';
import { fetchDeadlines } from '@/api/crystal-ball';
import { fetchTeams as fetchAllTeams, fetchMatches, fetchRounds, fetchUserMatchPredictions } from '@/api/matches';
import { deadlineHasPassed } from '@/lib/deadlines';
import { cn, getAvatarColor, getInitials } from '@/lib/utils';
import { TeamFlag } from '@/components/app/TeamFlag';
import { PHASE_LABELS, slotsByPhaseOrdered, BRACKET_PHASE_ORDER } from '@/pages/pickem/bracket-utils';
import { FinishedMatchPredictionCard } from '@/pages/matches/components/FinishedMatchPredictionCard';
import type { components } from '@/types/api';

type LeaderboardGame = 'pickem' | 'crystal-ball' | 'match';
type RoundResponse = components['schemas']['RoundResponse'];
type Phase = components['schemas']['Phase'];

const MATCH_PHASE_LABELS: Record<Phase, string> = {
  GROUP_STAGE: 'Fase de grups',
  ROUND_OF_32: 'Vuitens de final',
  ROUND_OF_16: 'Setzens de final',
  QUARTER_FINAL: 'Quarts de final',
  SEMI_FINAL: 'Semifinals',
  THIRD_FOURTH_POSITION: 'Tercer i quart lloc',
  FINAL: 'Final',
};

function getRoundLabel(round: RoundResponse): string {
  if (round.phase === 'GROUP_STAGE') return `Jornada ${round.round_number}`;
  return MATCH_PHASE_LABELS[round.phase];
}

type LocationState = {
  firstName?: string;
  lastName?: string;
  points?: number;
};

const GROUP_HEADER_COLORS = [
  'bg-red-600',
  'bg-blue-600',
  'bg-green-600',
  'bg-yellow-600',
  'bg-purple-600',
  'bg-orange-600',
  'bg-teal-600',
  'bg-pink-600',
];

function ReadOnlyGroupCard({
  name,
  teams,
  colorClass,
}: {
  name: string;
  teams: { teamId: string; teamName: string; teamLabel: string; position: number }[];
  colorClass: string;
}) {
  const sorted = [...teams].sort((a, b) => a.position - b.position);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className={cn('px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-white', colorClass)}>
        {name}
      </div>
      <ol className="divide-y divide-border">
        {sorted.map((entry) => (
          <li key={entry.teamId} className="flex items-center gap-2 px-3 py-2 text-sm">
            <span className="w-5 shrink-0 text-center text-xs font-bold text-muted-foreground">{entry.position}</span>
            <TeamFlag teamName={entry.teamName} size="sm" className="shrink-0" />
            <span className="min-w-0 truncate uppercase">{entry.teamLabel}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function PickemPredictions({ userId }: { userId: string }) {
  const { data: deadlines = [] } = useQuery({ queryKey: ['deadlines'], queryFn: fetchDeadlines });
  const groupVisible = deadlineHasPassed(deadlines, 'GROUP_STAGE');
  const bracketVisible = deadlineHasPassed(deadlines, 'BRACKET');

  const groupsQuery = useQuery({
    queryKey: ['groups'],
    queryFn: fetchGroups,
    enabled: groupVisible,
  });
  const teamsQuery = useQuery({
    queryKey: ['teams'],
    queryFn: fetchAllTeams,
    enabled: groupVisible || bracketVisible,
  });
  const overviewQuery = useQuery({
    queryKey: ['pickem-overview'],
    queryFn: fetchPickemOverview,
    enabled: bracketVisible,
  });
  const groupPicksQuery = useQuery({
    queryKey: ['user-group-picks', userId],
    queryFn: () => fetchUserGroupPickem(userId),
    enabled: groupVisible,
    retry: false,
  });
  const bracketPicksQuery = useQuery({
    queryKey: ['user-bracket-picks', userId],
    queryFn: () => fetchUserBracketPickem(userId),
    enabled: bracketVisible,
    retry: false,
  });

  const teamNameById = new Map((teamsQuery.data ?? []).map((t) => [t.id, t.name]));
  const teamLabelById = new Map((teamsQuery.data ?? []).map((t) => [t.id, t.label_ca ?? t.name]));
  const picksByGroup = new Map((groupPicksQuery.data ?? []).map((p) => [p.group_id, p]));

  if (!groupVisible && !bracketVisible) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <Lock className="h-4 w-4 shrink-0" />
        Les prediccions encara no són visibles — el termini no ha passat.
      </div>
    );
  }

  const bracketPicksBySlot = new Map(
    (bracketPicksQuery.data ?? []).map((p) => [p.slot_id, p]),
  );
  const slots = overviewQuery.data?.bracket.slots ?? [];
  const slotsByPhase = slotsByPhaseOrdered(slots);
  const visiblePhases = BRACKET_PHASE_ORDER.filter((phase) => slotsByPhase.has(phase));

  return (
    <div className="flex flex-col gap-8">
      {groupVisible && (
        <section>
          <h2 className="wc-section-heading mb-4">Fase de grups</h2>
          {groupPicksQuery.isLoading && <p className="text-sm text-muted-foreground">Carregant prediccions de grups…</p>}
          {groupPicksQuery.isError && (
            <p className="text-sm text-destructive">No s'han pogut carregar les prediccions de grups.</p>
          )}
          {groupPicksQuery.isSuccess && groupPicksQuery.data.length === 0 && (
            <p className="text-sm text-muted-foreground">No s'han enviat prediccions de fase de grups.</p>
          )}
          {groupPicksQuery.isSuccess && groupPicksQuery.data.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {(groupsQuery.data ?? []).map((group, idx) => {
                const pick = picksByGroup.get(group.id);
                if (!pick) return null;
                const teams = pick.entries.map((e) => ({
                  teamId: e.team_id,
                  teamName: teamNameById.get(e.team_id) ?? 'Unknown',
                  teamLabel: teamLabelById.get(e.team_id) ?? 'Unknown',
                  position: e.predicted_position,
                }));
                return (
                  <ReadOnlyGroupCard
                    key={group.id}
                    name={group.name}
                    teams={teams}
                    colorClass={GROUP_HEADER_COLORS[idx % GROUP_HEADER_COLORS.length]}
                  />
                );
              })}
            </div>
          )}
        </section>
      )}

      {bracketVisible && (
        <section>
          <h2 className="wc-section-heading mb-4">Bracket</h2>
          {bracketPicksQuery.isLoading && <p className="text-sm text-muted-foreground">Carregant prediccions del bracket…</p>}
          {bracketPicksQuery.isError && (
            <p className="text-sm text-destructive">No s'han pogut carregar les prediccions del bracket.</p>
          )}
          {bracketPicksQuery.isSuccess && bracketPicksQuery.data.length === 0 && (
            <p className="text-sm text-muted-foreground">No s'han enviat prediccions del bracket.</p>
          )}
          {bracketPicksQuery.isSuccess && bracketPicksQuery.data.length > 0 && (
            <div className="flex flex-col gap-6">
              {visiblePhases.map((phase) => (
                <div key={phase}>
                  <h3 className="mb-3 text-center text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {PHASE_LABELS[phase] ?? phase}
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {(slotsByPhase.get(phase) ?? []).map((slot) => {
                      const pick = bracketPicksBySlot.get(slot.slot_id);
                      const winnerFlagName = pick
                        ? teamNameById.get(pick.predicted_winner_team_id) ?? 'Unknown'
                        : null;
                      const winnerName = pick
                        ? teamLabelById.get(pick.predicted_winner_team_id) ?? 'Unknown'
                        : null;
                      return (
                        <div
                          key={slot.slot_id}
                          className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm"
                        >
                          <div className="mb-1.5 text-xs font-medium text-muted-foreground">
                            M{slot.slot_index}
                            {slot.home_team && slot.away_team && (
                              <span className="ml-1">
                                · {slot.home_team.name} vs {slot.away_team.name}
                              </span>
                            )}
                          </div>
                          {winnerName ? (
                            <div className="flex items-center justify-between gap-2">
                              <span className="flex min-w-0 items-center gap-1.5 font-medium uppercase">
                                <TeamFlag teamName={winnerFlagName!} size="sm" className="shrink-0" />
                                <span className="truncate">{winnerName}</span>
                              </span>
                              {pick && pick.points_awarded > 0 && (
                                <span className="text-xs font-bold text-primary">+{pick.points_awarded} pts</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function CrystalBallPredictions({ userId }: { userId: string }) {
  const { data: deadlines = [] } = useQuery({ queryKey: ['deadlines'], queryFn: fetchDeadlines });
  const visible = deadlineHasPassed(deadlines, 'CRYSTAL_BALL');

  const questionsQuery = useQuery({
    queryKey: ['crystal-ball-questions'],
    queryFn: fetchCrystalBallQuestions,
    enabled: visible,
  });
  const answersQuery = useQuery({
    queryKey: ['user-crystal-ball', userId],
    queryFn: () => fetchUserCrystalBallAnswers(userId),
    enabled: visible,
    retry: false,
  });
  const teamsQuery = useQuery({
    queryKey: ['teams'],
    queryFn: () => fetchTeams(),
    enabled: visible,
  });
  const playersQuery = useQuery({
    queryKey: ['players-all'],
    queryFn: () => fetchPlayers({}),
    enabled: visible,
  });

  if (!visible) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <Lock className="h-4 w-4 shrink-0" />
        Les respostes del Crystal Ball encara no són visibles — el termini no ha passat.
      </div>
    );
  }

  const answersByQuestion = new Map((answersQuery.data ?? []).map((a) => [a.question_id, a]));
  const teamNameById = new Map((teamsQuery.data ?? []).map((t) => [t.id, t.name]));
  const teamLabelById = new Map((teamsQuery.data ?? []).map((t) => [t.id, t.label_ca ?? t.name]));
  const playerNameById = new Map((playersQuery.data ?? []).map((p) => [p.id, p.name]));

  function renderAnswer(
    question: components['schemas']['CrystalBallQuestionResponse'],
    answer: components['schemas']['CrystalBallAnswerResponse'],
  ) {
    if (question.answer_type === 'NUMBER') {
      return <span className="font-semibold tabular-nums">{answer.range_value ?? '—'}</span>;
    }
    if (question.answer_type === 'TEAM' && answer.team_id) {
      const flagName = teamNameById.get(answer.team_id) ?? 'Unknown';
      const label = teamLabelById.get(answer.team_id) ?? 'Unknown';
      return (
        <span className="inline-flex items-center gap-1.5 uppercase">
          <TeamFlag teamName={flagName} size="sm" />
          {label}
        </span>
      );
    }
    if (question.answer_type === 'PLAYER' && answer.player_id) {
      return <span className="uppercase">{playerNameById.get(answer.player_id) ?? 'Unknown'}</span>;
    }
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-col gap-4">
      {answersQuery.isLoading && <p className="text-sm text-muted-foreground">Carregant respostes…</p>}
      {answersQuery.isError && <p className="text-sm text-destructive">No s'han pogut carregar les respostes del Crystal Ball.</p>}
      {answersQuery.isSuccess && answersQuery.data.length === 0 && (
        <p className="text-sm text-muted-foreground">No s'han enviat respostes del Crystal Ball.</p>
      )}
      {(questionsQuery.data ?? []).map((question) => {
        const prediction = answersByQuestion.get(question.id);
        const sortedAnswers = [...(prediction?.answers ?? [])].sort(
          (a, b) => a.selection_index - b.selection_index,
        );
        return (
          <div key={question.id} className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase">{question.label}</h3>
              {prediction && prediction.points_awarded > 0 && (
                <span className="shrink-0 text-xs font-bold text-primary">+{prediction.points_awarded} pts</span>
              )}
            </div>
            {sortedAnswers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No s'ha enviat cap resposta.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {sortedAnswers.map((answer) => (
                  <li key={answer.selection_index} className="text-sm">
                    {question.max_selections > 1 && (
                      <span className="mr-2 text-xs text-muted-foreground">#{answer.selection_index + 1}</span>
                    )}
                    {renderAnswer(question, answer)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MatchPredictions({ userId }: { userId: string }) {
  const matchesQuery = useQuery({ queryKey: ['matches'], queryFn: fetchMatches });
  const teamsQuery = useQuery({ queryKey: ['teams'], queryFn: fetchAllTeams });
  const roundsQuery = useQuery({ queryKey: ['rounds'], queryFn: fetchRounds });
  const predictionsQuery = useQuery({
    queryKey: ['user-match-predictions', userId],
    queryFn: () => fetchUserMatchPredictions(userId),
    retry: false,
  });

  const hasFinishedMatches = (matchesQuery.data ?? []).some((m) => m.status === 'FINISHED');

  if (matchesQuery.isSuccess && !hasFinishedMatches) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <Lock className="h-4 w-4 shrink-0" />
        Les prediccions encara no són visibles — cap partit ha acabat.
      </div>
    );
  }

  const teamNameById = new Map((teamsQuery.data ?? []).map((t) => [t.id, t.name]));
  const teamLabelById = new Map((teamsQuery.data ?? []).map((t) => [t.id, t.label_ca ?? t.name]));
  const roundById = new Map((roundsQuery.data ?? []).map((r) => [r.id, r]));
  const matchById = new Map((matchesQuery.data ?? []).map((m) => [m.id, m]));

  const sortedPredictions = [...(predictionsQuery.data ?? [])].sort((a, b) => {
    const ma = matchById.get(a.match_id);
    const mb = matchById.get(b.match_id);
    if (!ma || !mb) return 0;
    return new Date(mb.scheduled_at).getTime() - new Date(ma.scheduled_at).getTime();
  });

  const isLoading =
    matchesQuery.isLoading ||
    teamsQuery.isLoading ||
    roundsQuery.isLoading ||
    predictionsQuery.isLoading;

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregant prediccions de partits…</p>;
  }

  if (predictionsQuery.isError) {
    return <p className="text-sm text-destructive">No s'han pogut carregar les prediccions de partits.</p>;
  }

  if (sortedPredictions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hi ha prediccions visibles en partits acabats.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {sortedPredictions.map((prediction) => {
        const match = matchById.get(prediction.match_id);
        if (!match) return null;

        const homeTeam = teamNameById.get(match.home_team_id) ?? 'Unknown';
        const awayTeam = teamNameById.get(match.away_team_id) ?? 'Unknown';
        const homeTeamLabel = teamLabelById.get(match.home_team_id) ?? homeTeam;
        const awayTeamLabel = teamLabelById.get(match.away_team_id) ?? awayTeam;
        const round = roundById.get(match.round_id);
        const roundLabel = round ? getRoundLabel(round) : '';

        return (
          <FinishedMatchPredictionCard
            key={prediction.id}
            match={match}
            prediction={prediction}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            homeTeamLabel={homeTeamLabel}
            awayTeamLabel={awayTeamLabel}
            roundLabel={roundLabel}
            scoreLabel="Predicció"
            predictionLinePrefix="Predicció:"
            collapsible
          />
        );
      })}
    </div>
  );
}

export default function LeaderboardUserPage() {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const state = (location.state as LocationState | null) ?? {};
  const game = (searchParams.get('game') ?? 'pickem') as LeaderboardGame;

  if (!userId) {
    return null;
  }

  const displayName =
    state.firstName && state.lastName
      ? `${state.firstName} ${state.lastName}`
      : 'Jugador';

  const gameLabel =
    game === 'crystal-ball'
      ? 'Crystal Ball'
      : game === 'match'
        ? 'Predicció de partits'
        : "Pick'em";

  return (
    <div className="flex flex-col">
      <div className="border-b border-border bg-card px-4 py-4">
        <Link
          to={`/leaderboard?tab=${game}`}
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Tornar a la classificació
        </Link>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white',
              getAvatarColor(userId),
            )}
          >
            {state.firstName && state.lastName
              ? getInitials(state.firstName, state.lastName)
              : '?'}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="wc-font-body truncate text-lg uppercase leading-tight">{displayName}</h1>
            <p className="text-xs text-muted-foreground">{gameLabel}</p>
          </div>
          {state.points != null && (
            <div className="shrink-0 text-right">
              <span className="text-sm font-bold tabular-nums">{state.points}</span>
              <span className="ml-1 text-xs text-muted-foreground">pts</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4">
        {!userId ? (
          <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
            <AlertCircle className="h-8 w-8" />
            <p className="text-sm">Usuari no trobat.</p>
          </div>
        ) : game === 'crystal-ball' ? (
          <CrystalBallPredictions userId={userId} />
        ) : game === 'match' ? (
          <MatchPredictions userId={userId} />
        ) : (
          <PickemPredictions userId={userId} />
        )}
      </div>
    </div>
  );
}

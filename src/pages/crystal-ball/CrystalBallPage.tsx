import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Lock, Search, X, Sparkles } from 'lucide-react';
import {
  fetchCrystalBallQuestions,
  fetchMyAnswers,
  fetchTeams,
  fetchPlayers,
  fetchDeadlines,
  submitAnswers,
} from '@/api/crystal-ball';
import { PageChrome } from '@/components/app/PageChrome';
import { TeamFlag } from '@/components/app/TeamFlag';
import { cn } from '@/lib/utils';
import type { components } from '@/types/api';

type CrystalBallQuestionResponse = components['schemas']['CrystalBallQuestionResponse'];
type CrystalBallAnswerResponse = components['schemas']['CrystalBallAnswerResponse'];
type TeamResponse = components['schemas']['TeamResponse'];
type PlayerResponse = components['schemas']['PlayerResponse'];
type AnswerDraft = components['schemas']['CrystalBallAnswerRequest'];

// ── Descriptions (supplemental hint text, not labels) ────────────────────────

const QUESTION_DESCRIPTIONS: Record<string, string> = {
  IDEAL_XI: 'Tria els 11 jugadors que creus que formaran el millor onze del torneig.',
  TOP_4: "Tria els 4 equips que arriben a les semifinals (l'ordre importa).",
  FURTHEST_TEAM_PER_CONTINENT: 'Tria l\'equip que arriba més lluny de cada confederació.',
};

// ── Player search ─────────────────────────────────────────────────────────────

function usePlayerSearch() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onChange = useCallback((val: string) => {
    setQuery(val);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebouncedQuery(val), 350);
  }, []);

  const { data: players = [], isFetching } = useQuery({
    queryKey: ['players-search', debouncedQuery],
    queryFn: () => fetchPlayers({ search: debouncedQuery }),
    enabled: debouncedQuery.length >= 2,
    staleTime: 60_000,
  });

  return { query, onChange, players, isFetching };
}

// ── Team picker ───────────────────────────────────────────────────────────────

function TeamPicker({
  teams,
  selected,
  maxSelections,
  onToggle,
  locked,
}: {
  teams: TeamResponse[];
  selected: string[];
  maxSelections: number;
  onToggle: (teamId: string) => void;
  locked: boolean;
}) {
  const [filter, setFilter] = useState('');
  const filtered = teams.filter((t) =>
    t.name.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((id, idx) => {
            const team = teams.find((t) => t.id === id);
            if (!team) return null;
            return (
              <span
                key={id}
                className="flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary"
              >
                {maxSelections > 1 && (
                  <span className="text-[10px] text-primary/60">{idx + 1}.</span>
                )}
                <TeamFlag teamName={team.name} size="sm" />
                {team.name}
                {!locked && (
                  <button
                    onClick={() => onToggle(id)}
                    className="ml-0.5 text-primary/60 hover:text-primary"
                  >
                    <X size={12} />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}

      {!locked && selected.length < maxSelections && (
        <>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter teams…"
              className="w-full rounded-lg border border-border bg-background py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="max-h-44 overflow-y-auto rounded-lg border border-border">
            {filtered.map((team) => {
              const isSelected = selected.includes(team.id);
              return (
                <button
                  key={team.id}
                  onClick={() => onToggle(team.id)}
                  disabled={isSelected}
                  className={cn(
                    'flex w-full items-center gap-2 border-b border-border px-3 py-2 text-left text-sm transition-colors last:border-b-0',
                    isSelected
                      ? 'cursor-default bg-muted/40 text-muted-foreground'
                      : 'hover:bg-muted/60',
                  )}
                >
                  <TeamFlag teamName={team.name} size="sm" />
                  {team.name}
                  {isSelected && <CheckCircle2 size={14} className="ml-auto text-primary" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Player picker ─────────────────────────────────────────────────────────────

function PlayerPicker({
  teams,
  selected,
  maxSelections,
  onToggle,
  locked,
}: {
  teams: TeamResponse[];
  selected: string[];
  maxSelections: number;
  onToggle: (playerId: string, playerName: string, teamId: string) => void;
  locked: boolean;
}) {
  const { query, onChange, players, isFetching } = usePlayerSearch();
  const [playerNames, setPlayerNames] = useState<Record<string, { name: string; teamId: string }>>(
    {},
  );

  const handleToggle = (player: PlayerResponse) => {
    setPlayerNames((prev) => ({
      ...prev,
      [player.id]: { name: player.name, teamId: player.team_id },
    }));
    onToggle(player.id, player.name, player.team_id);
  };

  const getTeamName = (teamId: string) => teams.find((t) => t.id === teamId)?.name ?? '';

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((id, idx) => {
            const info = playerNames[id];
            return (
              <span
                key={id}
                className="flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary"
              >
                {maxSelections > 1 && (
                  <span className="text-[10px] text-primary/60">{idx + 1}.</span>
                )}
                {info && <TeamFlag teamName={getTeamName(info.teamId)} size="sm" />}
                {info?.name ?? id.slice(0, 8)}
                {!locked && (
                  <button
                    onClick={() =>
                      info && onToggle(id, info.name, info.teamId)
                    }
                    className="ml-0.5 text-primary/60 hover:text-primary"
                  >
                    <X size={12} />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}

      {!locked && selected.length < maxSelections && (
        <>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={query}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Search player name (min 2 chars)…"
              className="w-full rounded-lg border border-border bg-background py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {query.length >= 2 && (
            <div className="max-h-44 overflow-y-auto rounded-lg border border-border">
              {isFetching && (
                <div className="px-3 py-2 text-sm text-muted-foreground">Searching…</div>
              )}
              {!isFetching && players.length === 0 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">No players found</div>
              )}
              {!isFetching &&
                players.map((player) => {
                  const isSelected = selected.includes(player.id);
                  return (
                    <button
                      key={player.id}
                      onClick={() => !isSelected && handleToggle(player)}
                      disabled={isSelected}
                      className={cn(
                        'flex w-full items-center gap-2 border-b border-border px-3 py-2 text-left text-sm transition-colors last:border-b-0',
                        isSelected
                          ? 'cursor-default bg-muted/40 text-muted-foreground'
                          : 'hover:bg-muted/60',
                      )}
                    >
                      <TeamFlag teamName={getTeamName(player.team_id)} size="sm" />
                      <span className="flex-1">{player.name}</span>
                      <span className="text-xs text-muted-foreground">{player.position}</span>
                      {isSelected && <CheckCircle2 size={14} className="text-primary" />}
                    </button>
                  );
                })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Question card ─────────────────────────────────────────────────────────────

function QuestionCard({
  question,
  savedAnswers,
  teams,
  locked,
  onSave,
}: {
  question: CrystalBallQuestionResponse;
  savedAnswers: CrystalBallAnswerResponse[] | undefined;
  teams: TeamResponse[];
  locked: boolean;
  onSave: (questionId: string, answers: AnswerDraft[]) => Promise<void>;
}) {
  const [drafts, setDrafts] = useState<AnswerDraft[]>(() => {
    if (!savedAnswers) return [];
    return savedAnswers.map((a) => ({
      selection_index: a.selection_index,
      player_id: a.player_id ?? undefined,
      team_id: a.team_id ?? undefined,
      numeric_value: a.numeric_value ?? undefined,
    }));
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const isSaved = savedAnswers !== undefined && savedAnswers.length > 0;
  const label = question.label || question.type;
  const desc = QUESTION_DESCRIPTIONS[question.type];

  // Sync when savedAnswers arrives
  useEffect(() => {
    if (!savedAnswers) return;
    setDrafts(
      savedAnswers.map((a) => ({
        selection_index: a.selection_index,
        player_id: a.player_id ?? undefined,
        team_id: a.team_id ?? undefined,
        numeric_value: a.numeric_value ?? undefined,
      })),
    );
  }, [savedAnswers]);

  const selectedIds = drafts
    .sort((a, b) => a.selection_index - b.selection_index)
    .map((d) =>
      question.answer_type === 'PLAYER' ? (d.player_id ?? '') : (d.team_id ?? ''),
    )
    .filter(Boolean);

  const handleToggleTeam = (teamId: string) => {
    setDrafts((prev) => {
      const exists = prev.find((d) => d.team_id === teamId);
      if (exists) return prev.filter((d) => d.team_id !== teamId);
      const nextIndex = prev.length;
      return [...prev, { selection_index: nextIndex, team_id: teamId }];
    });
    setSaved(false);
  };

  const handleTogglePlayer = (playerId: string, _name: string, _teamId: string) => {
    setDrafts((prev) => {
      const exists = prev.find((d) => d.player_id === playerId);
      if (exists) return prev.filter((d) => d.player_id !== playerId);
      const nextIndex = prev.length;
      return [...prev, { selection_index: nextIndex, player_id: playerId }];
    });
    setSaved(false);
  };

  const handleNumberChange = (val: string) => {
    const n = val === '' ? undefined : Number(val);
    setDrafts([{ selection_index: 0, numeric_value: n }]);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(question.id, drafts);
      setSaved(true);
    } catch {
      setSaveError('Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const isComplete =
    question.answer_type === 'NUMBER'
      ? drafts[0]?.numeric_value != null
      : drafts.length > 0 && drafts.length <= question.max_selections;

  const numberVal =
    question.answer_type === 'NUMBER' ? (drafts[0]?.numeric_value ?? '') : '';

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{label}</span>
            {isSaved && !locked && (
              <CheckCircle2 size={14} className="shrink-0 text-green-500" />
            )}
            {locked && <Lock size={13} className="shrink-0 text-muted-foreground" />}
          </div>
          {desc && <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>}
        </div>
        <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary">
          {question.points_value} pts
        </span>
      </div>

      {question.max_selections > 1 && question.answer_type !== 'NUMBER' && (
        <p className="mb-2 text-xs text-muted-foreground">
          {drafts.length} / {question.max_selections} selected
        </p>
      )}

      {question.answer_type === 'NUMBER' && (
        <input
          type="number"
          min={0}
          value={numberVal}
          disabled={locked}
          onChange={(e) => handleNumberChange(e.target.value)}
          placeholder="Enter a number…"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
        />
      )}

      {question.answer_type === 'TEAM' && (
        <TeamPicker
          teams={teams}
          selected={selectedIds}
          maxSelections={question.max_selections}
          onToggle={handleToggleTeam}
          locked={locked}
        />
      )}

      {question.answer_type === 'PLAYER' && (
        <PlayerPicker
          teams={teams}
          selected={selectedIds}
          maxSelections={question.max_selections}
          onToggle={handleTogglePlayer}
          locked={locked}
        />
      )}

      {!locked && (
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving || !isComplete}
            className={cn(
              'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
              isComplete && !saving
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'cursor-not-allowed bg-muted text-muted-foreground',
            )}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          {saved && !saving && (
            <span className="flex items-center gap-1 text-xs text-green-500">
              <CheckCircle2 size={12} /> Saved
            </span>
          )}
          {saveError && (
            <span className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle size={12} /> {saveError}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CrystalBallPage() {
  const queryClient = useQueryClient();

  const { data: questions = [], isLoading: loadingQ, isError: errorQ } = useQuery({
    queryKey: ['crystal-ball-questions'],
    queryFn: fetchCrystalBallQuestions,
    staleTime: 5 * 60_000,
  });

  const { data: myAnswers = [], isLoading: loadingA } = useQuery({
    queryKey: ['crystal-ball-answers'],
    queryFn: fetchMyAnswers,
    staleTime: 60_000,
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => fetchTeams(),
    staleTime: 10 * 60_000,
  });

  const { data: deadlines = [] } = useQuery({
    queryKey: ['deadlines'],
    queryFn: fetchDeadlines,
    staleTime: 60_000,
  });

  const deadline = deadlines.find((d) => d.deadline_type === 'CRYSTAL_BALL');
  const isLocked = deadline ? new Date() > new Date(deadline.deadline_dt) : false;

  const answersByQuestion = Object.fromEntries(
    myAnswers.map((pred) => [pred.question_id, pred.answers]),
  );

  const { mutateAsync } = useMutation({
    mutationFn: submitAnswers,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crystal-ball-answers'] });
    },
  });

  const handleSave = async (questionId: string, answers: AnswerDraft[]) => {
    await mutateAsync({ predictions: [{ question_id: questionId, answers }] });
  };

  const isLoading = loadingQ || loadingA;

  return (
    <div className="flex flex-col">
      <PageChrome
        title="Crystal Ball"
        description="Predict the unusual — special tournament questions"
      />

      {isLocked && (
        <div className="mx-4 mt-4 flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <Lock size={14} />
          Predictions are locked — the deadline has passed.
        </div>
      )}

      <div className="space-y-3 p-4">
        {isLoading &&
          Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-border bg-card"
            />
          ))}

        {!isLoading && errorQ && (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8" />
            <p className="text-sm font-medium">Failed to load Crystal Ball questions</p>
          </div>
        )}

        {!isLoading && !errorQ && questions.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <Sparkles className="h-8 w-8" />
            <p className="text-sm">No questions available yet — check back soon!</p>
          </div>
        )}

        {!isLoading &&
          !errorQ &&
          questions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              savedAnswers={answersByQuestion[q.id]}
              teams={teams}
              locked={isLocked}
              onSave={handleSave}
            />
          ))}
      </div>
    </div>
  );
}

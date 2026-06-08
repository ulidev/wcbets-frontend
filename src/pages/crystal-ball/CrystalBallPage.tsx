import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { wcBtnPrimary, wcFontBody } from '@/lib/wc-ui';
import { IdealXIPitch } from '@/pages/crystal-ball/ideal-xi/IdealXIPitch';
import { isIdealXIComplete } from '@/pages/crystal-ball/ideal-xi/ideal-xi.data';
import type { IdealXIAnswerDraft } from '@/pages/crystal-ball/ideal-xi/types';
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

function answerTypeHint(answerType: string, maxSelections: number): string {
  if (answerType === 'PLAYER') {
    return maxSelections > 1
      ? `Selecciona ${maxSelections} jugadors`
      : 'Selecciona un jugador';
  }
  if (answerType === 'TEAM') {
    return maxSelections > 1
      ? `Selecciona ${maxSelections} equips`
      : 'Selecciona un equip';
  }
  return 'Introdueix un número';
}

function savedToDrafts(answers: CrystalBallAnswerResponse[]): AnswerDraft[] {
  return answers.map((a) => ({
    selection_index: a.selection_index,
    player_id: a.player_id ?? undefined,
    team_id: a.team_id ?? undefined,
    numeric_value: a.numeric_value ?? undefined,
  }));
}

function isDraftComplete(
  question: CrystalBallQuestionResponse,
  drafts: AnswerDraft[],
): boolean {
  if (question.type === 'IDEAL_XI') {
    const xiDrafts: IdealXIAnswerDraft[] = drafts
      .filter((d): d is AnswerDraft & { player_id: string } => d.player_id != null)
      .map((d) => ({ selection_index: d.selection_index, player_id: d.player_id }));
    return isIdealXIComplete(xiDrafts);
  }
  if (question.answer_type === 'NUMBER') {
    return drafts[0]?.numeric_value != null;
  }
  return drafts.length === question.max_selections;
}

function draftsEqual(a: AnswerDraft[], b: AnswerDraft[]): boolean {
  if (a.length !== b.length) return false;
  const key = (d: AnswerDraft) =>
    `${d.selection_index}:${d.team_id ?? ''}:${d.player_id ?? ''}:${d.numeric_value ?? ''}`;
  const sorted = (list: AnswerDraft[]) =>
    [...list].sort((x, y) => x.selection_index - y.selection_index).map(key);
  const ka = sorted(a);
  const kb = sorted(b);
  return ka.every((k, i) => k === kb[i]);
}

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
  const [pickerOpen, setPickerOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canAddMore = !locked && selected.length < maxSelections;
  const showResults = canAddMore && pickerOpen;
  const query = filter.trim().toLowerCase();
  const filtered = teams.filter((t) =>
    query.length === 0 ? true : t.name.toLowerCase().includes(query) || (t.label_ca?.toLowerCase().includes(query) ?? false),
  );

  const openPicker = () => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    setPickerOpen(true);
  };

  const scheduleClose = () => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    blurTimer.current = setTimeout(() => setPickerOpen(false), 180);
  };

  const handleSelect = (teamId: string) => {
    onToggle(teamId);
    setFilter('');
    setPickerOpen(false);
  };

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
                className={cn(
                  'flex items-center gap-1.5 rounded-full border border-wc-hermes/20 bg-wc-hermes/10 px-2.5 py-1 text-xs uppercase text-wc-hermes',
                  wcFontBody,
                )}
              >
                {maxSelections > 1 && (
                  <span className="text-[10px] text-wc-hermes/60">{idx + 1}.</span>
                )}
                <TeamFlag teamName={team.name} size="sm" />
                {team.label_ca ?? team.name}
                {!locked && (
                  <button
                    type="button"
                    onClick={() => onToggle(id)}
                    className="ml-0.5 text-wc-hermes/60 hover:text-wc-red"
                  >
                    <X size={12} />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}

      {canAddMore && (
        <>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                openPicker();
              }}
              onFocus={openPicker}
              onBlur={scheduleClose}
              placeholder="Buscar equipo…"
              className="w-full rounded-xl border border-wc-light-gray bg-white py-2 pl-8 pr-3 text-sm text-wc-card-text focus:outline-none focus:ring-2 focus:ring-wc-green/40"
            />
          </div>
          {showResults && (
            <div
              className="crystal-picker-surface max-h-44 overflow-y-auto"
              onMouseDown={(e) => e.preventDefault()}
            >
              {filtered.length === 0 ? (
                <div className="px-3 py-2 text-sm text-wc-dark-gray">No teams found</div>
              ) : (
                filtered.map((team) => {
                  const isSelected = selected.includes(team.id);
                  return (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => !isSelected && handleSelect(team.id)}
                      disabled={isSelected}
                      className={cn(
                        'flex w-full items-center gap-2 border-b border-wc-light-gray/80 px-3 py-2 text-left text-sm uppercase transition-colors last:border-b-0',
                        wcFontBody,
                        isSelected
                          ? 'cursor-default bg-wc-light-gray/30 text-wc-dark-gray'
                          : 'hover:bg-wc-hermes/5',
                      )}
                    >
                      <TeamFlag teamName={team.name} size="sm" />
                      {team.label_ca ?? team.name}
                      {isSelected && <CheckCircle2 size={14} className="ml-auto text-wc-green" />}
                    </button>
                  );
                })
              )}
            </div>
          )}
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
                className={cn(
                  'flex items-center gap-1.5 rounded-full border border-wc-hermes/20 bg-wc-hermes/10 px-2.5 py-1 text-xs uppercase text-wc-hermes',
                  wcFontBody,
                )}
              >
                {maxSelections > 1 && (
                  <span className="text-[10px] text-wc-hermes/60">{idx + 1}.</span>
                )}
                {info && <TeamFlag teamName={getTeamName(info.teamId)} size="sm" />}
                {info?.name ?? id.slice(0, 8)}
                {!locked && (
                  <button
                    onClick={() =>
                      info && onToggle(id, info.name, info.teamId)
                    }
                    className="ml-0.5 text-wc-hermes/60 hover:text-wc-red"
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
              placeholder="Buscar jugador (mín. 2 letras)…"
              className="w-full rounded-xl border border-wc-light-gray bg-white py-2 pl-8 pr-3 text-sm text-wc-card-text focus:outline-none focus:ring-2 focus:ring-wc-green/40"
            />
          </div>

          {query.length >= 2 && (
            <div
              className="crystal-picker-surface max-h-44 overflow-y-auto"
              onMouseDown={(e) => e.preventDefault()}
            >
              {isFetching && (
                <div className="px-3 py-2 text-sm text-wc-dark-gray">Searching…</div>
              )}
              {!isFetching && players.length === 0 && (
                <div className="px-3 py-2 text-sm text-wc-dark-gray">No players found</div>
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
                        'flex w-full items-center gap-2 border-b border-wc-light-gray/80 px-3 py-2 text-left text-sm uppercase transition-colors last:border-b-0',
                        wcFontBody,
                        isSelected
                          ? 'cursor-default bg-wc-light-gray/30 text-wc-dark-gray'
                          : 'hover:bg-wc-hermes/5',
                      )}
                    >
                      <TeamFlag teamName={getTeamName(player.team_id)} size="sm" />
                      <span className={cn('flex-1', wcFontBody)}>{player.name}</span>
                      <span className="text-xs text-wc-dark-gray">{player.position}</span>
                      {isSelected && <CheckCircle2 size={14} className="text-wc-green" />}
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
  drafts,
  onDraftsChange,
  savedAnswers,
  teams,
  locked,
}: {
  question: CrystalBallQuestionResponse;
  drafts: AnswerDraft[];
  onDraftsChange: (drafts: AnswerDraft[]) => void;
  savedAnswers: CrystalBallAnswerResponse[] | undefined;
  teams: TeamResponse[];
  locked: boolean;
}) {
  const isSaved = savedAnswers !== undefined && savedAnswers.length > 0;
  const isDirty =
    isSaved && !draftsEqual(drafts, savedToDrafts(savedAnswers));
  const isComplete = isDraftComplete(question, drafts);
  const label = question.label || question.type;
  const desc = QUESTION_DESCRIPTIONS[question.type];

  const selectedIds = drafts
    .sort((a, b) => a.selection_index - b.selection_index)
    .map((d) =>
      question.answer_type === 'PLAYER' ? (d.player_id ?? '') : (d.team_id ?? ''),
    )
    .filter(Boolean);

  const handleToggleTeam = (teamId: string) => {
    const exists = drafts.find((d) => d.team_id === teamId);
    if (exists) {
      onDraftsChange(
        drafts
          .filter((d) => d.team_id !== teamId)
          .map((d, i) => ({ ...d, selection_index: i })),
      );
      return;
    }
    onDraftsChange([...drafts, { selection_index: drafts.length, team_id: teamId }]);
  };

  const handleTogglePlayer = (playerId: string) => {
    const exists = drafts.find((d) => d.player_id === playerId);
    if (exists) {
      onDraftsChange(
        drafts
          .filter((d) => d.player_id !== playerId)
          .map((d, i) => ({ ...d, selection_index: i })),
      );
      return;
    }
    onDraftsChange([...drafts, { selection_index: drafts.length, player_id: playerId }]);
  };

  const idealXiDrafts: IdealXIAnswerDraft[] = drafts
    .filter((d): d is AnswerDraft & { player_id: string } => d.player_id != null)
    .map((d) => ({ selection_index: d.selection_index, player_id: d.player_id }));

  const handleIdealXiChange = (next: IdealXIAnswerDraft[]) => {
    onDraftsChange(
      next.map((d) => ({ selection_index: d.selection_index, player_id: d.player_id })),
    );
  };

  const handleNumberChange = (val: string) => {
    const n = val === '' ? undefined : Number(val);
    onDraftsChange([{ selection_index: 0, numeric_value: n }]);
  };

  const numberVal =
    question.answer_type === 'NUMBER' ? (drafts[0]?.numeric_value ?? '') : '';

  const scopeLabel = question.scope ? ` · ${question.scope}` : '';

  return (
    <article className="crystal-pred-card">
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="crystal-pred-title">{label}</h2>
          <p className="crystal-pred-detail">
            {desc ?? answerTypeHint(question.answer_type, question.max_selections)}
            {scopeLabel}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="crystal-badge-official">
              ★ {question.points_value} punts
            </span>
            {isSaved && !isDirty && (
              <span className="crystal-badge-official bg-wc-green">
                Predicció guardada
              </span>
            )}
            {isDirty && (
              <span className="crystal-badge-official bg-amber-500">
                Canvis sense guardar
              </span>
            )}
            {!isSaved && isComplete && (
              <span className="crystal-badge-official bg-wc-hermes">
                Llista per guardar
              </span>
            )}
            {locked && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-wc-dark-gray">
                <Lock size={12} /> Tancat
              </span>
            )}
          </div>
        </div>
        {isSaved && !isDirty && !locked && (
          <CheckCircle2 size={20} className="shrink-0 text-wc-green" aria-label="Saved" />
        )}
      </div>

      {question.max_selections > 1 && question.answer_type !== 'NUMBER' && question.type !== 'IDEAL_XI' && (
        <p className="mb-2 text-xs font-semibold text-wc-dark-gray">
          {drafts.length} / {question.max_selections} seleccionats
        </p>
      )}

      {question.type === 'IDEAL_XI' && (
        <IdealXIPitch
          drafts={idealXiDrafts}
          onDraftsChange={handleIdealXiChange}
          teams={teams}
          locked={locked}
        />
      )}

      {question.answer_type === 'NUMBER' && (
        <input
          type="number"
          min={0}
          value={numberVal}
          disabled={locked}
          onChange={(e) => handleNumberChange(e.target.value)}
          placeholder="Introdueix un número…"
          className="w-full rounded-xl border border-wc-light-gray bg-white px-3 py-2.5 text-sm text-wc-card-text focus:outline-none focus:ring-2 focus:ring-wc-green/40 disabled:cursor-not-allowed disabled:opacity-60"
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

      {question.answer_type === 'PLAYER' && question.type !== 'IDEAL_XI' && (
        <PlayerPicker
          teams={teams}
          selected={selectedIds}
          maxSelections={question.max_selections}
          onToggle={handleTogglePlayer}
          locked={locked}
        />
      )}

    </article>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CrystalBallPage() {
  const queryClient = useQueryClient();
  const [draftsByQuestion, setDraftsByQuestion] = useState<Record<string, AnswerDraft[]>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const answersHydrated = useRef(false);

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

  useEffect(() => {
    if (loadingA || answersHydrated.current) return;
    answersHydrated.current = true;
    setDraftsByQuestion(
      Object.fromEntries(myAnswers.map((p) => [p.question_id, savedToDrafts(p.answers)])),
    );
  }, [loadingA, myAnswers]);

  const { mutateAsync, isPending: saving } = useMutation({
    mutationFn: submitAnswers,
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['crystal-ball-answers'] });
      setDraftsByQuestion((prev) => ({
        ...prev,
        ...Object.fromEntries(saved.map((p) => [p.question_id, savedToDrafts(p.answers)])),
      }));
      setSaveError(null);
    },
    onError: () => setSaveError('No s’han pogut guardar les prediccions. Torna-ho a provar.'),
  });

  const predictionsToSave = questions
    .map((q) => {
      const drafts = draftsByQuestion[q.id] ?? [];
      if (!isDraftComplete(q, drafts)) return null;
      const saved = answersByQuestion[q.id];
      if (saved && draftsEqual(drafts, savedToDrafts(saved))) return null;
      return { question_id: q.id, answers: drafts };
    })
    .filter((p): p is { question_id: string; answers: AnswerDraft[] } => p !== null);

  const handleSaveAll = async () => {
    if (predictionsToSave.length === 0 || isLocked) return;
    setSaveError(null);
    await mutateAsync({ predictions: predictionsToSave });
  };

  const isLoading = loadingQ || loadingA;

  const sortedQuestions = useMemo(() => {
    const ideal = questions.filter((q) => q.type === 'IDEAL_XI');
    const rest = questions.filter((q) => q.type !== 'IDEAL_XI');
    return [...rest, ...ideal];
  }, [questions]);

  return (
    <div className="flex flex-col">
      <PageChrome
        title="Crystal Ball"
        description="Predict the unusual — special tournament questions"
      />

      {isLocked && (
        <div className="mx-4 mt-4 flex items-center gap-2 rounded-[20px] border-l-4 border-l-wc-red bg-gradient-to-r from-white to-[#f0f2f5] px-4 py-3 text-sm font-semibold text-wc-dark-gray shadow-sm">
          <Lock size={14} className="text-wc-hermes" />
          Les prediccions estan tancades — ha passat el termini.
        </div>
      )}

      <div className="space-y-3 p-4">
        {isLoading &&
          Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-[18px] border-l-[6px] border-l-wc-red/30 bg-gradient-to-br from-white to-[#f0f2f5]"
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
          sortedQuestions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              drafts={draftsByQuestion[q.id] ?? []}
              onDraftsChange={(next) =>
                setDraftsByQuestion((prev) => ({ ...prev, [q.id]: next }))
              }
              savedAnswers={answersByQuestion[q.id]}
              teams={teams}
              locked={isLocked}
            />
          ))}
      </div>

      {!isLocked && !isLoading && !errorQ && questions.length > 0 && (
        <div className="sticky bottom-0 z-10 border-t border-wc-light-gray bg-white/95 px-4 py-3 backdrop-blur-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-wc-dark-gray">
              {predictionsToSave.length === 0
                ? 'Completa almenys una pregunta per guardar.'
                : `${predictionsToSave.length} pregunta${predictionsToSave.length === 1 ? '' : 'es'} per guardar`}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handleSaveAll()}
                disabled={saving || predictionsToSave.length === 0}
                className={wcBtnPrimary}
              >
                {saving ? 'Guardant…' : 'Guardar prediccions'}
              </button>
              {saveError && (
                <span className="flex items-center gap-1 text-xs font-semibold text-wc-red">
                  <AlertCircle size={12} /> {saveError}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

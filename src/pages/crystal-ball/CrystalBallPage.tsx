import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Lock, Sparkles } from 'lucide-react';
import {
  fetchCrystalBallQuestions,
  fetchDeadlines,
  fetchMyAnswers,
  fetchTeams,
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
import { CrystalBallSaveBar } from '@/pages/crystal-ball/components/CrystalBallSaveBar';
import { QuestionCard } from '@/pages/crystal-ball/components/QuestionCard';
import { IDEAL_XI_DEFAULT_FORMATION_ID } from '@/pages/crystal-ball/ideal-xi/ideal-xi.data';
import type {
  AnswerDraft,
  CrystalBallPredictionResponse,
  SubmitCrystalBallAnswersRequest,
} from './crystal-ball.types';
import { draftsEqual, isDraftComplete, savedToDrafts } from './crystal-ball.utils';

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CrystalBallPage() {
  const queryClient = useQueryClient();
  const [draftsByQuestion, setDraftsByQuestion] = useState<Record<string, AnswerDraft[]>>({});
  const [formationIdByQuestion, setFormationIdByQuestion] = useState<Record<string, string>>({});
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

  const predictionByQuestion = useMemo(
    () =>
      Object.fromEntries(myAnswers.map((pred) => [pred.question_id, pred])) as Record<
        string,
        CrystalBallPredictionResponse
      >,
    [myAnswers],
  );

  useEffect(() => {
    if (loadingA || answersHydrated.current) return;
    answersHydrated.current = true;
    setDraftsByQuestion(
      Object.fromEntries(myAnswers.map((p) => [p.question_id, savedToDrafts(p.answers)])),
    );
    setFormationIdByQuestion(
      Object.fromEntries(
        myAnswers
          .filter((p) => p.formation_id)
          .map((p) => [p.question_id, p.formation_id!]),
      ),
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
      setFormationIdByQuestion((prev) => ({
        ...prev,
        ...Object.fromEntries(
          saved
            .filter((p) => p.formation_id)
            .map((p) => [p.question_id, p.formation_id!]),
        ),
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
      const currentFormation =
        formationIdByQuestion[q.id] ?? IDEAL_XI_DEFAULT_FORMATION_ID;
      const savedFormation = predictionByQuestion[q.id]?.formation_id ?? null;
      const answersMatch = saved && draftsEqual(drafts, savedToDrafts(saved));
      const formationMatch =
        q.type !== 'IDEAL_XI' || savedFormation === currentFormation;
      if (answersMatch && formationMatch) return null;

      const payload: SubmitCrystalBallAnswersRequest = {
        question_id: q.id,
        answers: drafts,
      };
      if (q.type === 'IDEAL_XI') {
        payload.formation_id = currentFormation;
      }
      return payload;
    })
    .filter((p): p is SubmitCrystalBallAnswersRequest => p !== null);

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
        description="Prediu l'imprevisible — preguntes especials del torneig"
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
            <p className="text-sm font-medium">No s'han pogut carregar les preguntes del Crystal Ball</p>
          </div>
        )}

        {!isLoading && !errorQ && questions.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <Sparkles className="h-8 w-8" />
            <p className="text-sm">Encara no hi ha preguntes disponibles — torna aviat!</p>
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
              formationId={formationIdByQuestion[q.id] ?? IDEAL_XI_DEFAULT_FORMATION_ID}
              savedFormationId={predictionByQuestion[q.id]?.formation_id}
              onFormationIdChange={(formationId) =>
                setFormationIdByQuestion((prev) => ({ ...prev, [q.id]: formationId }))
              }
              teams={teams}
              locked={isLocked}
            />
          ))}
      </div>

      {!isLocked && !isLoading && !errorQ && questions.length > 0 && (
        <CrystalBallSaveBar
          pendingCount={predictionsToSave.length}
          saving={saving}
          saveError={saveError}
          onSave={() => void handleSaveAll()}
        />
      )}
    </div>
  );
}

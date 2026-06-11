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
import { CrystalBallSaveBar } from '@/pages/crystal-ball/components/CrystalBallSaveBar';
import { QuestionCard } from '@/pages/crystal-ball/components/QuestionCard';
import { IDEAL_XI_DEFAULT_FORMATION_ID } from '@/pages/crystal-ball/ideal-xi/ideal-xi.data';
import type {
  AnswerDraft,
  CrystalBallPredictionResponse,
  SubmitCrystalBallAnswersRequest,
} from './crystal-ball.types';
import { draftsEqual, isDraftComplete, savedToDrafts } from './crystal-ball.utils';

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
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['crystal-ball-answers'] });
      const saved = result.saved;
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
      if (result.errors.length > 0) {
        setSaveError(`No s’han pogut guardar ${result.errors.length} predicció(ns). Torna-ho a provar.`);
      } else {
        setSaveError(null);
      }
    },
    onError: () => setSaveError("No s’han pogut guardar les prediccions. Torna-ho a provar."),
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

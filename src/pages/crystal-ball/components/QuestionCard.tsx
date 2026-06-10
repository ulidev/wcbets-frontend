import { CheckCircle2, Lock } from 'lucide-react';
import { IdealXIPitch } from '@/pages/crystal-ball/ideal-xi/IdealXIPitch';
import { IDEAL_XI_DEFAULT_FORMATION_ID } from '@/pages/crystal-ball/ideal-xi/ideal-xi.data';
import type { IdealXIAnswerDraft } from '@/pages/crystal-ball/ideal-xi/types';
import {
  QUESTION_DESCRIPTIONS,
  answerTypeHint,
  draftsEqual,
  isDraftComplete,
  savedToDrafts,
} from '../crystal-ball.utils';
import type {
  AnswerDraft,
  CrystalBallAnswerResponse,
  CrystalBallQuestionResponse,
  TeamResponse,
} from '../crystal-ball.types';
import { PlayerPicker } from './PlayerPicker';
import { TeamPicker } from './TeamPicker';

type QuestionCardProps = {
  question: CrystalBallQuestionResponse;
  drafts: AnswerDraft[];
  onDraftsChange: (drafts: AnswerDraft[]) => void;
  savedAnswers: CrystalBallAnswerResponse[] | undefined;
  formationId: string;
  savedFormationId: string | null | undefined;
  onFormationIdChange: (formationId: string) => void;
  teams: TeamResponse[];
  locked: boolean;
};

export function QuestionCard({
  question,
  drafts,
  onDraftsChange,
  savedAnswers,
  formationId,
  savedFormationId,
  onFormationIdChange,
  teams,
  locked,
}: QuestionCardProps) {
  const isSaved = savedAnswers !== undefined && savedAnswers.length > 0;
  const formationDirty =
    question.type === 'IDEAL_XI' &&
    isSaved &&
    (savedFormationId ?? IDEAL_XI_DEFAULT_FORMATION_ID) !== formationId;
  const isDirty =
    isSaved &&
    (formationDirty || !draftsEqual(drafts, savedToDrafts(savedAnswers)));
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

  const handleRangeChange = (val: string) => {
    onDraftsChange([{ selection_index: 0, range_value: val || undefined }]);
  };

  const rangeVal = question.answer_type === 'NUMBER' ? (drafts[0]?.range_value ?? '') : '';

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
<CheckCircle2 size={20} className="shrink-0 text-wc-green" aria-label="Guardat" />
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
          formationId={formationId}
          onFormationIdChange={onFormationIdChange}
          onDraftsChange={handleIdealXiChange}
          teams={teams}
          locked={locked}
        />
      )}

      {question.answer_type === 'NUMBER' && question.allowed_ranges && question.allowed_ranges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {question.allowed_ranges.map((range) => (
            <button
              key={range}
              type="button"
              disabled={locked}
              onClick={() => handleRangeChange(rangeVal === range ? '' : range)}
              className={`rounded-full border px-3 py-1 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                rangeVal === range
                  ? 'border-wc-hermes bg-wc-hermes text-white'
                  : 'border-wc-light-gray bg-transparent text-wc-card-text hover:border-wc-hermes'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      )}
      {question.answer_type === 'NUMBER' && (!question.allowed_ranges || question.allowed_ranges.length === 0) && (
        <input
          type="text"
          value={rangeVal}
          disabled={locked}
          onChange={(e) => handleRangeChange(e.target.value)}
          placeholder="Introdueix un valor…"
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

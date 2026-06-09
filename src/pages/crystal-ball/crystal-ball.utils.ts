import { isIdealXIComplete } from '@/pages/crystal-ball/ideal-xi/ideal-xi.data';
import type { IdealXIAnswerDraft } from '@/pages/crystal-ball/ideal-xi/types';
import type {
  AnswerDraft,
  CrystalBallAnswerResponse,
  CrystalBallQuestionResponse,
} from './crystal-ball.types';

export const QUESTION_DESCRIPTIONS: Record<string, string> = {
  IDEAL_XI: 'Tria els 11 jugadors que creus que formaran el millor onze del torneig.',
  TOP_4: "Tria els 4 equips que arriben a les semifinals (l'ordre importa).",
  FURTHEST_TEAM_PER_CONTINENT: "Tria l'equip que arriba més lluny de cada confederació.",
};

export function answerTypeHint(answerType: string, maxSelections: number): string {
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

export function savedToDrafts(answers: CrystalBallAnswerResponse[]): AnswerDraft[] {
  return answers.map((a) => ({
    selection_index: a.selection_index,
    player_id: a.player_id ?? undefined,
    team_id: a.team_id ?? undefined,
    range_value: a.range_value ?? undefined,
  }));
}

export function isDraftComplete(
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
    return drafts[0]?.range_value != null;
  }
  return drafts.length === question.max_selections;
}

export function draftsEqual(a: AnswerDraft[], b: AnswerDraft[]): boolean {
  if (a.length !== b.length) return false;
  const key = (d: AnswerDraft) =>
    `${d.selection_index}:${d.team_id ?? ''}:${d.player_id ?? ''}:${d.range_value ?? ''}`;
  const sorted = (list: AnswerDraft[]) =>
    [...list].sort((x, y) => x.selection_index - y.selection_index).map(key);
  return sorted(a).every((k, i) => k === sorted(b)[i]);
}

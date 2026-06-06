import formationsJson from './ideal-xi.formations.json';
import playersJson from './ideal-xi.players.json';
import type { IdealXIAnswerDraft, IdealXIFormation, IdealXILine, IdealXIPlayerCatalogEntry } from './types';

export const IDEAL_XI_MAX_PLAYERS = 11;

export const IDEAL_XI_DEFAULT_FORMATION_ID = formationsJson.defaultFormationId;

export const IDEAL_XI_FORMATIONS = formationsJson.formations as IdealXIFormation[];

export const IDEAL_XI_LINE_LABELS = formationsJson.lines as Record<
  IdealXILine,
  { label: string; short: string }
>;

export const IDEAL_XI_CATALOG_PLAYERS: IdealXIPlayerCatalogEntry[] =
  playersJson.players as IdealXIPlayerCatalogEntry[];

export function getFormationById(id: string): IdealXIFormation | undefined {
  return IDEAL_XI_FORMATIONS.find((f) => f.id === id);
}

export function draftsFromAnswers(
  answers: { selection_index: number; player_id: string | null }[],
): IdealXIAnswerDraft[] {
  return answers
    .filter((a): a is { selection_index: number; player_id: string } => a.player_id != null)
    .map((a) => ({ selection_index: a.selection_index, player_id: a.player_id }));
}

export function answersFromDrafts(drafts: IdealXIAnswerDraft[]) {
  return [...drafts]
    .sort((a, b) => a.selection_index - b.selection_index)
    .map((d) => ({ selection_index: d.selection_index, player_id: d.player_id }));
}

export function isIdealXIComplete(drafts: IdealXIAnswerDraft[]): boolean {
  if (drafts.length !== IDEAL_XI_MAX_PLAYERS) return false;
  const indices = new Set(drafts.map((d) => d.selection_index));
  if (indices.size !== IDEAL_XI_MAX_PLAYERS) return false;
  for (let i = 0; i < IDEAL_XI_MAX_PLAYERS; i++) {
    if (!indices.has(i)) return false;
  }
  return true;
}

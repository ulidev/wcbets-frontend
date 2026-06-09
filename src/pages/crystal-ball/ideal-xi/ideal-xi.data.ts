import formationsJson from './ideal-xi.formations.json';
import playersJson from './ideal-xi.players.json';
import type { IdealXIAnswerDraft, IdealXIFormation, IdealXILine, IdealXIPlayerCatalogEntry, IdealXISlot } from './types';

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

export type IdealXIPitchRow = {
  y: number;
  slots: IdealXISlot[];
};

/** Max slots sharing the exact same y row (for wide-pitch scroll). */
export function getMaxSlotsPerExactRow(slots: IdealXISlot[]): number {
  const byY = new Map<number, number>();
  for (const slot of slots) {
    byY.set(slot.y, (byY.get(slot.y) ?? 0) + 1);
  }
  return Math.max(0, ...byY.values());
}

/** Group slots sharing the same row (y) for even horizontal spacing on the pitch. */
export function groupFormationSlotsByRow(slots: IdealXISlot[]): IdealXIPitchRow[] {
  const byY = new Map<number, IdealXISlot[]>();
  for (const slot of slots) {
    const row = byY.get(slot.y) ?? [];
    row.push(slot);
    byY.set(slot.y, row);
  }
  return [...byY.entries()]
    .sort(([a], [b]) => a - b)
    .map(([y, rowSlots]) => ({
      y,
      slots: rowSlots.sort((a, b) => a.x - b.x),
    }));
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

/** Re-seat drafted players onto a new formation, keeping same-line picks when possible. */
export function remapDraftsForFormation(
  drafts: IdealXIAnswerDraft[],
  newFormation: IdealXIFormation,
  getPlayerLine: (playerId: string) => IdealXILine | undefined,
): IdealXIAnswerDraft[] {
  const availableByLine = new Map<IdealXILine, string[]>();
  const seen = new Set<string>();
  for (const d of drafts) {
    if (seen.has(d.player_id)) continue;
    const line = getPlayerLine(d.player_id);
    if (!line) continue;
    seen.add(d.player_id);
    const pool = availableByLine.get(line) ?? [];
    pool.push(d.player_id);
    availableByLine.set(line, pool);
  }

  const assigned = new Set<string>();
  const result: IdealXIAnswerDraft[] = [];

  for (const slot of [...newFormation.slots].sort(
    (a, b) => a.selectionIndex - b.selectionIndex,
  )) {
    const pool = availableByLine.get(slot.line) ?? [];
    const atSameIndex = drafts.find((d) => d.selection_index === slot.selectionIndex);
    let playerId: string | undefined;

    if (atSameIndex && !assigned.has(atSameIndex.player_id)) {
      const line = getPlayerLine(atSameIndex.player_id);
      if (line === slot.line) {
        playerId = atSameIndex.player_id;
      }
    }

    if (!playerId) {
      playerId = pool.find((id) => !assigned.has(id));
    }

    if (playerId) {
      assigned.add(playerId);
      result.push({ selection_index: slot.selectionIndex, player_id: playerId });
    }
  }

  return result;
}

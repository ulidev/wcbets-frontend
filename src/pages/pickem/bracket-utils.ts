import type { components } from '@/types/api';

export type BracketSlotPickemOverview = components['schemas']['BracketSlotPickemOverview'];
export type TeamInfo = components['schemas']['TeamInfo'];

export const BRACKET_PHASE_ORDER = [
  'ROUND_OF_32',
  'ROUND_OF_16',
  'QUARTER_FINAL',
  'SEMI_FINAL',
  'THIRD_FOURTH_POSITION',
  'FINAL',
] as const;

export type BracketPhase = (typeof BRACKET_PHASE_ORDER)[number];

export const PHASE_LABELS: Record<string, string> = {
  ROUND_OF_32: 'Round of 32',
  ROUND_OF_16: 'Round of 16',
  QUARTER_FINAL: 'Quarter-Finals',
  SEMI_FINAL: 'Semi-Finals',
  THIRD_FOURTH_POSITION: 'Third Place',
  FINAL: 'Final',
};

export const LEFT_TREE_PHASES: BracketPhase[] = [
  'ROUND_OF_32',
  'ROUND_OF_16',
  'QUARTER_FINAL',
  'SEMI_FINAL',
];

export const RIGHT_TREE_PHASES: BracketPhase[] = [
  'SEMI_FINAL',
  'QUARTER_FINAL',
  'ROUND_OF_16',
  'ROUND_OF_32',
];

/** Layout constants shared with BracketTreeView (keep in sync). */
export const BRACKET_COL_W = 148;
export const BRACKET_GAP_W = 36;
export const BRACKET_CENTER_W = 168;
/** Rendered height of a bracket-tree-match (header + 2 team rows + padding). */
export const BRACKET_MATCH_BLOCK_H = 84;
/** @deprecated Use BRACKET_MATCH_BLOCK_H — kept for connector midpoints */
export const BRACKET_MATCH_H = BRACKET_MATCH_BLOCK_H;
/** Vertical gap between stacked match cards in the same round. */
export const BRACKET_MATCH_GAP = 24;
/** Half-distance between adjacent leaf match tops (see matchCenterY). */
export const BRACKET_ROW_UNIT = (BRACKET_MATCH_BLOCK_H + BRACKET_MATCH_GAP) / 2;

/** Matches per side of the tree for each knockout phase (full 48-team draw). */
export const BRACKET_HALF_COUNTS: Record<BracketPhase, number> = {
  ROUND_OF_32: 8,
  ROUND_OF_16: 4,
  QUARTER_FINAL: 2,
  SEMI_FINAL: 1,
  THIRD_FOURTH_POSITION: 0,
  FINAL: 0,
};

export function formatMatchLabel(slotIndex: number): string {
  return `M${slotIndex}`;
}

/** Expected slot_index for a grid cell when the slot is not in the API yet. */
export function expectedSlotIndex(
  phase: BracketPhase,
  side: 'left' | 'right',
  matchIndex: number,
): number {
  const half = BRACKET_HALF_COUNTS[phase];
  const leftStart = 1;
  const rightStart = half + 1;
  return side === 'left' ? leftStart + matchIndex : rightStart + matchIndex;
}

export function slotsByPhaseOrdered(
  slots: BracketSlotPickemOverview[],
): Map<BracketPhase, BracketSlotPickemOverview[]> {
  const map = new Map<BracketPhase, BracketSlotPickemOverview[]>();
  for (const slot of slots) {
    const phase = slot.phase as BracketPhase;
    const list = map.get(phase) ?? [];
    list.push(slot);
    map.set(phase, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.slot_index - b.slot_index);
  }
  return map;
}

/**
 * Fixed grid of slots for one half of the bracket (left = lower slot_index, right = upper).
 * Indices follow backend seed: R32 1–8 / 9–16, R16 1–4 / 5–8, etc.
 */
export function regionSlotGrid(
  phase: BracketPhase,
  phaseSlots: BracketSlotPickemOverview[],
  side: 'left' | 'right',
): (BracketSlotPickemOverview | null)[] {
  const half = BRACKET_HALF_COUNTS[phase];
  if (!half) return [];

  const sorted = [...phaseSlots].sort((a, b) => a.slot_index - b.slot_index);
  const oneBased = sorted.length > 0 && sorted[0].slot_index >= 1;
  const leftStart = oneBased ? 1 : 0;
  const rightStart = oneBased ? half + 1 : half;

  return Array.from({ length: half }, (_, matchIndex) => {
    const target = side === 'left' ? leftStart + matchIndex : rightStart + matchIndex;
    return sorted.find((s) => s.slot_index === target) ?? null;
  });
}

/** Vertical center of match `i` in round `round` (0 = outermost). */
export function matchCenterY(round: number, matchIndex: number, unit = BRACKET_ROW_UNIT): number {
  return ((2 * matchIndex + 1) * 2 ** round - 1) * unit;
}

export function treeSideHeight(matchCount: number, unit = BRACKET_ROW_UNIT): number {
  if (matchCount === 0) return 0;
  return matchCenterY(0, matchCount - 1, unit) + BRACKET_MATCH_BLOCK_H;
}

export function resolveTeam(
  directTeam: TeamInfo | null,
  feedsFromSlotId: string | null,
  bracketPicks: Record<string, string | null>,
  teamById: Map<string, TeamInfo>,
): TeamInfo | null {
  if (directTeam) return directTeam;
  if (!feedsFromSlotId) return null;
  const winnerId = bracketPicks[feedsFromSlotId];
  if (!winnerId) return null;
  return teamById.get(winnerId) ?? null;
}

export function resolveLoserTeam(
  loserFeedsFromSlotId: string | null,
  bracketPicks: Record<string, string | null>,
  allSlots: BracketSlotPickemOverview[],
  teamById: Map<string, TeamInfo>,
): TeamInfo | null {
  if (!loserFeedsFromSlotId) return null;
  const feedSlot = allSlots.find((s) => s.slot_id === loserFeedsFromSlotId);
  if (!feedSlot) return null;
  const winnerId = bracketPicks[loserFeedsFromSlotId];
  if (!winnerId) return null;
  const home = resolveTeam(
    feedSlot.home_team,
    feedSlot.home_feeds_from_slot_id,
    bracketPicks,
    teamById,
  );
  const away = resolveTeam(
    feedSlot.away_team,
    feedSlot.away_feeds_from_slot_id,
    bracketPicks,
    teamById,
  );
  if (home?.id === winnerId) return away;
  if (away?.id === winnerId) return home;
  return null;
}

export function slotFeedLabel(
  slotId: string | null,
  isLoser: boolean,
  allSlots: BracketSlotPickemOverview[],
): string | null {
  if (!slotId) return null;
  const src = allSlots.find((s) => s.slot_id === slotId);
  if (!src) return null;
  return isLoser
    ? `L. ${formatMatchLabel(src.slot_index)}`
    : `W. ${formatMatchLabel(src.slot_index)}`;
}

import type { BracketSlotPickemOverview, TeamInfo } from '../bracket-utils';
import { resolveLoserTeam, resolveTeam } from '../bracket-utils';

export function getTeamsForSlot(
  slot: BracketSlotPickemOverview,
  allSlots: BracketSlotPickemOverview[],
  bracketPicks: Record<string, string | null>,
  teamById: Map<string, TeamInfo>,
) {
  const isThird = slot.phase === 'THIRD_FOURTH_POSITION';
  const home = isThird
    ? resolveLoserTeam(slot.home_loser_feeds_from_slot_id ?? null, bracketPicks, allSlots, teamById)
    : resolveTeam(slot.home_team, slot.home_feeds_from_slot_id, bracketPicks, teamById);
  const away = isThird
    ? resolveLoserTeam(slot.away_loser_feeds_from_slot_id ?? null, bracketPicks, allSlots, teamById)
    : resolveTeam(slot.away_team, slot.away_feeds_from_slot_id, bracketPicks, teamById);
  return { home, away };
}

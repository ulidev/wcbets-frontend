import type { components } from '@/types/api';

type TeamPickemEntry = components['schemas']['TeamPickemEntry'];
type GroupPickemOverview = components['schemas']['GroupPickemOverview'];
type BracketSlotPickemOverview = components['schemas']['BracketSlotPickemOverview'];

export type GroupPickState = {
  group_id: string;
  teams: TeamPickemEntry[];
};

export function areGroupPicksDirty(
  groupPicks: GroupPickState[],
  serverGroups: GroupPickemOverview[],
): boolean {
  for (const local of groupPicks) {
    const server = serverGroups.find((g) => g.group_id === local.group_id);
    if (!server) continue;

    for (let position = 0; position < local.teams.length; position++) {
      const localTeamId = local.teams[position].team_id;
      const serverAtPosition = server.teams.find((t) => t.predicted_position === position + 1);
      if (!serverAtPosition || serverAtPosition.team_id !== localTeamId) {
        return true;
      }
    }
  }
  return false;
}

export function areBracketPicksDirty(
  bracketPicks: Record<string, string | null>,
  slots: BracketSlotPickemOverview[],
): boolean {
  for (const slot of slots) {
    const local = bracketPicks[slot.slot_id] ?? null;
    const server = slot.predicted_winner_team_id ?? null;
    if (local !== server) return true;
  }
  return false;
}

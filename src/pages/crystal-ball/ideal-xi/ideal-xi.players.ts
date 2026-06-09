import type { components } from '@/types/api';
import { IDEAL_XI_CATALOG_PLAYERS } from './ideal-xi.data';
import type { IdealXILine } from './types';

type TeamResponse = components['schemas']['TeamResponse'];
type PlayerResponse = components['schemas']['PlayerResponse'];

export type ResolvedPlayer = {
  id: string;
  name: string;
  teamName: string;
  teamLabel: string;
  position: IdealXILine;
};

export function toLine(position: string): IdealXILine | null {
  if (position === 'GK' || position === 'DEF' || position === 'MID' || position === 'FWD') {
    return position;
  }
  return null;
}

export function buildPlayerPool(
  apiPlayers: PlayerResponse[],
  teams: TeamResponse[],
): ResolvedPlayer[] {
  const teamNameById = new Map(teams.map((t) => [t.id, t.name]));
  const teamLabelById = new Map(teams.map((t) => [t.id, t.label_ca || t.name]));
  const fromApi: ResolvedPlayer[] = [];
  for (const p of apiPlayers) {
    const line = toLine(p.position);
    if (!line) continue;
    fromApi.push({
      id: p.id,
      name: p.name,
      teamName: teamNameById.get(p.team_id) ?? '',
      teamLabel: teamLabelById.get(p.team_id) ?? '',
      position: line,
    });
  }
  const seen = new Set(fromApi.map((p) => p.id));
  for (const p of IDEAL_XI_CATALOG_PLAYERS) {
    if (!seen.has(p.id)) fromApi.push({ ...p, teamLabel: p.teamName });
  }
  return fromApi;
}

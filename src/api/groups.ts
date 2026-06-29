import type { components } from '@/types/api';
import { api } from './client';

type GroupResponse = components['schemas']['GroupResponse'];
type SetGroupFinalStandingsRequest = components['schemas']['SetGroupFinalStandingsRequest'];

export const fetchGroups = (): Promise<GroupResponse[]> =>
  api.get('api/v1/tournament/groups').json<GroupResponse[]>();

export const setGroupFinalStandings = (
  groupId: string,
  body: SetGroupFinalStandingsRequest,
): Promise<void> =>
  api
    .patch(`api/v1/tournament/groups/${groupId}/standings`, { json: body })
    .then(() => undefined);

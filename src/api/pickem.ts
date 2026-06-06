import type { components } from '@/types/api';
import { api } from './client';

type PickemOverviewResponse = components['schemas']['PickemOverviewResponse'];
type GroupStagePredictionResponse = components['schemas']['GroupStagePredictionResponse'];
type BracketPredictionResponse = components['schemas']['BracketPredictionResponse'];
type SubmitGroupStagePickemRequest = components['schemas']['SubmitGroupStagePickemRequest'];
type SubmitBracketPickemRequest = components['schemas']['SubmitBracketPickemRequest'];

export const fetchPickemOverview = (): Promise<PickemOverviewResponse> =>
  api.get('api/v1/picks/overview').json<PickemOverviewResponse>();

export const submitGroupStagePicks = (
  body: SubmitGroupStagePickemRequest,
): Promise<GroupStagePredictionResponse[]> =>
  api.post('api/v1/picks/groups', { json: body }).json<GroupStagePredictionResponse[]>();

export const submitBracketPicks = (
  body: SubmitBracketPickemRequest,
): Promise<BracketPredictionResponse[]> =>
  api.post('api/v1/picks/bracket', { json: body }).json<BracketPredictionResponse[]>();

type GroupStagePredictionPublicResponse = components['schemas']['GroupStagePredictionPublicResponse'];
type BracketPredictionPublicResponse = components['schemas']['BracketPredictionPublicResponse'];
type GroupResponse = components['schemas']['GroupResponse'];

export const fetchUserGroupPickem = (userId: string): Promise<GroupStagePredictionPublicResponse[]> =>
  api.get(`api/v1/picks/groups/users/${userId}`).json<GroupStagePredictionPublicResponse[]>();

export const fetchUserBracketPickem = (userId: string): Promise<BracketPredictionPublicResponse[]> =>
  api.get(`api/v1/picks/bracket/users/${userId}`).json<BracketPredictionPublicResponse[]>();

export const fetchGroups = (): Promise<GroupResponse[]> =>
  api.get('api/v1/tournament/groups').json<GroupResponse[]>();

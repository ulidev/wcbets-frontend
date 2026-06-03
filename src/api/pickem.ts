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

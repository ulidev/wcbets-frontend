import type { components } from '@/types/api';
import { api } from './client';

type CrystalBallQuestionResponse = components['schemas']['CrystalBallQuestionResponse'];
type CrystalBallPredictionResponse = components['schemas']['CrystalBallPredictionResponse'];
type SubmitCrystalBallBatchRequest = components['schemas']['SubmitCrystalBallBatchRequest'];
type SubmitCrystalBallBatchResult = components['schemas']['SubmitCrystalBallBatchResult'];
type TeamResponse = components['schemas']['TeamResponse'];
type PlayerResponse = components['schemas']['PlayerResponse'];
type DeadlineConfigResponse = components['schemas']['DeadlineConfigResponse'];

export const fetchCrystalBallQuestions = (): Promise<CrystalBallQuestionResponse[]> =>
  api.get('api/v1/crystal-ball/questions').json<CrystalBallQuestionResponse[]>();

export const fetchMyAnswers = (): Promise<CrystalBallPredictionResponse[]> =>
  api.get('api/v1/crystal-ball/answers').json<CrystalBallPredictionResponse[]>();

export const submitAnswers = (body: SubmitCrystalBallBatchRequest): Promise<SubmitCrystalBallBatchResult> =>
  api.post('api/v1/crystal-ball/answers', { json: body }).json<SubmitCrystalBallBatchResult>();

export const fetchTeams = (params?: {
  confederation?: string;
  continent?: string;
}): Promise<TeamResponse[]> =>
  api
    .get('api/v1/tournament/teams', {
      searchParams: (params as Record<string, string>) ?? {},
    })
    .json<TeamResponse[]>();

export const fetchPlayers = (params: {
  search?: string;
  team_id?: string;
}): Promise<PlayerResponse[]> =>
  api
    .get('api/v1/tournament/players', { searchParams: params as Record<string, string> })
    .json<PlayerResponse[]>();

export const fetchDeadlines = (): Promise<DeadlineConfigResponse[]> =>
  api.get('api/v1/config/deadlines').json<DeadlineConfigResponse[]>();

type CrystalBallPredictionPublicResponse = components['schemas']['CrystalBallPredictionPublicResponse'];

export const fetchUserCrystalBallAnswers = (userId: string): Promise<CrystalBallPredictionPublicResponse[]> =>
  api.get(`api/v1/crystal-ball/answers/users/${userId}`).json<CrystalBallPredictionPublicResponse[]>();

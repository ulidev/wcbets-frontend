import type { components } from '@/types/api';
import { api } from './client';

type MatchResponse = components['schemas']['MatchResponse'];
type TeamResponse = components['schemas']['TeamResponse'];
type RoundResponse = components['schemas']['RoundResponse'];
type MatchPredictionResponse = components['schemas']['MatchPredictionResponse'];
type CreateMatchPredictionRequest = components['schemas']['CreateMatchPredictionRequest'];
type UpdateMatchPredictionRequest = components['schemas']['UpdateMatchPredictionRequest'];

export const fetchMatches = (): Promise<MatchResponse[]> =>
  api.get('api/v1/tournament/matches').json<MatchResponse[]>();

export const fetchTeams = (): Promise<TeamResponse[]> =>
  api.get('api/v1/tournament/teams').json<TeamResponse[]>();

export const fetchRounds = (): Promise<RoundResponse[]> =>
  api.get('api/v1/tournament/rounds').json<RoundResponse[]>();

export const fetchMyPredictions = (): Promise<MatchPredictionResponse[]> =>
  api.get('api/v1/predictions/matches').json<MatchPredictionResponse[]>();

export const createMatchPrediction = (
  body: CreateMatchPredictionRequest,
): Promise<MatchPredictionResponse> =>
  api.post('api/v1/predictions/matches', { json: body }).json<MatchPredictionResponse>();

export const updateMatchPrediction = (
  matchId: string,
  body: UpdateMatchPredictionRequest,
): Promise<MatchPredictionResponse> =>
  api
    .put(`api/v1/predictions/matches/${matchId}`, { json: body })
    .json<MatchPredictionResponse>();

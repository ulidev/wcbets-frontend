import type { components } from '@/types/api';
import { api } from './client';

type MatchResponse = components['schemas']['MatchResponse'];
type TeamResponse = components['schemas']['TeamResponse'];
type RoundResponse = components['schemas']['RoundResponse'];
type MatchPredictionResponse = components['schemas']['MatchPredictionResponse'];
type MatchPlayersResponse = components['schemas']['MatchPlayersResponse'];
type CreateMatchPredictionRequest = components['schemas']['CreateMatchPredictionRequest'];
type UpdateMatchPredictionRequest = components['schemas']['UpdateMatchPredictionRequest'];
type SetMatchResultRequest = components['schemas']['SetMatchResultRequest'];
type UpdateMatchStatusRequest = components['schemas']['UpdateMatchStatusRequest'];

export const fetchMatches = (): Promise<MatchResponse[]> =>
  api.get('api/v1/tournament/matches').json<MatchResponse[]>();

export const fetchTeams = (): Promise<TeamResponse[]> =>
  api.get('api/v1/tournament/teams').json<TeamResponse[]>();

export const fetchRounds = (): Promise<RoundResponse[]> =>
  api.get('api/v1/tournament/rounds').json<RoundResponse[]>();

export const fetchMyPredictions = (): Promise<MatchPredictionResponse[]> =>
  api.get('api/v1/predictions/matches').json<MatchPredictionResponse[]>();

export const fetchUserMatchPredictions = (userId: string): Promise<MatchPredictionResponse[]> =>
  api.get(`api/v1/predictions/matches/users/${userId}`).json<MatchPredictionResponse[]>();

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

export const fetchMatchPlayers = (matchId: string): Promise<MatchPlayersResponse> =>
  api.get(`api/v1/tournament/matches/${matchId}/players`).json<MatchPlayersResponse>();

export const overrideMatchResult = (matchId: string, body: SetMatchResultRequest): Promise<void> =>
  api.patch(`api/v1/tournament/matches/${matchId}/result/override`, { json: body }).then(() => undefined);

export const updateMatchStatus = (matchId: string, body: UpdateMatchStatusRequest): Promise<void> =>
  api.patch(`api/v1/tournament/matches/${matchId}/status`, { json: body }).then(() => undefined);

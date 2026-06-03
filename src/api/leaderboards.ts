import type { components } from '@/types/api';
import { api } from './client';

type LeaderboardResponse = components['schemas']['LeaderboardResponse'];

export const fetchMatchPredictionLeaderboard = (): Promise<LeaderboardResponse> =>
  api.get('api/v1/leaderboards/match-prediction').json<LeaderboardResponse>();

export const fetchPickemLeaderboard = (): Promise<LeaderboardResponse> =>
  api.get('api/v1/leaderboards/pickem').json<LeaderboardResponse>();

export const fetchCrystalBallLeaderboard = (): Promise<LeaderboardResponse> =>
  api.get('api/v1/leaderboards/crystal-ball').json<LeaderboardResponse>();

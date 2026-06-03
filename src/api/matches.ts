import type { components } from '@/types/api';
import { api } from './client';

type MatchResponse = components['schemas']['MatchResponse'];
type TeamResponse = components['schemas']['TeamResponse'];
type RoundResponse = components['schemas']['RoundResponse'];

export const fetchMatches = (): Promise<MatchResponse[]> =>
  api.get('api/v1/tournament/matches').json<MatchResponse[]>();

export const fetchTeams = (): Promise<TeamResponse[]> =>
  api.get('api/v1/tournament/teams').json<TeamResponse[]>();

export const fetchRounds = (): Promise<RoundResponse[]> =>
  api.get('api/v1/tournament/rounds').json<RoundResponse[]>();

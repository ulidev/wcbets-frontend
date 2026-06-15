import { api } from './client';
import type { components } from '@/types/api';

type RecalculateAllRequest = components['schemas']['RecalculateAllRequest'];
type RecalculateAllResponse = components['schemas']['RecalculateAllResponse'];

export function recalculateAll(body: RecalculateAllRequest): Promise<RecalculateAllResponse> {
  return api.post('api/v1/config/scoring/recalculate-all', { json: body }).json();
}

import type { QueryClient } from '@tanstack/react-query';
import type { components } from '@/types/api';

type MatchPrediction = components['schemas']['MatchPredictionResponse'];

export function upsertMyMatchPrediction(queryClient: QueryClient, saved: MatchPrediction) {
  queryClient.setQueryData<MatchPrediction[]>(['my-predictions'], (old) => {
    const list = old ?? [];
    const idx = list.findIndex((p) => p.match_id === saved.match_id);
    if (idx >= 0) {
      const next = [...list];
      next[idx] = saved;
      return next;
    }
    return [...list, saved];
  });
}

import { useCallback, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPlayers } from '@/api/crystal-ball';

export function usePlayerSearch() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onChange = useCallback((val: string) => {
    setQuery(val);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebouncedQuery(val), 350);
  }, []);

  const { data: players = [], isFetching } = useQuery({
    queryKey: ['players-search', debouncedQuery],
    queryFn: () => fetchPlayers({ search: debouncedQuery }),
    enabled: debouncedQuery.length >= 2,
    staleTime: 60_000,
  });

  return { query, onChange, players, isFetching };
}

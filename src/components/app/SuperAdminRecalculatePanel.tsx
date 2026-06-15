import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { recalculateAll } from '@/api/scoring';
import { cn } from '@/lib/utils';
import type { components } from '@/types/api';

type Competition = components['schemas']['Competition'];

const ALL_COMPETITIONS: Competition[] = ['match_predictions', 'group_stage', 'bracket', 'crystal_ball'];

const COMPETITION_LABELS: Record<Competition, string> = {
  match_predictions: 'Matches',
  group_stage: 'Pickem - Group Stage',
  bracket: 'Pickem - Bracket',
  crystal_ball: 'Crystal Ball',
};

export function SuperAdminRecalculatePanel() {
  const [selected, setSelected] = useState<Set<Competition>>(new Set(ALL_COMPETITIONS));
  const [result, setResult] = useState<components['schemas']['RecalculateAllResponse'] | null>(null);

  const mutation = useMutation({
    mutationFn: () => recalculateAll({ competitions: [...selected] }),
    onSuccess: (data) => setResult(data),
    onError: () => setResult(null),
  });

  function toggle(c: Competition) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
    setResult(null);
  }

  return (
    <section className="w-full">
      <div className="mb-3 flex items-center gap-2">
        <RefreshCw className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-wc-card-text">Recalcular puntuacions</h3>
      </div>

      <div className="overflow-hidden rounded-[18px] border border-wc-light-gray bg-white shadow-sm">
        <div className="divide-y divide-wc-light-gray">
          {ALL_COMPETITIONS.map((c) => {
            const checked = selected.has(c);
            return (
              <label
                key={c}
                className={cn(
                  'flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors select-none',
                  checked ? 'bg-primary/5' : 'hover:bg-muted/30',
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(c)}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-sm font-medium text-wc-card-text">
                  {COMPETITION_LABELS[c]}
                </span>
                {result && (
                  <span className="ml-auto text-xs font-semibold text-green-600">
                    {result[c]} recalculats
                  </span>
                )}
              </label>
            );
          })}
        </div>

        <div className="border-t border-wc-light-gray px-4 py-3">
          {mutation.isError && (
            <p className="mb-2 text-xs text-destructive">Error en recalcular. Torna-ho a provar.</p>
          )}
          {result && !mutation.isPending && (
            <p className="mb-2 text-xs text-green-600">Recàlcul completat correctament.</p>
          )}
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={selected.size === 0 || mutation.isPending}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors',
              'bg-primary text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            <RefreshCw className={cn('h-4 w-4', mutation.isPending && 'animate-spin')} />
            {mutation.isPending ? 'Recalculant…' : 'Recalcular seleccionats'}
          </button>
        </div>
      </div>
    </section>
  );
}

import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ChevronRight } from 'lucide-react';
import {
  fetchMatchPredictionLeaderboard,
  fetchPickemLeaderboard,
  fetchCrystalBallLeaderboard,
} from '@/api/leaderboards';
import { fetchDeadlines } from '@/api/crystal-ball';
import { deadlineHasPassed } from '@/lib/deadlines';
import type { components } from '@/types/api';
import { useAuth } from '@/hooks/useAuth';
import { cn, getInitials, getAvatarColor } from '@/lib/utils';
import { PageChrome } from '@/components/app/PageChrome';

type LeaderboardEntry = components['schemas']['LeaderboardEntryResponse'];

type Tab = 'match' | 'pickem' | 'crystal-ball';

const tabs: { key: Tab; label: string }[] = [
  { key: 'match', label: 'Predicció de partits' },
  { key: 'pickem', label: "Pick'em" },
  { key: 'crystal-ball', label: 'Crystal Ball' },
];

function parseTab(value: string | null): Tab {
  if (value === 'match' || value === 'pickem' || value === 'crystal-ball') return value;
  return 'match';
}

function addRanks(entries: LeaderboardEntry[]) {
  let rank = 1;
  return entries.map((entry, i, arr) => {
    if (i > 0 && entry.points < arr[i - 1].points) rank = i + 1;
    return { ...entry, rank };
  });
}

const MEDAL_STYLES: Record<number, string> = {
  1: 'text-amber-400 font-bold',
  2: 'text-slate-400 font-bold',
  3: 'text-orange-500 font-bold',
};

function EntryRow({
  entry,
  rank,
  isCurrentUser,
  clickable,
  game,
}: {
  entry: LeaderboardEntry;
  rank: number;
  isCurrentUser: boolean;
  clickable: boolean;
  game: Tab;
}) {
  const content = (
    <>
      <div className="w-7 shrink-0 text-center">
        <span className={cn('text-sm', MEDAL_STYLES[rank] ?? 'text-muted-foreground')}>
          {rank}
        </span>
      </div>

      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white',
          getAvatarColor(entry.user_id),
        )}
      >
        {getInitials(entry.first_name, entry.last_name)}
      </div>

      <div className="min-w-0 flex-1 flex items-center gap-2">
        <span className="wc-font-body truncate text-sm uppercase">
          {entry.first_name} {entry.last_name}
        </span>
        {isCurrentUser && (
          <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
            Tu
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 text-right">
        <span className="text-sm font-bold tabular-nums">{entry.points}</span>
        <span className="text-xs text-muted-foreground">pts</span>
        {clickable && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </div>
    </>
  );

  const className = cn(
    'flex items-center gap-4 border-b border-border px-4 py-3 transition-colors last:border-b-0',
    isCurrentUser ? 'bg-primary/5' : 'hover:bg-muted/40',
    clickable && 'cursor-pointer',
  );

  if (!clickable || game === 'match') {
    return <div className={className}>{content}</div>;
  }

  const gameParam = game === 'crystal-ball' ? 'crystal-ball' : 'pickem';

  return (
    <Link
      to={`/leaderboard/user/${entry.user_id}?game=${gameParam}`}
      state={{
        firstName: entry.first_name,
        lastName: entry.last_name,
        points: entry.points,
      }}
      className={cn(className, 'w-full text-inherit no-underline')}
    >
      {content}
    </Link>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-b-0">
          <div className="h-4 w-7 animate-pulse rounded bg-muted/60" />
          <div className="h-9 w-9 animate-pulse rounded-full bg-muted/60" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 animate-pulse rounded bg-muted/60" />
          </div>
          <div className="h-4 w-12 animate-pulse rounded bg-muted/60" />
        </div>
      ))}
    </>
  );
}

export default function LeaderboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = parseTab(searchParams.get('tab'));
  const { user } = useAuth();

  function handleTabChange(tab: Tab) {
    setSearchParams({ tab }, { replace: true });
  }

  const queryFn = {
    match: fetchMatchPredictionLeaderboard,
    pickem: fetchPickemLeaderboard,
    'crystal-ball': fetchCrystalBallLeaderboard,
  }[activeTab];

  const { data, isLoading, isError } = useQuery({
    queryKey: ['leaderboard', activeTab],
    queryFn,
  });

  const { data: deadlines = [] } = useQuery({
    queryKey: ['deadlines'],
    queryFn: fetchDeadlines,
  });

  const ranked = data ? addRanks(data.entries) : [];
  const canViewPredictions = data?.can_view_predictions ?? false;

  const deadlineUnlocked =
    activeTab === 'pickem'
      ? deadlineHasPassed(deadlines, 'GROUP_STAGE') || deadlineHasPassed(deadlines, 'BRACKET')
      : activeTab === 'crystal-ball'
        ? deadlineHasPassed(deadlines, 'CRYSTAL_BALL')
        : false;

  const rowsClickable = canViewPredictions || deadlineUnlocked;

  return (
    <div className="flex flex-col">
      <PageChrome<Tab>
        title="Classificació"
        description="Rànquings dels tres jocs de predicció"
        tabs={tabs.map(({ key, label }) => ({ id: key, label }))}
        active={activeTab}
        onChange={handleTabChange}
      />

      <div className="p-4">
        {rowsClickable && activeTab !== 'match' && (
          <p className="mb-3 text-xs text-muted-foreground">
            Toca un jugador per veure les seves prediccions.
          </p>
        )}

        {isLoading && (
          <div className="overflow-hidden rounded-xl border border-border bg-card overflow-hidden">
            <SkeletonRows />
          </div>
        )}

        {isError && (
          <div className="overflow-hidden rounded-xl border border-border bg-card flex flex-col items-center gap-2 px-4 py-16 text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8" />
            <p className="text-sm font-medium">No s'ha pogut carregar la classificació</p>
            <p className="text-xs">Comprova la connexió i torna-ho a provar.</p>
          </div>
        )}

        {!isLoading && !isError && ranked.length === 0 && (
          <div className="overflow-hidden rounded-xl border border-border bg-card px-4 py-16 text-center text-sm text-muted-foreground">
            Encara no hi ha puntuacions — sigues el primer en predir!
          </div>
        )}

        {!isLoading && !isError && ranked.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-border bg-card overflow-hidden">
            {ranked.map((entry) => (
              <EntryRow
                key={entry.user_id}
                entry={entry}
                rank={entry.rank}
                isCurrentUser={user?.id === entry.user_id}
                clickable={rowsClickable}
                game={activeTab}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

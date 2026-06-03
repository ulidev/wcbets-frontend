import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import {
  fetchMatchPredictionLeaderboard,
  fetchPickemLeaderboard,
  fetchCrystalBallLeaderboard,
} from '@/api/leaderboards';
import type { components } from '@/types/api';
import { useAuth } from '@/hooks/useAuth';
import { cn, getInitials, getAvatarColor } from '@/lib/utils';

type LeaderboardEntry = components['schemas']['LeaderboardEntryResponse'];

type Tab = 'match' | 'pickem' | 'crystal-ball';

const tabs: { key: Tab; label: string }[] = [
  { key: 'match', label: 'Match Prediction' },
  { key: 'pickem', label: "Pick'em" },
  { key: 'crystal-ball', label: 'Crystal Ball' },
];

function addRanks(entries: LeaderboardEntry[]) {
  let rank = 1;
  return entries.map((entry, i, arr) => {
    if (i > 0 && entry.points < arr[i - 1].points) rank = i + 1;
    return { ...entry, rank };
  });
}

const MEDAL_STYLES: Record<number, string> = {
  1: 'text-yellow-400 font-bold',
  2: 'text-slate-300 font-bold',
  3: 'text-amber-500 font-bold',
};

function EntryRow({
  entry,
  rank,
  isCurrentUser,
}: {
  entry: LeaderboardEntry;
  rank: number;
  isCurrentUser: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 border-b border-border px-4 py-3 transition-colors',
        isCurrentUser ? 'bg-primary/5' : 'hover:bg-muted/30',
      )}
    >
      {/* Rank */}
      <div className="w-7 shrink-0 text-center">
        <span className={cn('text-sm', MEDAL_STYLES[rank] ?? 'text-muted-foreground')}>
          {rank}
        </span>
      </div>

      {/* Avatar */}
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white',
          getAvatarColor(entry.user_id),
        )}
      >
        {getInitials(entry.first_name, entry.last_name)}
      </div>

      {/* Name */}
      <div className="min-w-0 flex-1">
        <span className="truncate text-sm font-medium">
          {entry.first_name} {entry.last_name}
        </span>
        {isCurrentUser && (
          <span className="ml-2 inline-block rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
            You
          </span>
        )}
      </div>

      {/* Points */}
      <div className="shrink-0 text-right">
        <span className="text-sm font-bold tabular-nums">{entry.points}</span>
        <span className="ml-1 text-xs text-muted-foreground">pts</span>
      </div>
    </div>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-border px-4 py-3">
          <div className="h-4 w-7 animate-pulse rounded bg-muted" />
          <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-4 w-12 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </>
  );
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('match');
  const { user } = useAuth();

  const queryFn = {
    match: fetchMatchPredictionLeaderboard,
    pickem: fetchPickemLeaderboard,
    'crystal-ball': fetchCrystalBallLeaderboard,
  }[activeTab];

  const { data, isLoading, isError } = useQuery({
    queryKey: ['leaderboard', activeTab],
    queryFn,
  });

  const ranked = data ? addRanks(data.entries) : [];

  return (
    <div className="flex flex-col">
      {/* Desktop page header */}
      <div className="hidden border-b border-border px-6 py-5 md:block">
        <h1 className="text-xl font-bold">Leaderboard</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Rankings across all three prediction games
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border bg-background px-4 py-2">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
              activeTab === key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex flex-col">
        {isLoading && <SkeletonRows />}

        {isError && (
          <div className="flex flex-col items-center gap-2 px-4 py-16 text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8" />
            <p className="text-sm font-medium">Failed to load leaderboard</p>
            <p className="text-xs">Check your connection and try again.</p>
          </div>
        )}

        {!isLoading && !isError && ranked.length === 0 && (
          <div className="px-4 py-16 text-center text-sm text-muted-foreground">
            No scores yet — be the first to predict!
          </div>
        )}

        {!isLoading &&
          !isError &&
          ranked.map((entry) => (
            <EntryRow
              key={entry.user_id}
              entry={entry}
              rank={entry.rank}
              isCurrentUser={user?.id === entry.user_id}
            />
          ))}
      </div>
    </div>
  );
}

import { CheckCircle2, Trophy, XCircle } from 'lucide-react';
import type { CSSProperties } from 'react';
import { TeamFlag } from '@/components/app/TeamFlag';
import { cn } from '@/lib/utils';
import { wcFontBody } from '@/lib/wc-ui';
import {
  type BracketSlotPickemOverview,
  type TeamInfo,
  formatMatchLabel,
  slotFeedLabel,
} from '../bracket-utils';
import { getTeamsForSlot } from './slot-teams';

type TreeMatchNodeProps = {
  slot: BracketSlotPickemOverview;
  allSlots: BracketSlotPickemOverview[];
  bracketPicks: Record<string, string | null>;
  teamById: Map<string, TeamInfo>;
  editable: boolean;
  onChange: (teamId: string | null) => void;
  style?: CSSProperties;
};

export function TreeMatchPlaceholder({ label, style }: { label: string; style?: CSSProperties }) {
  return (
    <div className="bracket-tree-match bracket-tree-match--placeholder" style={style}>
      <span className="mb-1 block px-0.5 text-[10px] font-medium text-wc-dark-gray/50">{label}</span>
      <div className="bracket-tree-team bracket-tree-team--tbd pointer-events-none">TBD</div>
      <div className="bracket-tree-team bracket-tree-team--tbd pointer-events-none">TBD</div>
    </div>
  );
}

export function TreeMatchNode({
  slot,
  allSlots,
  bracketPicks,
  teamById,
  editable,
  onChange,
  style,
}: TreeMatchNodeProps) {
  const { home, away } = getTeamsForSlot(slot, allSlots, bracketPicks, teamById);
  const selectedId = bracketPicks[slot.slot_id] ?? null;
  const isFinished = slot.actual_winner_team_id != null;
  const actualWinnerId = slot.actual_winner_team_id ?? null;
  const isCorrect = isFinished && selectedId !== null && selectedId === actualWinnerId;
  const isWrong = isFinished && selectedId !== null && selectedId !== actualWinnerId;

  function TeamRow({
    team,
    feedsFrom,
    loserFeedsFrom,
  }: {
    team: TeamInfo | null;
    feedsFrom: string | null;
    loserFeedsFrom: string | null;
  }) {
    const tbd = !team;
    const isSelected = !tbd && selectedId === team.id;
    const isActualWinner = !tbd && isFinished && team.id === actualWinnerId;
    const canPick = editable && !tbd;

    const placeholder =
      slotFeedLabel(loserFeedsFrom, true, allSlots) ??
      slotFeedLabel(feedsFrom, false, allSlots) ??
      'TBD';
    const label = tbd ? placeholder : team.name;

    return (
      <button
        type="button"
        onClick={() => {
          if (!canPick) return;
          onChange(isSelected ? null : team.id);
        }}
        disabled={!canPick}
        className={cn(
          'bracket-tree-team',
          tbd && 'bracket-tree-team--tbd',
          !isFinished && isSelected && 'bracket-tree-team--selected',
          isFinished && isActualWinner && 'bracket-tree-team--winner',
          isFinished && !isActualWinner && isSelected && 'bracket-tree-team--wrong',
        )}
      >
        {!tbd && <TeamFlag teamName={team.name} size="sm" />}
        <span className={cn('min-w-0 flex-1 truncate text-left', wcFontBody)}>{label}</span>
        {isActualWinner && <Trophy className="h-3 w-3 shrink-0 text-amber-500" />}
      </button>
    );
  }

  return (
    <div className="bracket-tree-match" style={style}>
      <div className="mb-1 flex items-center justify-between gap-1 px-0.5">
        <span className="text-[10px] font-medium text-wc-dark-gray">
          {formatMatchLabel(slot.slot_index)}
        </span>
        {isCorrect && (
          <span className="flex items-center gap-0.5 text-[10px] text-wc-green">
            <CheckCircle2 className="h-3 w-3" />
            {slot.points_awarded != null && slot.points_awarded > 0 ? `+${slot.points_awarded}` : '✓'}
          </span>
        )}
        {isWrong && (
          <span className="flex items-center gap-0.5 text-[10px] text-wc-red">
            <XCircle className="h-3 w-3" />0
          </span>
        )}
      </div>
      <TeamRow
        team={home}
        feedsFrom={slot.home_feeds_from_slot_id}
        loserFeedsFrom={slot.home_loser_feeds_from_slot_id ?? null}
      />
      <TeamRow
        team={away}
        feedsFrom={slot.away_feeds_from_slot_id}
        loserFeedsFrom={slot.away_loser_feeds_from_slot_id ?? null}
      />
    </div>
  );
}

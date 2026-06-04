import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertCircle, CheckCircle2, GripVertical, Info, Lock, Trophy, XCircle } from 'lucide-react';
import { fetchPickemOverview, submitGroupStagePicks, submitBracketPicks } from '@/api/pickem';
import { cn } from '@/lib/utils';
import { TeamFlag } from '@/components/app/TeamFlag';
import type { components } from '@/types/api';

type TeamPickemEntry = components['schemas']['TeamPickemEntry'];
type BracketSlotPickemOverview = components['schemas']['BracketSlotPickemOverview'];
type TeamInfo = components['schemas']['TeamInfo'];
type GroupPickemOverview = components['schemas']['GroupPickemOverview'];

const BRACKET_PHASE_ORDER = [
  'ROUND_OF_32',
  'ROUND_OF_16',
  'QUARTER_FINAL',
  'SEMI_FINAL',
  'THIRD_FOURTH_POSITION',
  'FINAL',
] as const;

const PHASE_LABELS: Record<string, string> = {
  ROUND_OF_32: 'Round of 32',
  ROUND_OF_16: 'Round of 16',
  QUARTER_FINAL: 'Quarter-Finals',
  SEMI_FINAL: 'Semi-Finals',
  THIRD_FOURTH_POSITION: 'Third Place Play-off',
  FINAL: 'Final',
};

// ── Group Stage — score summary ───────────────────────────────────────────────

function GroupStageScoreSummary({ groups }: { groups: GroupPickemOverview[] }) {
  const scoredGroups = groups.filter((g) => g.points_awarded != null);
  if (scoredGroups.length === 0) return null;

  const totalPoints = scoredGroups.reduce((sum, g) => sum + (g.points_awarded ?? 0), 0);
  const { correct, scored } = groups.reduce(
    (acc, g) => {
      for (const t of g.teams) {
        if (t.actual_position != null) {
          acc.scored++;
          if (t.actual_position === t.predicted_position) acc.correct++;
        }
      }
      return acc;
    },
    { correct: 0, scored: 0 },
  );

  return (
    <div className="mx-4 mt-4 overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex divide-x divide-border/60">
        <div className="flex flex-1 flex-col gap-0.5 px-4 py-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Points
          </span>
          <span className="text-2xl font-black tabular-nums text-primary">{totalPoints}</span>
        </div>
        <div className="flex flex-1 flex-col gap-0.5 px-4 py-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Correct
          </span>
          <span className="text-2xl font-black tabular-nums text-foreground">
            {correct}
            <span className="text-sm font-medium text-muted-foreground">/{scored}</span>
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-0.5 px-4 py-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Groups
          </span>
          <span className="text-2xl font-black tabular-nums text-foreground">
            {scoredGroups.length}
            <span className="text-sm font-medium text-muted-foreground">/{groups.length}</span>
          </span>
        </div>
      </div>
      <div className="h-1 bg-muted/50">
        <div
          className="h-full bg-primary transition-all duration-700"
          style={{ width: `${(scoredGroups.length / groups.length) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ── Group Stage — sortable row ────────────────────────────────────────────────

function SortableTeamRow({
  team,
  position,
  disabled,
}: {
  team: TeamPickemEntry;
  position: number;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: team.team_id,
    disabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : undefined,
  };

  const hasResult = team.actual_position != null;
  const isCorrect = hasResult && team.actual_position === position;
  const isWrong = hasResult && team.actual_position !== position;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2.5 bg-card px-3 py-2.5 select-none',
        isDragging && 'opacity-50 shadow-lg rounded-md',
        isCorrect && 'bg-green-500/10',
      )}
    >
      {/* Position */}
      <span
        className={cn(
          'w-5 shrink-0 text-center text-xs font-bold tabular-nums',
          !hasResult && 'text-muted-foreground',
          isCorrect && 'text-green-500',
          isWrong && 'text-muted-foreground/30',
        )}
      >
        {position}
      </span>

      {/* Flag */}
      <TeamFlag teamName={team.name} size="md" />

      {/* Name */}
      <span
        className={cn(
          'flex-1 truncate text-sm font-medium',
          isWrong && 'text-muted-foreground/70',
        )}
      >
        {team.name}
      </span>

      {/* Right: result feedback or drag handle */}
      {hasResult ? (
        isCorrect ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
        ) : (
          <span className="flex shrink-0 items-center gap-1 text-xs tabular-nums">
            <span className="text-muted-foreground/40 line-through">#{position}</span>
            <span className="font-bold text-muted-foreground">→ #{team.actual_position}</span>
          </span>
        )
      ) : !disabled ? (
        <button
          {...attributes}
          {...listeners}
          className="touch-none cursor-grab p-1 text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
          aria-label={`Drag to reorder ${team.name}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

// ── Group Stage — card ────────────────────────────────────────────────────────

const GROUP_HEADER_COLORS = [
  '#3CAC3B', '#E61D25', '#F58220', '#2A398D',
  '#7B2D8E', '#9ACD32', '#E91E8C', '#00ACC1',
  '#AB47BC', '#00897B', '#FF5722', '#29B6F6',
] as const;

type GroupState = { group_id: string; name: string; teams: TeamPickemEntry[] };

function GroupCard({
  group,
  editable,
  color,
  pointsAwarded,
  onChange,
}: {
  group: GroupState;
  editable: boolean;
  color: string;
  pointsAwarded?: number | null;
  onChange: (teams: TeamPickemEntry[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const scoredCount = group.teams.filter((t) => t.actual_position != null).length;
  const correctCount = group.teams.filter(
    (t) => t.actual_position != null && t.actual_position === t.predicted_position,
  ).length;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = group.teams.findIndex((t) => t.team_id === active.id);
      const newIndex = group.teams.findIndex((t) => t.team_id === over.id);
      onChange(arrayMove(group.teams, oldIndex, newIndex));
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div
        className="flex items-center justify-between px-3 py-2.5"
        style={{ backgroundColor: color }}
      >
        <h3 className="text-sm font-black uppercase tracking-widest text-white">
          {group.name}
        </h3>
        <div className="flex items-center gap-2">
          {scoredCount > 0 && (
            <span className="text-xs text-white/70">
              {correctCount}/{scoredCount}✓
            </span>
          )}
          {pointsAwarded != null && (
            <span className="rounded-full bg-black/25 px-2 py-0.5 text-xs font-bold tabular-nums text-white">
              +{pointsAwarded} pts
            </span>
          )}
        </div>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={group.teams.map((t) => t.team_id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="divide-y divide-border">
            {group.teams.map((team, idx) => (
              <SortableTeamRow
                key={team.team_id}
                team={team}
                position={idx + 1}
                disabled={!editable}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

// ── Bracket ───────────────────────────────────────────────────────────────────

function resolveTeam(
  directTeam: TeamInfo | null,
  feedsFromSlotId: string | null,
  bracketPicks: Record<string, string | null>,
  teamById: Map<string, TeamInfo>,
): TeamInfo | null {
  if (directTeam) return directTeam;
  if (!feedsFromSlotId) return null;
  const winnerId = bracketPicks[feedsFromSlotId];
  if (!winnerId) return null;
  return teamById.get(winnerId) ?? null;
}

// For THIRD_FOURTH_POSITION: teams are the losers of the semi-finals.
// Follow loserFeedsFromSlotId → find which team the user did NOT pick as winner.
function resolveLoserTeam(
  loserFeedsFromSlotId: string | null,
  bracketPicks: Record<string, string | null>,
  allSlots: BracketSlotPickemOverview[],
  teamById: Map<string, TeamInfo>,
): TeamInfo | null {
  if (!loserFeedsFromSlotId) return null;
  const feedSlot = allSlots.find((s) => s.slot_id === loserFeedsFromSlotId);
  if (!feedSlot) return null;
  const winnerId = bracketPicks[loserFeedsFromSlotId];
  if (!winnerId) return null;
  const home = resolveTeam(feedSlot.home_team, feedSlot.home_feeds_from_slot_id, bracketPicks, teamById);
  const away = resolveTeam(feedSlot.away_team, feedSlot.away_feeds_from_slot_id, bracketPicks, teamById);
  if (home?.id === winnerId) return away;
  if (away?.id === winnerId) return home;
  return null;
}

function BracketMatchCard({
  slot,
  allSlots,
  teamById,
  bracketPicks,
  editable,
  onChange,
}: {
  slot: BracketSlotPickemOverview;
  allSlots: BracketSlotPickemOverview[];
  teamById: Map<string, TeamInfo>;
  bracketPicks: Record<string, string | null>;
  editable: boolean;
  onChange: (teamId: string | null) => void;
}) {
  const isThirdPlace = slot.phase === 'THIRD_FOURTH_POSITION';

  const homeTeam = isThirdPlace
    ? resolveLoserTeam(slot.home_loser_feeds_from_slot_id ?? null, bracketPicks, allSlots, teamById)
    : resolveTeam(slot.home_team, slot.home_feeds_from_slot_id, bracketPicks, teamById);

  const awayTeam = isThirdPlace
    ? resolveLoserTeam(slot.away_loser_feeds_from_slot_id ?? null, bracketPicks, allSlots, teamById)
    : resolveTeam(slot.away_team, slot.away_feeds_from_slot_id, bracketPicks, teamById);

  const selectedId = bracketPicks[slot.slot_id] ?? null;

  const isFinished = slot.actual_winner_team_id != null;
  const actualWinnerId = slot.actual_winner_team_id ?? null;
  const isCorrect = isFinished && selectedId !== null && selectedId === actualWinnerId;
  const isWrong = isFinished && selectedId !== null && selectedId !== actualWinnerId;
  const pointsAwarded = slot.points_awarded ?? null;
  const wentToPens =
    slot.outcome === 'LOCAL_PEN_W' || slot.outcome === 'AWAY_PEN_W';

  const winnerName = !isFinished && selectedId
    ? (homeTeam?.id === selectedId ? homeTeam?.name : awayTeam?.id === selectedId ? awayTeam?.name : null)
    : null;

  function slotLabel(slotId: string | null, isLoser: boolean): string | null {
    if (!slotId) return null;
    const src = allSlots.find((s) => s.slot_id === slotId);
    if (!src) return null;
    return isLoser ? `L. M${src.slot_index + 1}` : `W. M${src.slot_index + 1}`;
  }

  function TeamButton({
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
    const isActualLoser = !tbd && isFinished && team.id !== actualWinnerId;
    const canPick = editable && !tbd;

    const placeholder =
      slotLabel(loserFeedsFrom, true) ?? slotLabel(feedsFrom, false) ?? 'TBD';
    const label = tbd ? placeholder : team.name;

    return (
      <button
        onClick={() => {
          if (!canPick) return;
          onChange(isSelected ? null : team.id);
        }}
        disabled={!canPick}
        className={cn(
          'relative flex flex-1 flex-col items-center gap-1.5 rounded-xl border px-2 py-3 transition-all',
          // TBD
          tbd && 'cursor-default border-border opacity-40',
          // Not finished
          !isFinished && !tbd && !isSelected && editable && 'cursor-pointer border-border bg-card hover:border-primary/60 hover:bg-primary/5',
          !isFinished && !tbd && !isSelected && !editable && 'cursor-default border-border bg-card',
          !isFinished && isSelected && 'border-primary bg-primary/10 ring-1 ring-primary/30',
          // Finished — correct pick (user picked the winner)
          isFinished && isSelected && isActualWinner && 'cursor-default border-green-500/60 bg-green-500/10 ring-1 ring-green-500/30',
          // Finished — wrong pick (user picked the loser)
          isFinished && isSelected && isActualLoser && 'cursor-default border-destructive/40 bg-destructive/5 opacity-70',
          // Finished — actual winner, not picked by user
          isFinished && !isSelected && isActualWinner && 'cursor-default border-green-500/30 bg-green-500/5',
          // Finished — actual loser, not picked
          isFinished && !isSelected && isActualLoser && 'cursor-default border-border bg-card opacity-40',
        )}
      >
        {/* Winner crown badge */}
        {isActualWinner && (
          <Trophy className="absolute -top-2 left-1/2 h-3.5 w-3.5 -translate-x-1/2 text-amber-400" />
        )}
        {tbd
          ? <span className="text-2xl leading-none" aria-hidden>❓</span>
          : <TeamFlag teamName={team.name} size="lg" />
        }
        <span
          className={cn(
            'text-center text-xs font-medium leading-tight',
            tbd && 'text-muted-foreground/60',
            !isFinished && isSelected && 'text-primary',
            !isFinished && !isSelected && !tbd && 'text-foreground',
            isFinished && isSelected && isActualWinner && 'text-green-400',
            isFinished && isSelected && isActualLoser && 'text-destructive/70',
            isFinished && !isSelected && isActualWinner && 'text-green-400',
            isFinished && !isSelected && isActualLoser && 'text-foreground',
          )}
        >
          {label}
        </span>
      </button>
    );
  }

  return (
    <div className="border-b border-border px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        {/* Left: match number + score */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">M{slot.slot_index + 1}</span>
          {isFinished && slot.home_goals != null && slot.away_goals != null && (
            <span className="text-xs font-bold text-foreground tabular-nums">
              {slot.home_goals}–{slot.away_goals}
              {wentToPens && <span className="ml-1 font-normal text-muted-foreground">(P)</span>}
            </span>
          )}
        </div>
        {/* Right: result feedback */}
        <div>
          {isCorrect && (
            <span className="flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-xs font-bold text-green-400">
              <CheckCircle2 className="h-3 w-3" />
              {pointsAwarded != null && pointsAwarded > 0 ? `+${pointsAwarded}` : '✓'}
            </span>
          )}
          {isWrong && (
            <span className="flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/5 px-2 py-0.5 text-xs font-bold text-destructive/70">
              <XCircle className="h-3 w-3" />0
            </span>
          )}
          {!isFinished && winnerName && (
            <span className="text-xs font-medium text-primary">✓ {winnerName}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <TeamButton
          team={homeTeam}
          feedsFrom={slot.home_feeds_from_slot_id}
          loserFeedsFrom={slot.home_loser_feeds_from_slot_id ?? null}
        />
        <span className="shrink-0 text-xs font-bold text-muted-foreground">VS</span>
        <TeamButton
          team={awayTeam}
          feedsFrom={slot.away_feeds_from_slot_id}
          loserFeedsFrom={slot.away_loser_feeds_from_slot_id ?? null}
        />
      </div>
    </div>
  );
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function GroupSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-lg border border-border">
          <div className="h-8 animate-pulse bg-muted/50" />
          {Array.from({ length: 4 }, (_, j) => (
            <div key={j} className="flex items-center gap-3 border-t border-border px-3 py-2.5">
              <div className="h-3 w-5 animate-pulse rounded bg-muted" />
              <div className="h-5 w-6 animate-pulse rounded bg-muted" />
              <div className="h-3 flex-1 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PickemPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'groups' | 'bracket'>('groups');

  const overviewQuery = useQuery({
    queryKey: ['pickem-overview'],
    queryFn: fetchPickemOverview,
  });

  // Group stage local state — initialized once from overview
  const [groupPicks, setGroupPicks] = useState<GroupState[]>([]);
  const groupInitialized = useRef(false);

  // Bracket local state — initialized once from overview
  const [bracketPicks, setBracketPicks] = useState<Record<string, string | null>>({});
  const bracketInitialized = useRef(false);

  useEffect(() => {
    if (!overviewQuery.data) return;

    if (!groupInitialized.current) {
      groupInitialized.current = true;
      setGroupPicks(
        overviewQuery.data.group_stage.groups.map((g) => ({
          group_id: g.group_id,
          name: g.name,
          teams: [...g.teams].sort((a, b) => a.predicted_position - b.predicted_position),
        })),
      );
    }

    if (!bracketInitialized.current) {
      bracketInitialized.current = true;
      const init: Record<string, string | null> = {};
      for (const slot of overviewQuery.data.bracket.slots) {
        init[slot.slot_id] = slot.predicted_winner_team_id ?? null;
      }
      setBracketPicks(init);
    }
  }, [overviewQuery.data]);

  const groupMutation = useMutation({
    mutationFn: submitGroupStagePicks,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['pickem-overview'] }),
  });

  const bracketMutation = useMutation({
    mutationFn: submitBracketPicks,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['pickem-overview'] }),
  });

  function handleGroupSubmit() {
    groupMutation.mutate({
      picks: groupPicks.map((g) => ({
        group_id: g.group_id,
        entries: g.teams.map((t, i) => ({ team_id: t.team_id, predicted_position: i + 1 })),
      })),
    });
  }

  function handleBracketSubmit() {
    const picks = Object.entries(bracketPicks)
      .filter((entry): entry is [string, string] => entry[1] !== null)
      .map(([slot_id, predicted_winner_team_id]) => ({ slot_id, predicted_winner_team_id }));
    bracketMutation.mutate({ picks });
  }

  const isLoading = overviewQuery.isLoading;
  const isError = overviewQuery.isError;

  // Slots grouped by phase
  const slotsByPhase = new Map<string, BracketSlotPickemOverview[]>();
  if (overviewQuery.data) {
    for (const slot of overviewQuery.data.bracket.slots) {
      if (!slotsByPhase.has(slot.phase)) slotsByPhase.set(slot.phase, []);
      slotsByPhase.get(slot.phase)!.push(slot);
    }
    for (const slots of slotsByPhase.values()) {
      slots.sort((a, b) => a.slot_index - b.slot_index);
    }
  }

  const group_stage = overviewQuery.data?.group_stage;
  const bracket = overviewQuery.data?.bracket;

  // Build team lookup from slot data — avoids a separate teams API call for the bracket
  const teamById = useMemo(() => {
    const map = new Map<string, TeamInfo>();
    for (const slot of bracket?.slots ?? []) {
      if (slot.home_team) map.set(slot.home_team.id, slot.home_team);
      if (slot.away_team) map.set(slot.away_team.id, slot.away_team);
    }
    return map;
  }, [bracket?.slots]);

  return (
    <div className="flex flex-col">
      {/* Desktop header */}
      <div className="hidden border-b border-border px-6 py-5 md:block">
        <h1 className="text-xl font-bold">Pick'em</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Predict group standings and the knockout bracket
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border">
        {(['groups', 'bracket'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-colors',
              tab === t
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t === 'groups' ? 'Group Stage' : 'Bracket'}
          </button>
        ))}
      </div>

      {/* ── Group Stage Tab ── */}
      {tab === 'groups' && (
        <>
          {isLoading && <GroupSkeleton />}

          {isError && (
            <div className="flex flex-col items-center gap-2 px-4 py-20 text-center text-muted-foreground">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm font-medium">Failed to load Pick'em</p>
              <p className="text-xs">Check your connection and try again.</p>
            </div>
          )}

          {!isLoading && !isError && group_stage && (
            <>
              {/* Status banners */}
              <div className="px-4 pt-4">
                {!group_stage.is_available && (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                    <Lock className="h-4 w-4 shrink-0" />
                    Group Stage Pick'em is not available yet.
                  </div>
                )}
                {group_stage.is_available && !group_stage.editable && group_stage.has_submitted && (
                  <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Your Group Stage picks are locked in.
                  </div>
                )}
                {group_stage.is_available && !group_stage.editable && !group_stage.has_submitted && (
                  <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <XCircle className="h-4 w-4 shrink-0" />
                    Deadline passed — you didn't submit any picks for this round.
                  </div>
                )}
                {group_stage.is_available && group_stage.editable && group_stage.has_submitted && (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Picks submitted — you can still update them before the deadline.
                  </div>
                )}
                {group_stage.is_available && group_stage.editable && !group_stage.has_submitted && (
                  <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
                    <Info className="h-4 w-4 shrink-0" />
                    No picks yet — drag teams into your predicted finishing order for each group.
                  </div>
                )}
              </div>

              <GroupStageScoreSummary groups={group_stage.groups} />

              {/* Responsive group grid */}
              <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {groupPicks.map((group, idx) => {
                  const overview = group_stage.groups.find((g) => g.group_id === group.group_id);
                  return (
                    <GroupCard
                      key={group.group_id}
                      group={group}
                      editable={group_stage.editable}
                      color={GROUP_HEADER_COLORS[idx % GROUP_HEADER_COLORS.length]}
                      pointsAwarded={overview?.points_awarded}
                      onChange={(teams) =>
                        setGroupPicks((prev) =>
                          prev.map((g) => (g.group_id === group.group_id ? { ...g, teams } : g)),
                        )
                      }
                    />
                  );
                })}
              </div>

              {/* Submit */}
              {group_stage.is_available && group_stage.editable && (
                <div className="flex flex-col gap-2 px-4 pb-4">
                  <button
                    onClick={handleGroupSubmit}
                    disabled={groupMutation.isPending || groupPicks.length === 0}
                    className={cn(
                      'w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity',
                      groupMutation.isPending || groupPicks.length === 0
                        ? 'opacity-60'
                        : 'hover:opacity-90',
                    )}
                  >
                    {groupMutation.isPending
                      ? 'Saving…'
                      : group_stage.has_submitted
                        ? 'Update Picks'
                        : 'Submit Picks'}
                  </button>
                  {groupMutation.isError && (
                    <p className="text-center text-sm text-destructive">
                      Failed to save. Please try again.
                    </p>
                  )}
                  {groupMutation.isSuccess && (
                    <p className="text-center text-sm text-green-500">Picks saved!</p>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── Bracket Tab ── */}
      {tab === 'bracket' && (
        <>
          {isLoading && <GroupSkeleton />}

          {isError && (
            <div className="flex flex-col items-center gap-2 px-4 py-20 text-center text-muted-foreground">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm font-medium">Failed to load Pick'em</p>
              <p className="text-xs">Check your connection and try again.</p>
            </div>
          )}

          {!isLoading && !isError && bracket && (
            <>
              {/* Status banners */}
              <div className="px-4 pt-4 pb-4">
                {!bracket.is_available && (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                    <Lock className="h-4 w-4 shrink-0" />
                    Bracket Pick'em is not available yet.
                  </div>
                )}
                {bracket.is_available && !bracket.editable && bracket.has_submitted && (
                  <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Your Bracket picks are locked in.
                  </div>
                )}
                {bracket.is_available && !bracket.editable && !bracket.has_submitted && (
                  <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <XCircle className="h-4 w-4 shrink-0" />
                    Deadline passed — you didn't submit a bracket for this round.
                  </div>
                )}
                {bracket.is_available && bracket.editable && bracket.has_submitted && (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Picks submitted — you can still update them before the deadline.
                  </div>
                )}
                {bracket.is_available && bracket.editable && !bracket.has_submitted && (
                  <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
                    <Info className="h-4 w-4 shrink-0" />
                    No picks yet — pick the winner of each knockout match across every round.
                  </div>
                )}
              </div>

              {/* Slots by phase */}
              {BRACKET_PHASE_ORDER.filter((phase) => slotsByPhase.has(phase)).map((phase) => (
                <section key={phase}>
                  <div className="sticky top-0 z-10 border-b border-border bg-muted/80 px-4 py-2 backdrop-blur">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {PHASE_LABELS[phase]}
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2">
                    {(slotsByPhase.get(phase) ?? []).map((slot) => (
                      <BracketMatchCard
                        key={slot.slot_id}
                        slot={slot}
                        allSlots={bracket.slots}
                        teamById={teamById}
                        bracketPicks={bracketPicks}
                        editable={bracket.editable}
                        onChange={(teamId) =>
                          setBracketPicks((prev) => ({ ...prev, [slot.slot_id]: teamId }))
                        }
                      />
                    ))}
                  </div>
                </section>
              ))}

              {bracket.slots.length === 0 && (
                <p className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No bracket slots available yet.
                </p>
              )}

              {/* Submit */}
              {bracket.is_available && bracket.editable && (
                <div className="flex flex-col gap-2 p-4">
                  <button
                    onClick={handleBracketSubmit}
                    disabled={bracketMutation.isPending}
                    className={cn(
                      'w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity',
                      bracketMutation.isPending ? 'opacity-60' : 'hover:opacity-90',
                    )}
                  >
                    {bracketMutation.isPending
                      ? 'Saving…'
                      : bracket.has_submitted
                        ? 'Update Bracket'
                        : 'Submit Bracket'}
                  </button>
                  {bracketMutation.isError && (
                    <p className="text-center text-sm text-destructive">
                      Failed to save. Please try again.
                    </p>
                  )}
                  {bracketMutation.isSuccess && (
                    <p className="text-center text-sm text-green-500">Bracket saved!</p>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Check, ChevronDown, Loader2 } from 'lucide-react';
import { fetchTeams } from '@/api/matches';
import { fetchGroups, setGroupFinalStandings } from '@/api/groups';
import { TeamFlag } from '@/components/app/TeamFlag';
import { cn } from '@/lib/utils';
import { wcBtnPrimary, wcFontBody } from '@/lib/wc-ui';
import type { components } from '@/types/api';

type GroupResponse = components['schemas']['GroupResponse'];
type GroupStandingResponse = components['schemas']['GroupStandingResponse'];
type TeamResponse = components['schemas']['TeamResponse'];

const GROUP_HEADER_COLORS = [
  '#3CAC3B', '#E61D25', '#F58220', '#2A398D',
  '#7B2D8E', '#9ACD32', '#E91E8C', '#00ACC1',
  '#AB47BC', '#00897B', '#FF5722', '#29B6F6',
] as const;

function groupDisplayName(name: string): string {
  return name.replace(/^Group\s+/i, '');
}
function groupColor(name: string): string {
  const letter = groupDisplayName(name).charCodeAt(0);
  const idx = Number.isNaN(letter) ? 0 : (letter - 65) % GROUP_HEADER_COLORS.length;
  return GROUP_HEADER_COLORS[Math.max(0, idx)];
}

function standingLabel(
  standing: GroupStandingResponse,
  teamById: Map<string, TeamResponse>,
): string {
  const team = teamById.get(standing.team_id);
  return team?.label_ca ?? team?.name ?? standing.team_id.slice(0, 8);
}

function buildDraft(
  standings: GroupStandingResponse[],
): Record<string, number> {
  const draft: Record<string, number> = {};
  for (const row of standings) {
    draft[row.team_id] = row.final_position > 0 ? row.final_position : 0;
  }
  return draft;
}

function GroupStandingsEditor({
  group,
  teamById,
  onSaved,
}: {
  group: GroupResponse;
  teamById: Map<string, TeamResponse>;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<Record<string, number>>(() => buildDraft(group.standings));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(buildDraft(group.standings));
    setError(null);
  }, [group.id, group.standings]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const positions = Object.values(draft).filter((p) => p > 0);
      const unique = new Set(positions);
      if (positions.length !== group.standings.length) {
        throw new Error('Assigna una posició (1–4) a cada equip.');
      }
      if (unique.size !== positions.length) {
        throw new Error('Cada posició ha de ser única dins del grup.');
      }
      return setGroupFinalStandings(group.id, {
        standings: group.standings.map((row) => ({
          team_id: row.team_id,
          final_position: draft[row.team_id],
        })),
      });
    },
    onSuccess: () => {
      setError(null);
      onSaved();
    },
    onError: (err: Error) => setError(err.message),
  });

  const sortedStandings = useMemo(
    () =>
      [...group.standings].sort((a, b) => {
        const pa = draft[a.team_id] || 99;
        const pb = draft[b.team_id] || 99;
        if (pa !== pb) return pa - pb;
        return b.points - a.points || b.goals_for - b.goals_for - (a.goals_for - a.goals_against);
      }),
    [group.standings, draft],
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-wc-light-gray shadow-sm">
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ backgroundColor: groupColor(group.name) }}
      >
        <h3 className="wc-group-card-title">Grup {groupDisplayName(group.name)}</h3>
        <span className="text-xs text-white/80">
          {group.standings[0]?.points != null ? 'Pts · DG a la taula' : ''}
        </span>
      </div>

      <div className="divide-y divide-border bg-card">
        {sortedStandings.map((row) => {
          const team = teamById.get(row.team_id);
          const label = standingLabel(row, teamById);
          return (
            <div key={row.team_id} className="flex items-center gap-2 px-3 py-2.5">
              <TeamFlag teamName={team?.name ?? label} size="md" />
              <div className="min-w-0 flex-1">
                <p className={cn('truncate text-sm font-medium uppercase', wcFontBody)}>{label}</p>
                <p className="text-[10px] tabular-nums text-muted-foreground">
                  {row.points} pts · {row.goals_for}:{row.goals_against}
                  {row.final_position > 0 ? ` · oficial #${row.final_position}` : ''}
                </p>
              </div>
              <label className="flex shrink-0 items-center gap-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground">#</span>
                <select
                  value={draft[row.team_id] || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    setDraft((prev) => ({
                      ...prev,
                      [row.team_id]: Number.isNaN(value) ? 0 : value,
                    }));
                  }}
                  className="h-8 w-14 rounded-lg border border-input bg-background text-center text-sm font-bold tabular-nums outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">—</option>
                  {[1, 2, 3, 4].map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          );
        })}
      </div>

      {error && (
        <p className="flex items-center gap-1.5 border-t border-border px-3 py-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      <div className="border-t border-border px-3 py-3">
        <button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className={cn(wcBtnPrimary, 'w-full justify-center gap-2')}
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Desar classificació final
        </button>
      </div>
    </div>
  );
}

export function AdminGroupStandingsContent() {
  const queryClient = useQueryClient();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const groupsQuery = useQuery({
    queryKey: ['tournament-groups'],
    queryFn: fetchGroups,
  });

  const teamsQuery = useQuery({
    queryKey: ['teams'],
    queryFn: fetchTeams,
  });

  const teamById = useMemo(() => {
    const map = new Map<string, TeamResponse>();
    for (const team of teamsQuery.data ?? []) {
      map.set(team.id, team);
    }
    return map;
  }, [teamsQuery.data]);

  const groups = groupsQuery.data ?? [];
  const selectedGroup =
    groups.find((g) => g.id === selectedGroupId) ?? groups[0] ?? null;

  useEffect(() => {
    if (!selectedGroupId && groups[0]) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  function handleSaved() {
    void queryClient.invalidateQueries({ queryKey: ['tournament-groups'] });
    void queryClient.invalidateQueries({ queryKey: ['pickem-overview'] });
  }

  return (
    <>
      <p className="mb-3 text-xs text-muted-foreground">
        Assigna l&apos;ordre final (1r–4t) per tancar el Pick&apos;em de fase de grups.
      </p>

      {groupsQuery.isLoading && (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {groupsQuery.isError && (
        <p className="flex items-center gap-2 py-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          No s&apos;han pogut carregar els grups.
        </p>
      )}

      {selectedGroup && !groupsQuery.isLoading && (
        <div className="flex flex-col gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-semibold"
            >
              Grup {groupDisplayName(selectedGroup.name)}
              <ChevronDown className={cn('h-4 w-4 transition-transform', pickerOpen && 'rotate-180')} />
            </button>
            {pickerOpen && (
              <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-border bg-background shadow-lg">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => {
                      setSelectedGroupId(group.id);
                      setPickerOpen(false);
                    }}
                    className={cn(
                      'block w-full px-3 py-2 text-left text-sm hover:bg-muted',
                      group.id === selectedGroup.id && 'bg-primary/10 font-semibold text-primary',
                    )}
                  >
                    Grup {groupDisplayName(group.name)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <GroupStandingsEditor
            key={selectedGroup.id}
            group={selectedGroup}
            teamById={teamById}
            onSaved={handleSaved}
          />
        </div>
      )}
    </>
  );
}

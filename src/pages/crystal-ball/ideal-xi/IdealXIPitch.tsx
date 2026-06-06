import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { fetchPlayers } from '@/api/crystal-ball';
import { TeamFlag } from '@/components/app/TeamFlag';
import { cn, getAvatarColor, getInitials } from '@/lib/utils';
import { wcFontBody } from '@/lib/wc-ui';
import type { components } from '@/types/api';
import {
  IDEAL_XI_CATALOG_PLAYERS,
  IDEAL_XI_DEFAULT_FORMATION_ID,
  IDEAL_XI_FORMATIONS,
  IDEAL_XI_LINE_LABELS,
  IDEAL_XI_MAX_PLAYERS,
  getFormationById,
} from './ideal-xi.data';
import type { IdealXIAnswerDraft, IdealXILine, IdealXISlot } from './types';

type TeamResponse = components['schemas']['TeamResponse'];
type PlayerResponse = components['schemas']['PlayerResponse'];

type ResolvedPlayer = {
  id: string;
  name: string;
  teamName: string;
  position: IdealXILine;
};

function toLine(position: string): IdealXILine | null {
  if (position === 'GK' || position === 'DEF' || position === 'MID' || position === 'FWD') {
    return position;
  }
  return null;
}

function buildPlayerPool(
  apiPlayers: PlayerResponse[],
  teams: TeamResponse[],
): ResolvedPlayer[] {
  const teamNameById = new Map(teams.map((t) => [t.id, t.name]));
  const fromApi: ResolvedPlayer[] = [];
  for (const p of apiPlayers) {
    const line = toLine(p.position);
    if (!line) continue;
    fromApi.push({
      id: p.id,
      name: p.name,
      teamName: teamNameById.get(p.team_id) ?? '',
      position: line,
    });
  }
  const seen = new Set(fromApi.map((p) => p.id));
  for (const p of IDEAL_XI_CATALOG_PLAYERS) {
    if (!seen.has(p.id)) fromApi.push(p);
  }
  return fromApi;
}

function SlotCard({
  slot,
  player,
  locked,
  onClick,
  onClear,
}: {
  slot: IdealXISlot;
  player: ResolvedPlayer | undefined;
  locked: boolean;
  onClick: () => void;
  onClear: () => void;
}) {
  return (
    <button
      type="button"
      disabled={locked}
      onClick={onClick}
      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
      className={cn(
        'ideal-xi-slot absolute -translate-x-1/2 -translate-y-1/2',
        slot.line === 'GK' && 'ideal-xi-slot--gk',
        slot.line === 'DEF' && 'ideal-xi-slot--def',
        locked && 'cursor-default',
      )}
    >
      {player ? (
        <div className="ideal-xi-slot-card ideal-xi-slot-card--filled group">
          {!locked && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation();
                  onClear();
                }
              }}
              className="ideal-xi-slot-clear"
              aria-label="Treure jugador"
            >
              <X size={10} />
            </span>
          )}
          <span className="ideal-xi-slot-pos">{slot.uiLabel}</span>
          <div className={cn('ideal-xi-slot-avatar', getAvatarColor(player.id))}>
            {getInitials(player.name.split(' ')[0] ?? '?', player.name.split(' ').slice(-1)[0] ?? '')}
          </div>
          <span className={cn('ideal-xi-slot-name', wcFontBody)}>{player.name}</span>
          {player.teamName && (
            <TeamFlag teamName={player.teamName} size="sm" className="ideal-xi-slot-flag" />
          )}
        </div>
      ) : (
        <div className="ideal-xi-slot-card ideal-xi-slot-card--empty">
          <span className="ideal-xi-slot-pos ideal-xi-slot-pos--muted">{slot.uiLabel}</span>
          <span className="ideal-xi-slot-line">{IDEAL_XI_LINE_LABELS[slot.line].short}</span>
          <span className="ideal-xi-slot-plus">+</span>
        </div>
      )}
    </button>
  );
}

function FormationPickerSheet({
  selectedId,
  onSelect,
  onClose,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="ideal-xi-sheet-backdrop ideal-xi-sheet-backdrop--formation"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="ideal-xi-sheet ideal-xi-sheet--formation"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Triar formació"
      >
        <div className="ideal-xi-formation-handle" aria-hidden />

        <ul className="ideal-xi-formation-list">
          {IDEAL_XI_FORMATIONS.map((f) => {
            const selected = f.id === selectedId;
            return (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(f.id);
                    onClose();
                  }}
                  className={cn(
                    'ideal-xi-formation-option',
                    selected && 'ideal-xi-formation-option--selected',
                  )}
                >
                  <Check
                    size={17}
                    strokeWidth={2.5}
                    className={cn('ideal-xi-formation-check', selected && 'ideal-xi-formation-check--visible')}
                    aria-hidden
                  />
                  <span>{f.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function PlayerPickerSheet({
  slot,
  players,
  usedPlayerIds,
  onSelect,
  onClose,
}: {
  slot: IdealXISlot;
  players: ResolvedPlayer[];
  usedPlayerIds: Set<string>;
  onSelect: (playerId: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const lineMeta = IDEAL_XI_LINE_LABELS[slot.line];
  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    return players
      .filter((p) => p.position === slot.line)
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.teamName.toLowerCase().includes(q))
      .slice(0, 40);
  }, [players, slot.line, q]);

  return (
    <div className="ideal-xi-sheet-backdrop" onClick={onClose} role="presentation">
      <div
        className="ideal-xi-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`Triar ${lineMeta.label}`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-wc-light-gray px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-wc-hermes">
              {slot.uiLabel} · {lineMeta.label}
            </p>
            <p className="text-sm text-wc-dark-gray">Tria un jugador per a aquesta posició</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-muted">
            <X size={18} />
          </button>
        </div>

        <div className="px-4 pt-3">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar jugador…"
              className="w-full rounded-xl border border-wc-light-gray bg-white py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-wc-green/40"
            />
          </div>
        </div>

        <ul className="max-h-56 overflow-y-auto px-2 py-2">
          {filtered.length === 0 && (
            <li className="px-3 py-4 text-center text-sm text-muted-foreground">
              Cap jugador trobat per a {lineMeta.label}
            </li>
          )}
          {filtered.map((player) => {
            const taken = usedPlayerIds.has(player.id);
            return (
              <li key={player.id}>
                <button
                  type="button"
                  disabled={taken}
                  onClick={() => onSelect(player.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm uppercase transition-colors',
                    wcFontBody,
                    taken
                      ? 'cursor-not-allowed opacity-40'
                      : 'hover:bg-wc-hermes/5',
                  )}
                >
                  <TeamFlag teamName={player.teamName} size="sm" />
                  <span className="min-w-0 flex-1 truncate">{player.name}</span>
                  <span className="text-[10px] text-muted-foreground">{player.position}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function IdealXIPitch({
  drafts,
  onDraftsChange,
  teams,
  locked,
}: {
  drafts: IdealXIAnswerDraft[];
  onDraftsChange: (drafts: IdealXIAnswerDraft[]) => void;
  teams: TeamResponse[];
  locked: boolean;
}) {
  const [formationId, setFormationId] = useState(IDEAL_XI_DEFAULT_FORMATION_ID);
  const [formationOpen, setFormationOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<IdealXISlot | null>(null);

  const formation = getFormationById(formationId) ?? IDEAL_XI_FORMATIONS[0]!;

  const { data: apiPlayers = [] } = useQuery({
    queryKey: ['ideal-xi-players'],
    queryFn: () => fetchPlayers({}),
    staleTime: 10 * 60_000,
  });

  const playerPool = useMemo(
    () => buildPlayerPool(apiPlayers, teams),
    [apiPlayers, teams],
  );

  const playerById = useMemo(
    () => new Map(playerPool.map((p) => [p.id, p])),
    [playerPool],
  );

  const draftByIndex = useMemo(
    () => new Map(drafts.map((d) => [d.selection_index, d.player_id])),
    [drafts],
  );

  const usedPlayerIds = useMemo(() => new Set(drafts.map((d) => d.player_id)), [drafts]);

  const filledCount = drafts.length;

  function setPlayerForSlot(selectionIndex: number, playerId: string) {
    const withoutSlotAndPlayer = drafts.filter(
      (d) => d.selection_index !== selectionIndex && d.player_id !== playerId,
    );
    onDraftsChange([...withoutSlotAndPlayer, { selection_index: selectionIndex, player_id: playerId }]);
    setActiveSlot(null);
  }

  function clearSlot(selectionIndex: number) {
    onDraftsChange(drafts.filter((d) => d.selection_index !== selectionIndex));
  }

  function handleFormationChange(newId: string) {
    const next = getFormationById(newId);
    if (!next) return;
    setFormationId(newId);
    const validIndices = new Set(next.slots.map((s) => s.selectionIndex));
    const pruned = drafts.filter((d) => validIndices.has(d.selection_index));
    if (pruned.length !== drafts.length) {
      onDraftsChange(pruned);
    }
  }

  return (
    <div className="ideal-xi-root">
      <div className="mb-3 flex flex-col gap-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold text-wc-dark-gray">
            {filledCount} / {IDEAL_XI_MAX_PLAYERS} jugadors · Puntuaràs més si encertes línia (GK/DEF/MID/DEL)
          </p>
          <div className="flex shrink-0 items-center gap-2 text-xs font-semibold text-wc-dark-gray">
            Formació
            <button
              type="button"
              disabled={locked}
              onClick={() => setFormationOpen(true)}
              className="flex min-w-[7.5rem] max-w-[11rem] items-center justify-between gap-2 rounded-lg border border-wc-light-gray bg-white px-2.5 py-1.5 text-sm font-medium text-wc-card-text focus:outline-none focus:ring-2 focus:ring-wc-green/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="truncate">{formation.label}</span>
              <ChevronDown size={16} className="shrink-0 opacity-60" />
            </button>
          </div>
        </div>
      </div>

      <div className="ideal-xi-pitch-wrap">
        <div className="ideal-xi-pitch" aria-label="Camp de l'onze ideal">
          <div className="ideal-xi-pitch-line ideal-xi-pitch-line--half" />
          <div className="ideal-xi-pitch-circle" />
          <div className="ideal-xi-pitch-box ideal-xi-pitch-box--top" />
          <div className="ideal-xi-pitch-box ideal-xi-pitch-box--bottom" />

          <div className="ideal-xi-pitch-slots">
            {formation.slots.map((slot) => {
              const playerId = draftByIndex.get(slot.selectionIndex);
              const player = playerId ? playerById.get(playerId) : undefined;
              return (
                <SlotCard
                  key={`${formation.id}-${slot.selectionIndex}`}
                  slot={slot}
                  player={player}
                  locked={locked}
                  onClick={() => !locked && setActiveSlot(slot)}
                  onClear={() => clearSlot(slot.selectionIndex)}
                />
              );
            })}
          </div>
        </div>
      </div>

      {formationOpen && !locked && (
        <FormationPickerSheet
          selectedId={formationId}
          onSelect={handleFormationChange}
          onClose={() => setFormationOpen(false)}
        />
      )}

      {activeSlot && !locked && (
        <PlayerPickerSheet
          slot={activeSlot}
          players={playerPool}
          usedPlayerIds={usedPlayerIds}
          onSelect={(id) => setPlayerForSlot(activeSlot.selectionIndex, id)}
          onClose={() => setActiveSlot(null)}
        />
      )}
    </div>
  );
}

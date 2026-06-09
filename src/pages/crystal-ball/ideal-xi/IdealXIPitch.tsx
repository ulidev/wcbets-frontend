import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { fetchPlayers } from '@/api/crystal-ball';
import type { components } from '@/types/api';
import { cn } from '@/lib/utils';
import { FormationPickerSheet } from './components/FormationPickerSheet';
import { IdealXIPlayerPickerSheet } from './components/IdealXIPlayerPickerSheet';
import { SlotCard } from './components/SlotCard';
import {
  IDEAL_XI_FORMATIONS,
  IDEAL_XI_MAX_PLAYERS,
  getFormationById,
  groupFormationSlotsByRow,
  remapDraftsForFormation,
} from './ideal-xi.data';
import { buildPlayerPool } from './ideal-xi.players';
import type { IdealXIAnswerDraft, IdealXISlot } from './types';

type TeamResponse = components['schemas']['TeamResponse'];

type IdealXIPitchProps = {
  drafts: IdealXIAnswerDraft[];
  formationId: string;
  onFormationIdChange: (formationId: string) => void;
  onDraftsChange: (drafts: IdealXIAnswerDraft[]) => void;
  teams: TeamResponse[];
  locked: boolean;
};

export function IdealXIPitch({
  drafts,
  formationId,
  onFormationIdChange,
  onDraftsChange,
  teams,
  locked,
}: IdealXIPitchProps) {
  const [formationOpen, setFormationOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<IdealXISlot | null>(null);

  const formation = getFormationById(formationId) ?? IDEAL_XI_FORMATIONS[0]!;

  const pitchRows = useMemo(
    () => groupFormationSlotsByRow(formation.slots),
    [formation.slots],
  );

  const hasWideRow = pitchRows.some((row) => row.slots.length >= 5);

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
    if (!next || newId === formationId) return;
    onFormationIdChange(newId);
    onDraftsChange(
      remapDraftsForFormation(
        drafts,
        next,
        (playerId) => playerById.get(playerId)?.position,
      ),
    );
  }

  return (
    <div className="ideal-xi-root">
      <div className="mb-3 flex flex-col gap-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold text-wc-dark-gray">
            {drafts.length} / {IDEAL_XI_MAX_PLAYERS} jugadors · Puntuaràs més si encertes línia (GK/DEF/MID/DEL)
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
        <div
          className={cn('ideal-xi-pitch', hasWideRow && 'ideal-xi-pitch--wide-row')}
          aria-label="Camp de l'onze ideal"
        >
          <div className="ideal-xi-pitch-line ideal-xi-pitch-line--half" />
          <div className="ideal-xi-pitch-circle" />
          <div className="ideal-xi-pitch-box ideal-xi-pitch-box--top" />
          <div className="ideal-xi-pitch-box ideal-xi-pitch-box--bottom" />

          <div className="ideal-xi-pitch-slots">
            {pitchRows.map((row) => (
              <div
                key={row.y}
                className={cn(
                  'ideal-xi-pitch-row',
                  row.slots.length === 1 && 'ideal-xi-pitch-row--solo',
                )}
                style={{ top: `${row.y}%` }}
              >
                {row.slots.map((slot) => {
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
            ))}
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
        <IdealXIPlayerPickerSheet
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

import { useState } from 'react';
import { CheckCircle2, Search, X } from 'lucide-react';
import { TeamFlag } from '@/components/app/TeamFlag';
import { cn } from '@/lib/utils';
import { wcFontBody } from '@/lib/wc-ui';
import { usePlayerSearch } from '../hooks/usePlayerSearch';
import type { PlayerResponse, TeamResponse } from '../crystal-ball.types';

type PlayerPickerProps = {
  teams: TeamResponse[];
  selected: string[];
  maxSelections: number;
  onToggle: (playerId: string) => void;
  locked: boolean;
};

export function PlayerPicker({
  teams,
  selected,
  maxSelections,
  onToggle,
  locked,
}: PlayerPickerProps) {
  const { query, onChange, players, isFetching } = usePlayerSearch();
  const [playerNames, setPlayerNames] = useState<Record<string, { name: string; teamId: string }>>(
    {},
  );

  const handleToggle = (player: PlayerResponse) => {
    setPlayerNames((prev) => ({
      ...prev,
      [player.id]: { name: player.name, teamId: player.team_id },
    }));
    onToggle(player.id);
  };

  const getTeamName = (teamId: string) => teams.find((t) => t.id === teamId)?.name ?? '';

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((id, idx) => {
            const info = playerNames[id];
            return (
              <span
                key={id}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border border-wc-hermes/20 bg-wc-hermes/10 px-2.5 py-1 text-xs uppercase text-wc-hermes',
                  wcFontBody,
                )}
              >
                {maxSelections > 1 && (
                  <span className="text-[10px] text-wc-hermes/60">{idx + 1}.</span>
                )}
                {info && <TeamFlag teamName={getTeamName(info.teamId)} size="sm" />}
                {info?.name ?? id.slice(0, 8)}
                {!locked && (
                  <button
                    type="button"
                    onClick={() => onToggle(id)}
                    className="ml-0.5 text-wc-hermes/60 hover:text-wc-red"
                  >
                    <X size={12} />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}

      {!locked && selected.length < maxSelections && (
        <>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={query}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Buscar jugador (mín. 2 letras)…"
              className="w-full rounded-xl border border-wc-light-gray bg-white py-2 pl-8 pr-3 text-sm text-wc-card-text focus:outline-none focus:ring-2 focus:ring-wc-green/40"
            />
          </div>

          {query.length >= 2 && (
            <div
              className="crystal-picker-surface max-h-44 overflow-y-auto"
              onMouseDown={(e) => e.preventDefault()}
            >
              {isFetching && (
                <div className="px-3 py-2 text-sm text-wc-dark-gray">Searching…</div>
              )}
              {!isFetching && players.length === 0 && (
                <div className="px-3 py-2 text-sm text-wc-dark-gray">No players found</div>
              )}
              {!isFetching &&
                players.map((player) => {
                  const isSelected = selected.includes(player.id);
                  return (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => !isSelected && handleToggle(player)}
                      disabled={isSelected}
                      className={cn(
                        'flex w-full items-center gap-2 border-b border-wc-light-gray/80 px-3 py-2 text-left text-sm uppercase transition-colors last:border-b-0',
                        wcFontBody,
                        isSelected
                          ? 'cursor-default bg-wc-light-gray/30 text-wc-dark-gray'
                          : 'hover:bg-wc-hermes/5',
                      )}
                    >
                      <TeamFlag teamName={getTeamName(player.team_id)} size="sm" />
                      <span className={cn('flex-1', wcFontBody)}>{player.name}</span>
                      <span className="text-xs text-wc-dark-gray">{player.position}</span>
                      {isSelected && <CheckCircle2 size={14} className="text-wc-green" />}
                    </button>
                  );
                })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

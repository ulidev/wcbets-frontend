import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { TeamFlag } from '@/components/app/TeamFlag';
import { cn } from '@/lib/utils';
import { wcFontBody } from '@/lib/wc-ui';
import { IDEAL_XI_LINE_LABELS } from '../ideal-xi.data';
import type { ResolvedPlayer } from '../ideal-xi.players';
import type { IdealXISlot } from '../types';

type IdealXIPlayerPickerSheetProps = {
  slot: IdealXISlot;
  players: ResolvedPlayer[];
  usedPlayerIds: Set<string>;
  onSelect: (playerId: string) => void;
  onClose: () => void;
};

export function IdealXIPlayerPickerSheet({
  slot,
  players,
  usedPlayerIds,
  onSelect,
  onClose,
}: IdealXIPlayerPickerSheetProps) {
  const [query, setQuery] = useState('');
  const lineMeta = IDEAL_XI_LINE_LABELS[slot.line];
  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    return players
      .filter((p) => p.position === slot.line)
      .filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.teamName.toLowerCase().includes(q) ||
          p.teamLabel.toLowerCase().includes(q),
      )
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
              placeholder="Cercar jugador…"
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
                    taken ? 'cursor-not-allowed opacity-40' : 'hover:bg-wc-hermes/5',
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

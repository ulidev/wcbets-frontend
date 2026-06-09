import { useRef, useState } from 'react';
import { CheckCircle2, Search, X } from 'lucide-react';
import { TeamFlag } from '@/components/app/TeamFlag';
import { cn } from '@/lib/utils';
import { wcFontBody } from '@/lib/wc-ui';
import type { TeamResponse } from '../crystal-ball.types';

type TeamPickerProps = {
  teams: TeamResponse[];
  selected: string[];
  maxSelections: number;
  onToggle: (teamId: string) => void;
  locked: boolean;
};

export function TeamPicker({
  teams,
  selected,
  maxSelections,
  onToggle,
  locked,
}: TeamPickerProps) {
  const [filter, setFilter] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canAddMore = !locked && selected.length < maxSelections;
  const showResults = canAddMore && pickerOpen;
  const query = filter.trim().toLowerCase();
  const filtered = teams.filter((t) =>
    query.length === 0
      ? true
      : t.name.toLowerCase().includes(query) ||
        (t.label_ca?.toLowerCase().includes(query) ?? false),
  );

  const openPicker = () => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    setPickerOpen(true);
  };

  const scheduleClose = () => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    blurTimer.current = setTimeout(() => setPickerOpen(false), 180);
  };

  const handleSelect = (teamId: string) => {
    onToggle(teamId);
    setFilter('');
    setPickerOpen(false);
  };

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((id, idx) => {
            const team = teams.find((t) => t.id === id);
            if (!team) return null;
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
                <TeamFlag teamName={team.name} size="sm" />
                {team.label_ca ?? team.name}
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

      {canAddMore && (
        <>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                openPicker();
              }}
              onFocus={openPicker}
              onBlur={scheduleClose}
              placeholder="Buscar equip…"
              className="w-full rounded-xl border border-wc-light-gray bg-white py-2 pl-8 pr-3 text-sm text-wc-card-text focus:outline-none focus:ring-2 focus:ring-wc-green/40"
            />
          </div>
          {showResults && (
            <div
              className="crystal-picker-surface max-h-44 overflow-y-auto"
              onMouseDown={(e) => e.preventDefault()}
            >
              {filtered.length === 0 ? (
                <div className="px-3 py-2 text-sm text-wc-dark-gray">No s'han trobat equips</div>
              ) : (
                filtered.map((team) => {
                  const isSelected = selected.includes(team.id);
                  return (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => !isSelected && handleSelect(team.id)}
                      disabled={isSelected}
                      className={cn(
                        'flex w-full items-center gap-2 border-b border-wc-light-gray/80 px-3 py-2 text-left text-sm uppercase transition-colors last:border-b-0',
                        wcFontBody,
                        isSelected
                          ? 'cursor-default bg-wc-light-gray/30 text-wc-dark-gray'
                          : 'hover:bg-wc-hermes/5',
                      )}
                    >
                      <TeamFlag teamName={team.name} size="sm" />
                      {team.label_ca ?? team.name}
                      {isSelected && <CheckCircle2 size={14} className="ml-auto text-wc-green" />}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

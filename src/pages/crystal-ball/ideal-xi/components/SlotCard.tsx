import { X } from 'lucide-react';
import { TeamFlag } from '@/components/app/TeamFlag';
import { cn, getAvatarColor, getInitials } from '@/lib/utils';
import { wcFontBody } from '@/lib/wc-ui';
import { IDEAL_XI_LINE_LABELS } from '../ideal-xi.data';
import type { ResolvedPlayer } from '../ideal-xi.players';
import type { IdealXISlot } from '../types';

type SlotCardProps = {
  slot: IdealXISlot;
  player: ResolvedPlayer | undefined;
  locked: boolean;
  onClick: () => void;
  onClear: () => void;
};

export function SlotCard({ slot, player, locked, onClick, onClear }: SlotCardProps) {
  return (
    <button
      type="button"
      disabled={locked}
      onClick={onClick}
      className={cn(
        'ideal-xi-slot',
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

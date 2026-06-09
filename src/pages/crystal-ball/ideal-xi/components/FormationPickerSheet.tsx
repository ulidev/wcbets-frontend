import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IDEAL_XI_FORMATIONS } from '../ideal-xi.data';

type FormationPickerSheetProps = {
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
};

export function FormationPickerSheet({ selectedId, onSelect, onClose }: FormationPickerSheetProps) {
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

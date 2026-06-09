import { AlertCircle } from 'lucide-react';
import { wcBtnPrimary } from '@/lib/wc-ui';

type CrystalBallSaveBarProps = {
  pendingCount: number;
  saving: boolean;
  saveError: string | null;
  onSave: () => void;
};

export function CrystalBallSaveBar({
  pendingCount,
  saving,
  saveError,
  onSave,
}: CrystalBallSaveBarProps) {
  return (
    <div className="sticky bottom-0 z-10 border-t border-wc-light-gray bg-white/95 px-4 py-3 backdrop-blur-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-wc-dark-gray">
          {pendingCount === 0
            ? 'Completa almenys una pregunta per guardar.'
            : `${pendingCount} pregunta${pendingCount === 1 ? '' : 'es'} per guardar`}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={saving || pendingCount === 0}
            className={wcBtnPrimary}
          >
            {saving ? 'Guardant…' : 'Guardar prediccions'}
          </button>
          {saveError && (
            <span className="flex items-center gap-1 text-xs font-semibold text-wc-red">
              <AlertCircle size={12} /> {saveError}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { useMobileSaveBarSlot } from '@/contexts/MobileSaveBarSlotContext';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { cn } from '@/lib/utils';
import { wcBtnPrimary } from '@/lib/wc-ui';

type StickySaveBarProps = {
  hint: string;
  saveLabel: string;
  saving: boolean;
  saveError: string | null;
  onSave: () => void;
  disabled?: boolean;
};

export function StickySaveBar({
  hint,
  saveLabel,
  saving,
  saveError,
  onSave,
  disabled = false,
}: StickySaveBarProps) {
  const isDesktop = useBreakpoint(768);
  const { setContent } = useMobileSaveBarSlot();

  const bar = useMemo(
    () => (
      <div className="border-t border-wc-light-gray bg-white/95 px-4 py-2 backdrop-blur-sm">
        <div className="flex flex-col gap-2">
          <p className="text-center text-[11px] leading-snug text-wc-dark-gray md:text-left md:text-xs">
            {hint}
          </p>
          <button
            type="button"
            onClick={onSave}
            disabled={disabled || saving}
            className={cn(wcBtnPrimary, 'w-full')}
          >
            {saving ? 'Guardant…' : saveLabel}
          </button>
          {saveError && (
            <span className="flex items-center justify-center gap-1 text-xs font-semibold text-wc-red md:justify-start">
              <AlertCircle size={12} /> {saveError}
            </span>
          )}
        </div>
      </div>
    ),
    [disabled, hint, onSave, saveError, saveLabel, saving],
  );

  useEffect(() => {
    if (isDesktop) {
      setContent(null);
      return;
    }
    setContent(bar);
    return () => setContent(null);
  }, [bar, isDesktop, setContent]);

  if (!isDesktop) return null;

  return <div className="px-4 pb-4 pt-2">{bar}</div>;
}

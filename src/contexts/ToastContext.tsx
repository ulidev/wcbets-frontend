import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastContextValue = {
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((next: string) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setMessage(next);
    setVisible(true);
    hideTimer.current = setTimeout(() => setVisible(false), 2800);
  }, []);

  useEffect(() => () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'pointer-events-none fixed right-4 top-[calc(3.75rem+env(safe-area-inset-top,0px))] z-[200] flex max-w-[min(18rem,calc(100vw-2rem))] items-center gap-2 rounded-xl border border-wc-green/30 bg-white px-3.5 py-2.5 shadow-lg transition-all duration-300 md:top-4',
            visible ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0',
          )}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-wc-green" aria-hidden />
          <span className="text-sm font-semibold text-wc-card-text">{message}</span>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}

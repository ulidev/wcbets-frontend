import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useBlocker } from 'react-router-dom';
import { UnsavedChangesDialog } from '@/components/app/UnsavedChangesDialog';

type UnsavedChangesContextValue = {
  setDirty: (id: string, dirty: boolean) => void;
};

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(null);

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const dirtySources = useRef(new Set<string>());
  const [hasUnsaved, setHasUnsaved] = useState(false);

  const setDirty = useCallback((id: string, dirty: boolean) => {
    if (dirty) dirtySources.current.add(id);
    else dirtySources.current.delete(id);
    setHasUnsaved(dirtySources.current.size > 0);
  }, []);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsaved && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (!hasUnsaved) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [hasUnsaved]);

  const value = useMemo(() => ({ setDirty }), [setDirty]);

  return (
    <UnsavedChangesContext.Provider value={value}>
      {children}
      <UnsavedChangesDialog blocker={blocker} />
    </UnsavedChangesContext.Provider>
  );
}

export function useRegisterUnsavedChanges(id: string, dirty: boolean) {
  const ctx = useContext(UnsavedChangesContext);
  if (!ctx) {
    throw new Error('useRegisterUnsavedChanges must be used within UnsavedChangesProvider');
  }

  useEffect(() => {
    ctx.setDirty(id, dirty);
    return () => ctx.setDirty(id, false);
  }, [id, dirty, ctx]);
}

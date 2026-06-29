import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type PageHeaderExtrasContextValue = {
  extras: ReactNode;
  setExtras: (extras: ReactNode) => void;
};

const PageHeaderExtrasContext = createContext<PageHeaderExtrasContextValue | null>(null);

export function PageHeaderExtrasProvider({ children }: { children: ReactNode }) {
  const [extras, setExtras] = useState<ReactNode>(null);
  const value = useMemo(() => ({ extras, setExtras }), [extras]);
  return (
    <PageHeaderExtrasContext.Provider value={value}>{children}</PageHeaderExtrasContext.Provider>
  );
}

export function usePageHeaderExtras(extras: ReactNode) {
  const ctx = useContext(PageHeaderExtrasContext);
  useEffect(() => {
    if (!ctx) return;
    ctx.setExtras(extras);
    return () => ctx.setExtras(null);
  }, [ctx, extras]);
}

export function usePageHeaderExtrasSlot() {
  return useContext(PageHeaderExtrasContext)?.extras ?? null;
}

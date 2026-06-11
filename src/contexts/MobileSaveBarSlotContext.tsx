import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type MobileSaveBarSlotContextValue = {
  content: ReactNode;
  setContent: (node: ReactNode) => void;
};

const MobileSaveBarSlotContext = createContext<MobileSaveBarSlotContextValue | null>(null);

export function MobileSaveBarSlotProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ReactNode>(null);
  const value = useMemo(() => ({ content, setContent }), [content]);

  return (
    <MobileSaveBarSlotContext.Provider value={value}>
      {children}
    </MobileSaveBarSlotContext.Provider>
  );
}

export function MobileSaveBarSlot() {
  const ctx = useContext(MobileSaveBarSlotContext);
  if (!ctx?.content) return null;

  return <div className="shrink-0 md:hidden">{ctx.content}</div>;
}

export function useMobileSaveBarSlot() {
  const ctx = useContext(MobileSaveBarSlotContext);
  if (!ctx) {
    throw new Error('useMobileSaveBarSlot must be used within MobileSaveBarSlotProvider');
  }
  return ctx;
}

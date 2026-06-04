import { useCallback, useRef } from 'react';

export function useBracketTreeScroll(totalWidth: number) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToRegion = useCallback(
    (region: 'left' | 'right') => {
      const el = scrollRef.current;
      if (!el) return;
      const margin = 16;
      const left =
        region === 'right' ? Math.max(0, totalWidth - el.clientWidth + margin) : 0;
      el.scrollTo({ left, behavior: 'smooth' });
    },
    [totalWidth],
  );

  return { scrollRef, scrollToRegion };
}

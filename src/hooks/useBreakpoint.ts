import { useEffect, useState } from 'react';

export function useBreakpoint(breakpoint = 768): boolean {
  const [isAbove, setIsAbove] = useState(() => window.innerWidth >= breakpoint);

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${breakpoint}px)`);
    const handler = (e: MediaQueryListEvent) => setIsAbove(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [breakpoint]);

  return isAbove;
}

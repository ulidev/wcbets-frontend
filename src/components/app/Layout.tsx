import { Outlet, useLocation } from 'react-router-dom';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { navItems } from './navItems';

export function Layout() {
  const isDesktop = useBreakpoint(768);
  const { pathname } = useLocation();

  const currentItem = navItems.find((item) => pathname.startsWith(item.to));
  const title = currentItem?.label ?? 'WC Bets';

  if (isDesktop) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopBar title={title} />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

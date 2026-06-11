import { Outlet, useLocation } from 'react-router-dom';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { MobileSaveBarSlot, MobileSaveBarSlotProvider } from '@/contexts/MobileSaveBarSlotContext';
import { UnsavedChangesProvider } from '@/contexts/UnsavedChangesContext';
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
      <MobileSaveBarSlotProvider>
        <UnsavedChangesProvider>
          <div className="flex h-app overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
              <Outlet />
            </main>
          </div>
        </UnsavedChangesProvider>
      </MobileSaveBarSlotProvider>
    );
  }

  return (
    <MobileSaveBarSlotProvider>
      <UnsavedChangesProvider>
        <div className="flex h-app flex-col overflow-hidden">
          <TopBar title={title} />
          <main className="min-h-0 flex-1 overflow-y-auto">
            <Outlet />
          </main>
          <MobileSaveBarSlot />
          <BottomNav />
        </div>
      </UnsavedChangesProvider>
    </MobileSaveBarSlotProvider>
  );
}

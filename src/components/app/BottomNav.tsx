import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { navItems } from './navItems';

export function BottomNav() {
  return (
    <nav className="shrink-0 border-t border-border bg-background/95 backdrop-blur safe-area-pb">
      <div className="flex">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 px-1 py-2 text-[10px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )
            }
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

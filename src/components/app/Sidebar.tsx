import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { WcLogo } from './WcLogo';
import { navItems } from './navItems';

export function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <WcLogo size={32} className="shrink-0 text-sidebar-primary" />
        <div>
          <p className="font-heading text-base font-bold uppercase leading-none tracking-wide text-sidebar-foreground">
            WC Bets
          </p>
          <p className="text-[10px] text-sidebar-foreground/50">World Cup 2026</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      {user && (
        <div className="border-t border-sidebar-border px-3 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
              {getInitials(user.first_name, user.last_name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-sidebar-foreground">
                {user.first_name} {user.last_name}
              </p>
              <p className="truncate text-[10px] text-sidebar-foreground/50">{user.email}</p>
            </div>
            <button
              onClick={() => void logout()}
              className="shrink-0 rounded p-1 text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

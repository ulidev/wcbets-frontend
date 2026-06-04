import { LogOut, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn, getInitials, getAvatarColor } from '@/lib/utils';
import type { components } from '@/types/api';

type Role = components['schemas']['Role'];

const ROLE_LABELS: Record<Role, string> = {
  PLAYER: 'Player',
  ADMIN: 'Admin',
  SUPERADMIN: 'Super Admin',
};

export default function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="flex flex-col">
      {/* Desktop header */}
      <div className="hidden border-b border-border px-6 py-5 md:block">
        <h1 className="text-xl font-bold">Profile</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Your account details</p>
      </div>

      <div className="flex flex-col items-center px-6 pt-12 pb-8">
        {/* Avatar */}
        <div
          className={cn(
            'flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white',
            getAvatarColor(user.id),
          )}
        >
          {getInitials(user.first_name, user.last_name)}
        </div>

        {/* Name + email */}
        <h2 className="mt-4 text-xl font-bold">
          {user.first_name} {user.last_name}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>

        {/* Role badge */}
        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
          <Shield className="h-3 w-3" />
          {ROLE_LABELS[user.role]}
        </span>

        {/* Divider */}
        <div className="mt-8 w-full max-w-sm border-t border-border" />

        {/* Sign out */}
        <button
          onClick={() => void logout()}
          className="mt-6 flex w-full max-w-sm items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}

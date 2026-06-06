import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Check, UserCheck, UserX, Users } from 'lucide-react';
import {
  approveUser,
  deactivateUser,
  fetchAllUsers,
  fetchPendingUsers,
} from '@/api/users';
import { useAuth } from '@/hooks/useAuth';
import { cn, getAvatarColor, getInitials } from '@/lib/utils';
import { wcBtnPrimary, wcFontBody } from '@/lib/wc-ui';
import type { components } from '@/types/api';

type UserAdminView = components['schemas']['UserAdminView'];
type Tab = 'pending' | 'all';

function UserRow({
  user,
  currentUserId,
  onApprove,
  onDeny,
  showScores,
  pending,
}: {
  user: UserAdminView;
  currentUserId: string;
  onApprove?: () => void;
  onDeny?: () => void;
  showScores?: boolean;
  pending?: boolean;
}) {
  const isSelf = user.id === currentUserId;

  return (
    <div className="flex flex-col gap-3 border-b border-wc-light-gray px-4 py-4 last:border-b-0 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white',
            getAvatarColor(user.id),
          )}
        >
          {getInitials(user.first_name, user.last_name)}
        </div>
        <div className="min-w-0">
          <p className={cn('truncate text-sm font-semibold uppercase', wcFontBody)}>
            {user.first_name} {user.last_name}
          </p>
          <p className="truncate text-xs text-wc-dark-gray">{user.email}</p>
          {!pending && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-wc-light-gray/60 px-2 py-0.5 text-[10px] font-semibold uppercase text-wc-dark-gray">
                {user.role}
              </span>
              {!user.approved && (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                  Pendiente
                </span>
              )}
              {!user.active && (
                <span className="rounded-full bg-wc-red/10 px-2 py-0.5 text-[10px] font-semibold text-wc-red">
                  Inactivo
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {showScores && (
        <div className="flex shrink-0 gap-3 text-center text-xs text-wc-dark-gray sm:gap-4">
          <div>
            <p className="font-bold text-wc-card-text">{user.match_prediction_score}</p>
            <p>MP</p>
          </div>
          <div>
            <p className="font-bold text-wc-card-text">{user.pickem_score}</p>
            <p>Pick&apos;em</p>
          </div>
          <div>
            <p className="font-bold text-wc-card-text">{user.crystal_ball_score}</p>
            <p>CB</p>
          </div>
        </div>
      )}

      {pending && !isSelf && (
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onDeny}
            className="inline-flex items-center gap-1.5 rounded-xl border border-wc-red/30 bg-white px-3 py-2 text-xs font-semibold text-wc-red transition-colors hover:bg-wc-red/5"
          >
            <UserX className="h-3.5 w-3.5" />
            Denegar
          </button>
          <button
            type="button"
            onClick={onApprove}
            className={cn(wcBtnPrimary, 'inline-flex items-center gap-1.5 text-xs')}
          >
            <Check className="h-3.5 w-3.5" />
            Aceptar
          </button>
        </div>
      )}
    </div>
  );
}

export function AdminUsersPanel() {
  const { user: me } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('pending');
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    data: pending = [],
    isLoading: loadingPending,
    isError: errorPending,
  } = useQuery({
    queryKey: ['users-pending'],
    queryFn: fetchPendingUsers,
    staleTime: 30_000,
  });

  const {
    data: allUsers = [],
    isLoading: loadingAll,
    isError: errorAll,
  } = useQuery({
    queryKey: ['users-all'],
    queryFn: fetchAllUsers,
    staleTime: 60_000,
    enabled: tab === 'all',
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['users-pending'] });
    void queryClient.invalidateQueries({ queryKey: ['users-all'] });
  };

  const { mutate: approve, isPending: approving } = useMutation({
    mutationFn: approveUser,
    onSuccess: () => {
      setActionError(null);
      invalidate();
    },
    onError: () => setActionError('No s’ha pogut aprovar el compte.'),
  });

  const { mutate: deny, isPending: denying } = useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => {
      setActionError(null);
      invalidate();
    },
    onError: () => setActionError('No s’ha pogut denegar el compte.'),
  });

  if (!me) return null;

  const busy = approving || denying;
  const isLoading = tab === 'pending' ? loadingPending : loadingAll;
  const isError = tab === 'pending' ? errorPending : errorAll;
  const list = tab === 'pending' ? pending : allUsers;

  const handleApprove = (target: UserAdminView) => {
    if (
      !window.confirm(
        `Acceptar a ${target.first_name} ${target.last_name}? Podrà accedir al joc.`,
      )
    ) {
      return;
    }
    approve(target.id);
  };

  const handleDeny = (target: UserAdminView) => {
    if (
      !window.confirm(
        `Denegar a ${target.first_name} ${target.last_name}? El compte quedarà desactivat.`,
      )
    ) {
      return;
    }
    deny(target.id);
  };

  return (
    <section className="w-full">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-wc-card-text">Gestió de jugadors</h3>
        {pending.length > 0 && tab === 'pending' && (
          <span className="rounded-full bg-wc-red px-2 py-0.5 text-[10px] font-bold text-white">
            {pending.length} pendent{pending.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <div className="mb-3 flex border-b border-wc-light-gray">
        <button
          type="button"
          onClick={() => setTab('pending')}
          className={cn('wc-tab', tab === 'pending' && 'wc-tab-active')}
        >
          {pending.length > 0 ? `Pendents (${pending.length})` : 'Pendents'}
        </button>
        <button
          type="button"
          onClick={() => setTab('all')}
          className={cn('wc-tab', tab === 'all' && 'wc-tab-active')}
        >
          Tots
        </button>
      </div>

      {actionError && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-wc-red/20 bg-wc-red/5 px-3 py-2 text-sm text-wc-red">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {actionError}
        </div>
      )}

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-wc-light-gray/40" />
          ))}
        </div>
      )}

      {!isLoading && isError && (
        <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
          <AlertCircle className="h-8 w-8" />
          <p className="text-sm">No s’han pogut carregar els usuaris.</p>
        </div>
      )}

      {!isLoading && !isError && list.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-[18px] border border-wc-light-gray bg-white py-10 text-center text-muted-foreground">
          {tab === 'pending' ? (
            <>
              <UserCheck className="h-8 w-8 text-wc-green" />
              <p className="text-sm font-medium">Cap sol·licitud pendent</p>
              <p className="text-xs">Quan algú es registri, apareixerà aquí.</p>
            </>
          ) : (
            <>
              <Users className="h-8 w-8" />
              <p className="text-sm">No hi ha usuaris.</p>
            </>
          )}
        </div>
      )}

      {!isLoading && !isError && list.length > 0 && (
        <div
          className={cn(
            'overflow-hidden rounded-[18px] border border-wc-light-gray bg-white shadow-sm',
            busy && 'pointer-events-none opacity-70',
          )}
        >
          {list.map((u) => (
            <UserRow
              key={u.id}
              user={u}
              currentUserId={me.id}
              pending={tab === 'pending'}
              showScores={tab === 'all'}
              onApprove={() => handleApprove(u)}
              onDeny={() => handleDeny(u)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Check, UserCheck, UserX, Users } from 'lucide-react';
import {
  approveUser,
  assignUserGroup,
  deactivateUser,
  fetchAllUsers,
  fetchPendingUsers,
} from '@/api/users';
import { listUserGroups } from '@/api/user-groups';
import { useAuth } from '@/hooks/useAuth';
import { cn, getAvatarColor, getInitials } from '@/lib/utils';
import { wcBtnPrimary, wcFontBody } from '@/lib/wc-ui';
import type { components } from '@/types/api';

type UserAdminView = components['schemas']['UserAdminView'];
type UserGroupResponse = components['schemas']['UserGroupResponse'];
type Tab = 'pending' | 'all';

function GroupSelect({
  groups,
  value,
  onChange,
}: {
  groups: UserGroupResponse[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring"
    >
      <option value="">Sin grupo</option>
      {groups.map((g) => (
        <option key={g.id} value={g.id}>
          {g.name}
        </option>
      ))}
    </select>
  );
}

function PendingUserRow({
  user,
  groups,
  onApprove,
  onDeny,
  busy,
}: {
  user: UserAdminView;
  groups: UserGroupResponse[];
  onApprove: (groupId: string | null) => void;
  onDeny: () => void;
  busy: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('');

  return (
    <div className="border-b border-wc-light-gray px-4 py-4 last:border-b-0">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white',
            getAvatarColor(user.id),
          )}
        >
          {getInitials(user.first_name, user.last_name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn('truncate text-sm font-semibold uppercase', wcFontBody)}>
            {user.first_name} {user.last_name}
          </p>
          <p className="truncate text-xs text-wc-dark-gray">{user.email}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onDeny}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-xl border border-wc-red/30 bg-white px-3 py-2 text-xs font-semibold text-wc-red transition-colors hover:bg-wc-red/5 disabled:opacity-50"
          >
            <UserX className="h-3.5 w-3.5" />
            Denegar
          </button>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            disabled={busy}
            className={cn(wcBtnPrimary, 'inline-flex items-center gap-1.5 text-xs disabled:opacity-50')}
          >
            <Check className="h-3.5 w-3.5" />
            Aceptar
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-wc-light-gray/30 px-3 py-3">
          <span className="text-xs font-medium text-wc-card-text">Grup:</span>
          <GroupSelect groups={groups} value={selectedGroup} onChange={setSelectedGroup} />
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              onApprove(selectedGroup || null);
              setExpanded(false);
            }}
            className={cn(wcBtnPrimary, 'inline-flex items-center gap-1 text-xs disabled:opacity-50')}
          >
            <Check className="h-3 w-3" />
            Confirmar
          </button>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-xs text-wc-dark-gray underline"
          >
            Cancel·lar
          </button>
        </div>
      )}
    </div>
  );
}

function AllUserRow({
  user,
  currentUserId,
  groups,
  onAssignGroup,
  busy,
}: {
  user: UserAdminView;
  currentUserId: string;
  groups: UserGroupResponse[];
  onAssignGroup: (userId: string, groupId: string | null) => void;
  busy: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(user.group?.id ?? '');
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
        </div>
      </div>

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

      {!isSelf && (
        <div className="shrink-0">
          {editing ? (
            <div className="flex items-center gap-2">
              <GroupSelect groups={groups} value={selectedGroup} onChange={setSelectedGroup} />
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  onAssignGroup(user.id, selectedGroup || null);
                  setEditing(false);
                }}
                className={cn(wcBtnPrimary, 'px-2 py-1.5 text-xs disabled:opacity-50')}
              >
                OK
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedGroup(user.group?.id ?? '');
                  setEditing(false);
                }}
                className="text-xs text-wc-dark-gray underline"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg border border-wc-light-gray px-2 py-1.5 text-xs text-wc-dark-gray hover:bg-wc-light-gray/30"
            >
              {user.group ? user.group.name : 'Sense grup'}
            </button>
          )}
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

  const { data: groups = [] } = useQuery({
    queryKey: ['user-groups'],
    queryFn: listUserGroups,
    staleTime: 60_000,
  });

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
    mutationFn: ({ userId, groupId }: { userId: string; groupId: string | null }) =>
      approveUser(userId, groupId),
    onSuccess: () => {
      setActionError(null);
      invalidate();
    },
    onError: () => setActionError('No s\'ha pogut aprovar el compte.'),
  });

  const { mutate: assignGroup, isPending: assigningGroup } = useMutation({
    mutationFn: ({ userId, groupId }: { userId: string; groupId: string | null }) =>
      assignUserGroup(userId, groupId),
    onSuccess: () => {
      setActionError(null);
      invalidate();
    },
    onError: () => setActionError('No s\'ha pogut canviar el grup.'),
  });

  const { mutate: deny, isPending: denying } = useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => {
      setActionError(null);
      invalidate();
    },
    onError: () => setActionError('No s\'ha pogut denegar el compte.'),
  });

  if (!me) return null;

  const busy = approving || denying || assigningGroup;
  const isLoading = tab === 'pending' ? loadingPending : loadingAll;
  const isError = tab === 'pending' ? errorPending : errorAll;

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
          <p className="text-sm">No s'han pogut carregar els usuaris.</p>
        </div>
      )}

      {!isLoading && !isError && tab === 'pending' && (
        <>
          {pending.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-[18px] border border-wc-light-gray bg-white py-10 text-center text-muted-foreground">
              <UserCheck className="h-8 w-8 text-wc-green" />
              <p className="text-sm font-medium">Cap sol·licitud pendent</p>
              <p className="text-xs">Quan algú es registri, apareixerà aquí.</p>
            </div>
          ) : (
            <div
              className={cn(
                'overflow-hidden rounded-[18px] border border-wc-light-gray bg-white shadow-sm',
                busy && 'pointer-events-none opacity-70',
              )}
            >
              {pending.map((u) => (
                <PendingUserRow
                  key={u.id}
                  user={u}
                  groups={groups}
                  busy={busy}
                  onApprove={(groupId) => approve({ userId: u.id, groupId })}
                  onDeny={() => deny(u.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {!isLoading && !isError && tab === 'all' && (
        <>
          {allUsers.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-[18px] border border-wc-light-gray bg-white py-10 text-center text-muted-foreground">
              <Users className="h-8 w-8" />
              <p className="text-sm">No hi ha usuaris.</p>
            </div>
          ) : (
            <div
              className={cn(
                'overflow-hidden rounded-[18px] border border-wc-light-gray bg-white shadow-sm',
                busy && 'pointer-events-none opacity-70',
              )}
            >
              {allUsers.map((u) => (
                <AllUserRow
                  key={u.id}
                  user={u}
                  currentUserId={me.id}
                  groups={groups}
                  busy={busy}
                  onAssignGroup={(userId, groupId) => assignGroup({ userId, groupId })}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

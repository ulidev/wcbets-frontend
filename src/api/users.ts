import type { components } from '@/types/api';
import { api } from './client';

type UserAdminView = components['schemas']['UserAdminView'];

export const fetchPendingUsers = (): Promise<UserAdminView[]> =>
  api.get('api/v1/users/pending').json<UserAdminView[]>();

export const fetchAllUsers = (): Promise<UserAdminView[]> =>
  api.get('api/v1/users').json<UserAdminView[]>();

export const approveUser = (userId: string, group?: string | null): Promise<void> =>
  api.patch(`api/v1/users/${userId}/approve`, { json: { group: group ?? null } }).then(() => undefined);

export const assignUserGroup = (userId: string, group: string | null): Promise<void> =>
  api.patch(`api/v1/users/${userId}/group`, { json: { group } }).then(() => undefined);

export const deactivateUser = (userId: string): Promise<void> =>
  api.patch(`api/v1/users/${userId}/deactivate`).then(() => undefined);

import type { components } from '@/types/api';
import { api } from './client';

type UserGroupResponse = components['schemas']['UserGroupResponse'];

export const listUserGroups = (): Promise<UserGroupResponse[]> =>
  api.get('api/v1/user-groups').json<UserGroupResponse[]>();

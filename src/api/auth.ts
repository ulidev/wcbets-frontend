import type { components } from '@/types/api';
import { api, clearToken } from './client';

type LoginRequest = components['schemas']['LoginRequest'];
type RegisterRequest = components['schemas']['RegisterRequest'];
type TokenResponse = components['schemas']['TokenResponse'];
type UserResponse = components['schemas']['UserResponse'];

export async function login(credentials: LoginRequest): Promise<TokenResponse> {
  return api.post('api/v1/auth/login', { json: credentials }).json<TokenResponse>();
}

export async function register(data: RegisterRequest): Promise<UserResponse> {
  return api.post('api/v1/auth/register', { json: data }).json<UserResponse>();
}

export async function logout(): Promise<void> {
  try {
    await api.post('api/v1/auth/logout');
  } catch {
    // best-effort
  }
  clearToken();
}

export async function getMe(): Promise<UserResponse> {
  return api.get('api/v1/users/me').json<UserResponse>();
}

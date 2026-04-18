import { apiPost, apiGet, setAuthToken, getAuthToken } from '@/data/repositories/http/apiClient';
import type { Role } from './roles';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  onboarded?: string;
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

export async function signup(email: string, password: string, name: string, role?: string): Promise<AuthResponse> {
  const res = await apiPost<AuthResponse>('/auth/signup', { email, password, name, role });
  setAuthToken(res.data.token);
  return res.data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await apiPost<AuthResponse>('/auth/login', { email, password });
  setAuthToken(res.data.token);
  return res.data;
}

export async function getMe(): Promise<AuthUser | null> {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const res = await apiGet<AuthUser>('/auth/me');
    return res.data;
  } catch {
    setAuthToken(null);
    return null;
  }
}

export function logout() {
  setAuthToken(null);
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

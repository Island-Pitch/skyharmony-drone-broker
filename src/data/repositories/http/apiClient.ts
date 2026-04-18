/** Shared HTTP client for all API calls. Handles JWT token and response envelope. */

let authToken: string | null = null;
let tokenLoaded = false;

function loadToken() {
  if (!tokenLoaded) {
    try { authToken = localStorage.getItem('skyharmony_token'); } catch { /* SSR/test */ }
    tokenLoaded = true;
  }
}

export function setAuthToken(token: string | null) {
  authToken = token;
  tokenLoaded = true;
  try {
    if (token) {
      localStorage.setItem('skyharmony_token', token);
    } else {
      localStorage.removeItem('skyharmony_token');
    }
  } catch { /* SSR/test */ }
}

export function getAuthToken(): string | null {
  loadToken();
  return authToken;
}

interface ApiResponse<T> {
  data: T;
  error?: { message: string; type?: string };
  meta?: { total?: number; page?: number; per_page?: number; total_pages?: number };
}

async function handleResponse<T>(res: Response): Promise<ApiResponse<T>> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(body.error?.message ?? `API error: ${res.status}`);
  }
  return res.json();
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  };

  loadToken();
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(`/api${path}`, { ...options, headers });
  return handleResponse<T>(res);
}

export async function apiGet<T>(path: string): Promise<ApiResponse<T>> {
  return apiFetch<T>(path);
}

export async function apiPost<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  return apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

export async function apiPatch<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  return apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
}

export async function apiDelete(path: string): Promise<void> {
  await apiFetch(path, { method: 'DELETE' });
}

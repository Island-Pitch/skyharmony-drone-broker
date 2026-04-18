import '@testing-library/jest-dom/vitest';
import { setAuthToken } from '@/data/repositories/http/apiClient';

// Set a fake auth token so RequireAuth passes in tests
setAuthToken('test-token');

// Mock fetch to return 503 for /api/health so DataProvider falls back to demo mode,
// and mock /api/auth/me to return a test user
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (url.includes('/api/health')) {
    return new Response(null, { status: 503 });
  }
  if (url.includes('/api/auth/me')) {
    return new Response(JSON.stringify({
      data: {
        id: 'a0000000-0000-4000-8000-000000000001',
        email: 'admin@test.dev',
        name: 'Test Admin',
        role: 'CentralRepoAdmin',
      },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  return originalFetch(input, init);
};

import '@testing-library/jest-dom/vitest';

// Mock fetch to return 503 for /api/health so DataProvider falls back to demo mode immediately
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (url.includes('/api/health')) {
    return new Response(null, { status: 503 });
  }
  return originalFetch(input, init);
};

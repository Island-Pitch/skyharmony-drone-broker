import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import './theme/global.css';
import posthog from './lib/posthog';
import { PostHogProvider, PostHogErrorBoundary } from '@posthog/react';

// Redirect www.skyharmony.net → skyharmony.net
if (location.hostname === 'www.skyharmony.net') {
  location.replace(`https://skyharmony.net${location.pathname}${location.search}${location.hash}`);
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <PostHogProvider client={posthog}>
        <PostHogErrorBoundary
          fallback={
            <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
              <h1 style={{ margin: 0, fontSize: 20 }}>Something went wrong</h1>
              <p style={{ marginTop: 12, lineHeight: 1.5 }}>
                Please refresh the page. If this keeps happening, contact support.
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  marginTop: 12,
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'inherit',
                  cursor: 'pointer',
                }}
              >
                Reload
              </button>
            </div>
          }
        >
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </PostHogErrorBoundary>
      </PostHogProvider>
    </StrictMode>,
  );
}

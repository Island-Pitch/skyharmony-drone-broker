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
        <PostHogErrorBoundary>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </PostHogErrorBoundary>
      </PostHogProvider>
    </StrictMode>,
  );
}

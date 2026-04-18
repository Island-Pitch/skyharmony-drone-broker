import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { appRoutes } from './routing/appRoutes';
import { routeComponents } from './routing/routeComponents';
import { PlaceholderPage } from './components/PlaceholderPage';
import { LandingPage } from './features/landing/LandingPage';
import { LoginPage } from './features/auth/LoginPage';
import { PrivacyPage } from './features/legal/PrivacyPage';
import { TermsPage } from './features/legal/TermsPage';
import { AccessibilityPage } from './features/legal/AccessibilityPage';
import { AuthProvider } from './auth/AuthContext';
import { DataProvider } from './providers/DataProvider';

export function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/accessibility" element={<AccessibilityPage />} />
          <Route element={<AppLayout routes={appRoutes} />}>
            {appRoutes.map((route) => {
              const Component = routeComponents[route.path] ?? PlaceholderPage;
              return (
                <Route
                  key={route.path}
                  path={route.path}
                  element={<Component />}
                />
              );
            })}
          </Route>
        </Routes>
      </DataProvider>
    </AuthProvider>
  );
}

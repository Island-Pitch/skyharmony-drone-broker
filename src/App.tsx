import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { RequireAuth } from './components/RequireAuth';
import { RouteGuard } from './auth/RouteGuard';
import { appRoutes } from './routing/appRoutes';
import { routeComponents } from './routing/routeComponents';
import { PlaceholderPage } from './components/PlaceholderPage';
import { LandingPage } from './features/landing/LandingPage';
import { LoginPage } from './features/auth/LoginPage';
import { OnboardingWizard } from './features/auth/OnboardingWizard';
import { PrivacyPage } from './features/legal/PrivacyPage';
import { TermsPage } from './features/legal/TermsPage';
import { AccessibilityPage } from './features/legal/AccessibilityPage';
import { AuthProvider } from './auth/AuthContext';
import { DataProvider } from './providers/DataProvider';

export function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes — no DataProvider, no auth required */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={<DataProvider><OnboardingWizard /></DataProvider>} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/accessibility" element={<AccessibilityPage />} />

        {/* Protected routes — DataProvider + auth required */}
        <Route element={<RequireAuth><DataProvider><AppLayout routes={appRoutes} /></DataProvider></RequireAuth>}>
          {appRoutes.map((route) => {
            const Component = routeComponents[route.path] ?? PlaceholderPage;
            const element = route.permission ? (
              <RouteGuard permission={route.permission}>
                <Component />
              </RouteGuard>
            ) : (
              <Component />
            );
            return (
              <Route
                key={route.path}
                path={route.path}
                element={element}
              />
            );
          })}
        </Route>
      </Routes>
    </AuthProvider>
  );
}

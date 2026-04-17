import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { appRoutes } from './routing/appRoutes';
import { routeComponents } from './routing/routeComponents';
import { PlaceholderPage } from './components/PlaceholderPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
  );
}

import { Outlet, NavLink } from 'react-router-dom';
import type { AppRoute } from '@/routing/appRoutes';

interface AppLayoutProps {
  routes: AppRoute[];
}

export function AppLayout({ routes }: AppLayoutProps) {
  const sideRoutes = routes.filter((r) => r.nav.includes('side'));

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>SkyHarmony</h1>
          <span className="subtitle">Drone Broker</span>
        </div>
        <nav className="sidebar-nav">
          {sideRoutes.map((route) => (
            <NavLink
              key={route.path}
              to={`/${route.path}`}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <span className="nav-icon">{route.icon}</span>
              <span className="nav-label">{route.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import type { AppRoute } from '@/routing/appRoutes';
import { NavIcon } from './NavIcon';
import { DemoWatermark } from './DemoWatermark';
import { useAuth } from '@/auth/useAuth';
import { logout, isAuthenticated } from '@/auth/authService';

interface AppLayoutProps {
  routes: AppRoute[];
}

function KoruIcon({ size = 28, color = '#D4A843' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M24 44C24 44 8 36 8 22C8 13.2 14.4 6 24 6C33.6 6 40 13.2 40 22C40 28 36 32 30 32C24 32 21 28 21 24C21 20 23 18 26 18C29 18 30 20 30 22" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function AppLayout({ routes }: AppLayoutProps) {
  const { user, role, hasPermission } = useAuth();
  // Only show nav items the user has permission for
  const sideRoutes = routes.filter(
    (r) => r.nav.includes('side') && (!r.permission || hasPermission(r.permission)),
  );
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <KoruIcon size={28} />
            <div>
              <h1>SkyHarmony</h1>
              <span className="subtitle">Drone Broker</span>
              <div className="tagline">Whakarite | Coordinate</div>
            </div>
          </div>
        </div>
        <div className="sidebar-kowhaiwhai" aria-hidden="true" />
        <nav className="sidebar-nav">
          {sideRoutes.map((route) => (
            <NavLink
              key={route.path}
              to={`/${route.path}`}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <span className="nav-icon"><NavIcon name={route.icon} /></span>
              <span className="nav-label">{route.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          {isAuthenticated() && (
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{user.name}</span>
                <span className="sidebar-user-role">{
                  { CentralRepoAdmin: 'Admin', OperatorAdmin: 'Fleet Owner', OperatorStaff: 'Operator', LogisticsStaff: 'Logistics', SystemAI: 'System' }[role] ?? role
                }</span>
              </div>
            </div>
          )}
          <button className="sidebar-logout" onClick={handleLogout} type="button">
            <NavIcon name="log-out" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
      <nav className="mobile-nav">
        {sideRoutes.slice(0, 4).map((route) => (
          <NavLink
            key={route.path}
            to={`/${route.path}`}
            className={({ isActive }) =>
              `mobile-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <NavIcon name={route.icon} />
            <span>{route.label}</span>
          </NavLink>
        ))}
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
      <DemoWatermark />
    </div>
  );
}

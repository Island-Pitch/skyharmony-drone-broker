import { Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { Role } from '@/auth/roles';
import { Permission } from '@/auth/roles';
import { RouteGuard } from '@/auth/RouteGuard';
import { Dashboard } from './Dashboard';

/**
 * Admin dashboard wrapper with RBAC.
 * - CentralRepoAdmin sees the full dashboard.
 * - OperatorAdmin is redirected to /operator/dashboard.
 * - Others get a 403 via RouteGuard.
 */
export function AdminDashboard() {
  const { role } = useAuth();

  if (role === Role.OperatorAdmin) {
    return <Navigate to="/operator/dashboard" replace />;
  }

  return (
    <RouteGuard permission={Permission.FleetSummary}>
      <Dashboard />
    </RouteGuard>
  );
}

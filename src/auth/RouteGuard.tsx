import type { ReactNode } from 'react';
import { useAuth } from './useAuth';
import type { Permission } from './roles';

interface RouteGuardProps {
  permission: Permission;
  children: ReactNode;
}

export function RouteGuard({ permission, children }: RouteGuardProps) {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return (
      <div className="page forbidden">
        <h2>403 — Forbidden</h2>
        <p>You do not have permission to access this resource.</p>
      </div>
    );
  }

  return <>{children}</>;
}

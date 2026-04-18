import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '@/auth/authService';
import type { ReactNode } from 'react';

export function RequireAuth({ children }: { children: ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

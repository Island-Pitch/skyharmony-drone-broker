import { createContext, useState, useCallback, type ReactNode } from 'react';
import { Role, Permission, hasPermission as checkPermission } from './roles';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthContextValue {
  user: User;
  role: Role;
  setRole: (role: Role) => void;
  hasPermission: (permission: Permission) => boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const DEFAULT_USER: User = {
  id: crypto.randomUUID(),
  name: 'Demo Admin',
  email: 'admin@skyharmony.dev',
};

interface AuthProviderProps {
  children: ReactNode;
  initialRole?: Role;
}

export function AuthProvider({
  children,
  initialRole = Role.CentralRepoAdmin,
}: AuthProviderProps) {
  const [role, setRole] = useState<Role>(initialRole);

  const hasPermission = useCallback(
    (permission: Permission) => checkPermission(role, permission),
    [role],
  );

  return (
    <AuthContext.Provider value={{ user: DEFAULT_USER, role, setRole, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

import { createContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { Role, Permission, hasPermission as checkPermission } from './roles';
import { getMe, isAuthenticated, type AuthUser } from './authService';

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
  name: 'Guest',
  email: '',
};

interface AuthProviderProps {
  children: ReactNode;
  initialRole?: Role;
}

export function AuthProvider({
  children,
  initialRole = Role.CentralRepoAdmin,
}: AuthProviderProps) {
  const [user, setUser] = useState<User>(DEFAULT_USER);
  const [role, setRole] = useState<Role>(initialRole);

  useEffect(() => {
    if (!isAuthenticated()) return;
    getMe().then((me: AuthUser | null) => {
      if (me) {
        setUser({ id: me.id, name: me.name, email: me.email });
        setRole(me.role as Role);
      }
    });
  }, []);

  const hasPermission = useCallback(
    (permission: Permission) => checkPermission(role, permission),
    [role],
  );

  return (
    <AuthContext.Provider value={{ user, role, setRole, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

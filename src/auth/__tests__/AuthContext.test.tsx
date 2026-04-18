import { render, screen, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AuthProvider } from '../AuthContext';
import { useAuth } from '../useAuth';
import { Role, Permission } from '../roles';

function TestConsumer() {
  const { user, role, hasPermission, setRole } = useAuth();
  return (
    <div>
      <span data-testid="user-id">{user.id}</span>
      <span data-testid="role">{role}</span>
      <span data-testid="can-create">{hasPermission(Permission.AssetCreate).toString()}</span>
      <button onClick={() => setRole(Role.OperatorAdmin)}>Switch Role</button>
    </div>
  );
}

describe('AuthContext', () => {
  it('provides a default user with CentralRepoAdmin role', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId('user-id').textContent).toBeTruthy();
    expect(screen.getByTestId('role').textContent).toBe(Role.CentralRepoAdmin);
    expect(screen.getByTestId('can-create').textContent).toBe('true');
  });

  it('allows switching roles', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    act(() => {
      screen.getByText('Switch Role').click();
    });

    expect(screen.getByTestId('role').textContent).toBe(Role.OperatorAdmin);
    expect(screen.getByTestId('can-create').textContent).toBe('false');
  });

  it('supports initial role override', () => {
    render(
      <AuthProvider initialRole={Role.OperatorStaff}>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId('role').textContent).toBe(Role.OperatorStaff);
  });
});

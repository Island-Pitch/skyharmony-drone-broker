import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../AuthContext';
import { RouteGuard } from '../RouteGuard';
import { Role, Permission } from '../roles';

function renderWithAuth(
  permission: Permission,
  role: Role = Role.CentralRepoAdmin,
) {
  return render(
    <MemoryRouter>
      <AuthProvider initialRole={role}>
        <RouteGuard permission={permission}>
          <div data-testid="protected-content">Secret Content</div>
        </RouteGuard>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('RouteGuard', () => {
  it('renders children when user has required permission', () => {
    renderWithAuth(Permission.AssetCreate, Role.CentralRepoAdmin);
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('shows 403 when user lacks required permission', () => {
    renderWithAuth(Permission.AssetCreate, Role.OperatorAdmin);
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByText(/forbidden/i)).toBeInTheDocument();
  });

  it('renders children for read permission with OperatorStaff', () => {
    renderWithAuth(Permission.AssetRead, Role.OperatorStaff);
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('blocks delete permission for OperatorStaff', () => {
    renderWithAuth(Permission.AssetDelete, Role.OperatorStaff);
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByText(/forbidden/i)).toBeInTheDocument();
  });
});

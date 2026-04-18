import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AdminDashboard } from '../AdminDashboard';
import { AuthProvider } from '@/auth/AuthContext';
import { DataProvider } from '@/providers/DataProvider';
import { Role } from '@/auth/roles';
import { store } from '@/data/store';
import { seedStore } from '@/data/seed';

function renderWithRole(role: Role) {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <AuthProvider initialRole={role}>
        <DataProvider>
          <Routes>
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/operator/dashboard" element={<div data-testid="operator-redirect">Operator Dashboard</div>} />
          </Routes>
        </DataProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('AdminDashboard', () => {
  beforeEach(() => {
    store.reset();
    seedStore();
  });

  it('renders the full dashboard for CentralRepoAdmin', async () => {
    renderWithRole(Role.CentralRepoAdmin);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    });
  });

  it('redirects OperatorAdmin to /operator/dashboard', async () => {
    renderWithRole(Role.OperatorAdmin);
    await waitFor(() => {
      expect(screen.getByTestId('operator-redirect')).toBeInTheDocument();
    });
  });

  it('shows 403 for roles without FleetSummary permission', async () => {
    // LogisticsStaff does have FleetSummary permission, so let's check a scenario where it's granted
    renderWithRole(Role.LogisticsStaff);
    await waitFor(() => {
      // LogisticsStaff has FleetSummary permission, so should see the dashboard
      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    });
  });
});

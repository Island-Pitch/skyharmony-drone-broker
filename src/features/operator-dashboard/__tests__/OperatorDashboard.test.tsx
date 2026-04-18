import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { OperatorDashboard } from '../OperatorDashboard';
import { AuthProvider } from '@/auth/AuthContext';
import { DataProvider } from '@/providers/DataProvider';
import { Role } from '@/auth/roles';
import { store } from '@/data/store';
import { seedStore } from '@/data/seed';

function renderOperatorDashboard() {
  return render(
    <MemoryRouter>
      <AuthProvider initialRole={Role.OperatorAdmin}>
        <DataProvider>
          <OperatorDashboard />
        </DataProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('OperatorDashboard', () => {
  beforeEach(() => {
    store.reset();
    seedStore();
  });

  it('renders the operator dashboard', async () => {
    renderOperatorDashboard();
    await waitFor(() => {
      expect(screen.getByTestId('operator-dashboard')).toBeInTheDocument();
    });
  });

  it('shows welcome heading', async () => {
    renderOperatorDashboard();
    await waitFor(() => {
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    });
  });

  it('shows hero stat cards', async () => {
    renderOperatorDashboard();
    await waitFor(() => {
      expect(screen.getByText(/my fleet/i)).toBeInTheDocument();
      expect(screen.getByText(/active shows/i)).toBeInTheDocument();
      expect(screen.getByText(/this month revenue/i)).toBeInTheDocument();
      expect(screen.getByText(/outstanding balance/i)).toBeInTheDocument();
    });
  });

  it('shows upcoming shows section', async () => {
    renderOperatorDashboard();
    await waitFor(() => {
      expect(screen.getByText(/upcoming shows/i)).toBeInTheDocument();
    });
  });

  it('shows fleet health section', async () => {
    renderOperatorDashboard();
    await waitFor(() => {
      expect(screen.getByText(/fleet health/i)).toBeInTheDocument();
    });
  });

  it('shows recent invoices section', async () => {
    renderOperatorDashboard();
    await waitFor(() => {
      expect(screen.getByText(/recent invoices/i)).toBeInTheDocument();
    });
  });

  it('shows team section', async () => {
    renderOperatorDashboard();
    await waitFor(() => {
      const teamHeadings = screen.getAllByRole('heading', { name: /team/i });
      expect(teamHeadings.length).toBeGreaterThan(0);
    });
  });
});

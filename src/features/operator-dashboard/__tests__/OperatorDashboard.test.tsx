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

  it('shows operator dashboard heading', async () => {
    renderOperatorDashboard();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /operator dashboard/i })).toBeInTheDocument();
    });
  });

  it('shows simplified stats', async () => {
    renderOperatorDashboard();
    await waitFor(() => {
      expect(screen.getByText(/available drones/i)).toBeInTheDocument();
      expect(screen.getByText(/your bookings/i)).toBeInTheDocument();
      expect(screen.getByText(/utilization/i)).toBeInTheDocument();
    });
  });

  it('shows active bookings table', async () => {
    renderOperatorDashboard();
    await waitFor(() => {
      expect(screen.getByText(/your active bookings/i)).toBeInTheDocument();
    });
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from '../Dashboard';
import { AuthProvider } from '@/auth/AuthContext';
import { DataProvider } from '@/providers/DataProvider';
import { store } from '@/data/store';
import { seedStore } from '@/data/seed';

function renderDashboard() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <DataProvider>
          <Dashboard />
        </DataProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('Dashboard', () => {
  beforeEach(() => {
    store.reset();
    seedStore();
  });

  it('renders dashboard heading', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    });
  });

  it('renders fleet summary stats', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/total assets/i)).toBeInTheDocument();
      expect(screen.getByText(/available/i)).toBeInTheDocument();
    });
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ScanPage } from '../ScanPage';
import { AuthProvider } from '@/auth/AuthContext';
import { DataProvider } from '@/providers/DataProvider';
import { Role } from '@/auth/roles';
import { store } from '@/data/store';
import { seedStore } from '@/data/seed';

function renderScanPage(role: Role = Role.OperatorStaff) {
  // Ensure store is seeded
  store.reset();
  seedStore();

  return render(
    <MemoryRouter>
      <AuthProvider initialRole={role}>
        <DataProvider>
          <ScanPage />
        </DataProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('ScanPage', () => {
  it('renders the scan page heading', async () => {
    renderScanPage();
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /scan check-in.*check-out/i }),
      ).toBeInTheDocument();
    });
  });

  it('renders the QR scanner input', async () => {
    renderScanPage();
    await waitFor(() => {
      expect(screen.getByLabelText(/serial number/i)).toBeInTheDocument();
    });
  });

  it('renders for OperatorStaff role', async () => {
    renderScanPage(Role.OperatorStaff);
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /scan check-in.*check-out/i }),
      ).toBeInTheDocument();
    });
  });

  it('renders for LogisticsStaff role', async () => {
    renderScanPage(Role.LogisticsStaff);
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /scan check-in.*check-out/i }),
      ).toBeInTheDocument();
    });
  });

  it('shows forbidden for SystemAI role', () => {
    renderScanPage(Role.SystemAI);
    expect(screen.getByText(/403/)).toBeInTheDocument();
  });

  it('renders for CentralRepoAdmin role', async () => {
    renderScanPage(Role.CentralRepoAdmin);
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /scan check-in.*check-out/i }),
      ).toBeInTheDocument();
    });
  });
});

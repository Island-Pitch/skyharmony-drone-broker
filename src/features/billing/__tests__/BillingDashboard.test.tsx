import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import { DataProvider } from '@/providers/DataProvider';
import { BillingDashboard } from '../BillingDashboard';

function renderBilling() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <DataProvider>
          <BillingDashboard />
        </DataProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('BillingDashboard (SHD-52)', () => {
  it('renders the billing heading', async () => {
    renderBilling();
    expect(screen.getByRole('heading', { name: /Billing/i })).toBeInTheDocument();
  });

  it('displays revenue breakdown', async () => {
    renderBilling();
    await waitFor(() => {
      expect(screen.getAllByText(/Allocation/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Standby/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('displays per-operator revenue rows', async () => {
    renderBilling();
    await waitFor(() => {
      expect(screen.getAllByText(/NightBrite Drones/i).length).toBeGreaterThanOrEqual(1);
    });
  });
});

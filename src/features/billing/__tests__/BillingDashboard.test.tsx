import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BillingDashboard } from '../BillingDashboard';

describe('BillingDashboard (SHD-52)', () => {
  it('renders the billing heading', async () => {
    render(<BillingDashboard />);
    expect(screen.getByRole('heading', { name: /Billing/i })).toBeInTheDocument();
  });

  it('displays revenue breakdown categories', async () => {
    render(<BillingDashboard />);
    await waitFor(() => {
      expect(screen.getAllByText(/Allocation Fee/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Standby Fee/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Insurance Pool/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('displays per-operator revenue rows', async () => {
    render(<BillingDashboard />);
    await waitFor(() => {
      expect(screen.getAllByText('NightBrite Drones').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Orion Skies').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders bar chart visualization', async () => {
    render(<BillingDashboard />);
    await waitFor(() => {
      const bars = document.querySelectorAll('[data-testid="revenue-bar"]');
      expect(bars.length).toBeGreaterThanOrEqual(5);
    });
  });
});

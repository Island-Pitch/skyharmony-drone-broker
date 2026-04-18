import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { App } from '../App';

/**
 * SHD-54: Demo click-through verification.
 * Navigates through Fleet -> Bookings -> Dashboard -> Billing -> Scan
 * and verifies no empty states or errors on any page with seeded data.
 */
describe('Demo click-through (SHD-54)', () => {
  const renderApp = (entry = '/dashboard') =>
    render(
      <MemoryRouter initialEntries={[entry]}>
        <App />
      </MemoryRouter>,
    );

  it('Dashboard renders meaningful content', async () => {
    renderApp('/dashboard');
    await waitFor(() => {
      expect(screen.getByText('Total Assets')).toBeInTheDocument();
    });
    // Should have numeric values, not 0 or empty
    expect(screen.queryByText('No assets')).not.toBeInTheDocument();
  });

  it('Fleet renders asset data table with rows', async () => {
    renderApp('/fleet');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Fleet/i })).toBeInTheDocument();
    });
    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      // header + at least some data rows
      expect(rows.length).toBeGreaterThan(1);
    });
  });

  it('Bookings page renders without errors', async () => {
    renderApp('/bookings');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Bookings/i })).toBeInTheDocument();
    });
  });

  it('Billing page renders revenue breakdown', async () => {
    renderApp('/billing');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Billing/i })).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getAllByText(/Allocation Fee/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('Scan page renders without errors', async () => {
    renderApp('/scan');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Scan/i })).toBeInTheDocument();
    });
  });

  it('can navigate between pages via sidebar links', async () => {
    const user = userEvent.setup();
    renderApp('/dashboard');

    await waitFor(() => {
      expect(screen.getByText('Total Assets')).toBeInTheDocument();
    });

    // Navigate to Fleet
    await user.click(screen.getByText('Fleet'));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Fleet/i })).toBeInTheDocument();
    });

    // Navigate to Billing
    await user.click(screen.getByText('Billing'));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Billing/i })).toBeInTheDocument();
    });

    // Navigate back to Dashboard
    await user.click(screen.getByText('Dashboard'));
    await waitFor(() => {
      expect(screen.getByText('Total Assets')).toBeInTheDocument();
    });
  });

  it('Dashboard page renders', async () => {
    renderApp('/dashboard');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    });
  });
});

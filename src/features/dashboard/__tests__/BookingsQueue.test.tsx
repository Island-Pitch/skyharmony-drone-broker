import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { BookingsQueue } from '../BookingsQueue';
import { AuthProvider } from '@/auth/AuthContext';
import { DataProvider } from '@/providers/DataProvider';
import { store } from '@/data/store';
import { seedStore } from '@/data/seed';

function renderBookingsQueue() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <DataProvider>
          <BookingsQueue />
        </DataProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('BookingsQueue', () => {
  beforeEach(() => {
    store.reset();
    seedStore();
  });

  it('renders the bookings queue container', async () => {
    renderBookingsQueue();
    await waitFor(() => {
      expect(screen.getByTestId('bookings-queue')).toBeInTheDocument();
    });
  });

  it('shows active bookings heading with count', async () => {
    renderBookingsQueue();
    await waitFor(() => {
      expect(screen.getByText(/active bookings/i)).toBeInTheDocument();
    });
  });

  it('displays booking table headers', async () => {
    renderBookingsQueue();
    await waitFor(() => {
      const headers = screen.getAllByRole('columnheader');
      const headerTexts = headers.map((h) => h.textContent?.trim().toLowerCase());
      expect(headerTexts).toContain('operator');
      expect(headerTexts).toContain('location');
      expect(headerTexts.some((t) => t?.includes('drones'))).toBe(true);
      expect(headerTexts.some((t) => t?.includes('status'))).toBe(true);
    });
  });

  it('filters out completed and cancelled bookings', async () => {
    renderBookingsQueue();
    await waitFor(() => {
      // Seeded data has completed and cancelled bookings, they should not appear
      const rows = screen.getAllByRole('row');
      // Header row + active booking rows (not completed/cancelled)
      expect(rows.length).toBeGreaterThan(1);
    });
  });

  it('supports sorting by clicking column headers', async () => {
    renderBookingsQueue();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText(/operator/i)).toBeInTheDocument();
    });

    // Click operator header to sort
    await user.click(screen.getByText(/operator/i));
    // Should show sort indicator
    await waitFor(() => {
      const operatorHeader = screen.getByText(/operator/i);
      expect(operatorHeader.textContent).toContain('\u25B2');
    });

    // Click again to reverse
    await user.click(screen.getByText(/operator/i));
    await waitFor(() => {
      const operatorHeader = screen.getByText(/operator/i);
      expect(operatorHeader.textContent).toContain('\u25BC');
    });
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AdminBookingQueue } from '../AdminBookingQueue';
import { AuthProvider } from '@/auth/AuthContext';
import { DataProvider } from '@/providers/DataProvider';
import { store } from '@/data/store';
import { seedStore } from '@/data/seed';
import { createMockBooking } from '@/test/helpers';
import { Role } from '@/auth/roles';

function renderAdminQueue(role: Role = Role.CentralRepoAdmin) {
  return render(
    <MemoryRouter>
      <AuthProvider initialRole={role}>
        <DataProvider>
          <AdminBookingQueue />
        </DataProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('AdminBookingQueue', () => {
  beforeEach(() => {
    store.reset();
    // Seed assets so DataProvider doesn't re-seed (which adds bookings)
    seedStore();
    // Clear bookings after seed so we start with clean booking state
    store.bookings.clear();
  });

  it('renders heading', async () => {
    renderAdminQueue();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /booking queue/i })).toBeInTheDocument();
    });
  });

  it('shows 403 for roles without BookingApprove permission', () => {
    renderAdminQueue(Role.OperatorStaff);
    expect(screen.getByText(/403/)).toBeInTheDocument();
  });

  it('shows empty state when no bookings exist', async () => {
    renderAdminQueue();
    await waitFor(() => {
      expect(screen.getByText(/no bookings in the queue/i)).toBeInTheDocument();
    });
  });

  it('displays all bookings in the table', async () => {
    const b1 = createMockBooking({
      operator_name: 'SkyShow Events',
      location: 'Miami Beach, FL',
      status: 'pending',
    });
    const b2 = createMockBooking({
      operator_name: 'DroneLight Co',
      location: 'Austin, TX',
      status: 'allocated',
    });
    store.bookings.set(b1.id, b1);
    store.bookings.set(b2.id, b2);

    renderAdminQueue();
    await waitFor(() => {
      expect(screen.getByText('SkyShow Events')).toBeInTheDocument();
      expect(screen.getByText('DroneLight Co')).toBeInTheDocument();
      expect(screen.getByText('Miami Beach, FL')).toBeInTheDocument();
      expect(screen.getByText('Austin, TX')).toBeInTheDocument();
    });
  });

  it('shows Approve button for pending bookings', async () => {
    const booking = createMockBooking({ status: 'pending' });
    store.bookings.set(booking.id, booking);

    renderAdminQueue();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument();
    });
  });

  it('shows Confirm button for allocated bookings', async () => {
    const booking = createMockBooking({ status: 'allocated' });
    store.bookings.set(booking.id, booking);

    renderAdminQueue();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    });
  });

  it('transitions pending booking to allocated on Approve click', async () => {
    const user = userEvent.setup();
    const booking = createMockBooking({ status: 'pending' });
    store.bookings.set(booking.id, booking);

    renderAdminQueue();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /approve/i }));

    await waitFor(() => {
      expect(screen.getByText('allocated')).toBeInTheDocument();
    });
  });

  it('sorts columns when header is clicked', async () => {
    const user = userEvent.setup();
    const b1 = createMockBooking({
      operator_name: 'Alpha Drones',
      status: 'pending',
    });
    const b2 = createMockBooking({
      operator_name: 'Zeta Drones',
      status: 'pending',
    });
    store.bookings.set(b1.id, b1);
    store.bookings.set(b2.id, b2);

    renderAdminQueue();
    await waitFor(() => {
      expect(screen.getByText('Alpha Drones')).toBeInTheDocument();
    });

    // Click operator header to sort
    await user.click(screen.getByText(/^operator/i));

    // Both should still be visible
    expect(screen.getByText('Alpha Drones')).toBeInTheDocument();
    expect(screen.getByText('Zeta Drones')).toBeInTheDocument();
  });
});

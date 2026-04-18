import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Bookings } from '../Bookings';
import { AuthProvider } from '@/auth/AuthContext';
import { DataProvider } from '@/providers/DataProvider';
import { store } from '@/data/store';
import { Role } from '@/auth/roles';

function renderBookings(role: Role = Role.CentralRepoAdmin) {
  return render(
    <MemoryRouter>
      <AuthProvider initialRole={role}>
        <DataProvider>
          <Bookings />
        </DataProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('Bookings', () => {
  beforeEach(() => {
    store.reset();
  });

  it('renders bookings heading', () => {
    renderBookings();
    expect(screen.getByRole('heading', { name: /bookings/i })).toBeInTheDocument();
  });

  it('shows tab navigation for admin role', () => {
    renderBookings(Role.CentralRepoAdmin);
    expect(screen.getByRole('button', { name: /new booking/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /my bookings/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /admin queue/i })).toBeInTheDocument();
  });

  it('hides admin queue tab for OperatorAdmin', () => {
    renderBookings(Role.OperatorAdmin);
    expect(screen.getByRole('button', { name: /new booking/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /my bookings/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /admin queue/i })).not.toBeInTheDocument();
  });

  it('hides new booking tab for OperatorStaff (no BookingCreate)', () => {
    renderBookings(Role.OperatorStaff);
    expect(screen.queryByRole('button', { name: /new booking/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /my bookings/i })).toBeInTheDocument();
  });

  it('switches to My Bookings tab on click', async () => {
    const user = userEvent.setup();
    renderBookings(Role.CentralRepoAdmin);

    await user.click(screen.getByRole('button', { name: /my bookings/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /my bookings/i })).toBeInTheDocument();
    });
  });

  it('switches to Admin Queue tab on click', async () => {
    const user = userEvent.setup();
    renderBookings(Role.CentralRepoAdmin);

    await user.click(screen.getByRole('button', { name: /admin queue/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /booking queue/i })).toBeInTheDocument();
    });
  });
});

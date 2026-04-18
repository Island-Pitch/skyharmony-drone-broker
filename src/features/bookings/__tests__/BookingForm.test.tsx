import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { BookingForm } from '../BookingForm';
import { AuthProvider } from '@/auth/AuthContext';
import { DataProvider } from '@/providers/DataProvider';
import { store } from '@/data/store';
import { Role } from '@/auth/roles';

function renderBookingForm(role: Role = Role.OperatorAdmin) {
  return render(
    <MemoryRouter>
      <AuthProvider initialRole={role}>
        <DataProvider>
          <BookingForm />
        </DataProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('BookingForm', () => {
  beforeEach(() => {
    store.reset();
  });

  it('renders the form with all fields', () => {
    renderBookingForm();
    expect(screen.getByLabelText(/show date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/number of drones/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit booking/i })).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty form', async () => {
    const user = userEvent.setup();
    renderBookingForm();

    await user.click(screen.getByRole('button', { name: /submit booking/i }));

    await waitFor(() => {
      expect(screen.getByText(/show date is required/i)).toBeInTheDocument();
      expect(screen.getByText(/location is required/i)).toBeInTheDocument();
    });
  });

  it('shows 403 for roles without BookingCreate permission', () => {
    renderBookingForm(Role.OperatorStaff);
    expect(screen.getByText(/403/)).toBeInTheDocument();
  });

  it('submits a valid booking and shows confirmation', async () => {
    const user = userEvent.setup();
    renderBookingForm();

    const showDateInput = screen.getByLabelText(/show date/i);
    await user.type(showDateInput, '2026-06-01T20:00');

    const droneCountInput = screen.getByLabelText(/number of drones/i);
    await user.type(droneCountInput, '100');

    const locationInput = screen.getByLabelText(/location/i);
    await user.type(locationInput, 'Miami Beach, FL');

    await user.click(screen.getByRole('button', { name: /submit booking/i }));

    await waitFor(() => {
      expect(screen.getByTestId('booking-confirmation')).toBeInTheDocument();
      expect(screen.getByText(/booking submitted/i)).toBeInTheDocument();
    });
  });
});

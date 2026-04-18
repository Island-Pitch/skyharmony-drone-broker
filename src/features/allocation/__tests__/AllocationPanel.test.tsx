import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AllocationPanel } from '../AllocationPanel';
import { AuthProvider } from '@/auth/AuthContext';
import { DataProvider } from '@/providers/DataProvider';
import { store } from '@/data/store';
import { createMockBooking, createMockAsset } from '@/test/helpers';
import { Role } from '@/auth/roles';

const DRONE_TYPE_ID = '00000000-0000-4000-8000-000000000001';

function setupMinimalStore() {
  // Add just the drone asset type so DataProvider doesn't re-seed
  store.assetTypes.set(DRONE_TYPE_ID, {
    id: DRONE_TYPE_ID,
    name: 'drone',
    description: 'Unmanned aerial vehicle',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  });
  // Set a dummy asset so store.assets.size > 0 to prevent seedStore
  const dummy = createMockAsset(DRONE_TYPE_ID, { status: 'retired', serial_number: 'DUMMY-0000' });
  store.assets.set(dummy.id, dummy);
}

function renderAllocationPanel(role: Role = Role.CentralRepoAdmin) {
  return render(
    <MemoryRouter>
      <AuthProvider initialRole={role}>
        <DataProvider>
          <AllocationPanel />
        </DataProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('AllocationPanel', () => {
  beforeEach(() => {
    store.reset();
    setupMinimalStore();
  });

  it('renders the heading', async () => {
    renderAllocationPanel();
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /allocation engine/i }),
      ).toBeInTheDocument();
    });
  });

  it('shows 403 for roles without AssetAllocate permission', () => {
    renderAllocationPanel(Role.LogisticsStaff);
    expect(screen.getByText(/403/)).toBeInTheDocument();
  });

  it('shows empty state when no pending bookings', async () => {
    renderAllocationPanel();
    await waitFor(() => {
      expect(
        screen.getByText(/no pending bookings to allocate/i),
      ).toBeInTheDocument();
    });
  });

  it('displays pending bookings in the table', async () => {
    const booking = createMockBooking({
      operator_name: 'SkyShow Events',
      location: 'Miami Beach, FL',
      status: 'pending',
      drone_count: 10,
    });
    store.bookings.set(booking.id, booking);

    renderAllocationPanel();
    await waitFor(() => {
      expect(screen.getByText('SkyShow Events')).toBeInTheDocument();
      expect(screen.getByText('Miami Beach, FL')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  it('does not display non-pending bookings', async () => {
    const allocated = createMockBooking({
      operator_name: 'Already Allocated',
      status: 'allocated',
    });
    const pending = createMockBooking({
      operator_name: 'Needs Allocation',
      status: 'pending',
    });
    store.bookings.set(allocated.id, allocated);
    store.bookings.set(pending.id, pending);

    renderAllocationPanel();
    await waitFor(() => {
      expect(screen.getByText('Needs Allocation')).toBeInTheDocument();
    });
    expect(screen.queryByText('Already Allocated')).not.toBeInTheDocument();
  });

  it('shows allocation preview when a booking is selected', async () => {
    const user = userEvent.setup();

    // Add some available drones
    for (let i = 1; i <= 5; i++) {
      const drone = createMockAsset(DRONE_TYPE_ID, {
        serial_number: `DR-${String(i).padStart(4, '0')}`,
        status: 'available',
      });
      store.assets.set(drone.id, drone);
    }

    const booking = createMockBooking({
      operator_name: 'SkyShow Events',
      status: 'pending',
      drone_count: 3,
      show_date: '2026-08-01T10:00:00.000Z',
      end_date: '2026-08-01T14:00:00.000Z',
    });
    store.bookings.set(booking.id, booking);

    renderAllocationPanel();
    await waitFor(() => {
      expect(screen.getByText('SkyShow Events')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /select/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /allocation preview/i }),
      ).toBeInTheDocument();
      expect(screen.getByText(/drones requested:/i)).toBeInTheDocument();
    });
  });

  it('shows allocation result after allocating', async () => {
    const user = userEvent.setup();

    // Add available drones
    for (let i = 1; i <= 3; i++) {
      const drone = createMockAsset(DRONE_TYPE_ID, {
        serial_number: `DR-${String(i).padStart(4, '0')}`,
        status: 'available',
      });
      store.assets.set(drone.id, drone);
    }

    const booking = createMockBooking({
      operator_name: 'SkyShow Events',
      status: 'pending',
      drone_count: 2,
      show_date: '2026-08-01T10:00:00.000Z',
      end_date: '2026-08-01T14:00:00.000Z',
    });
    store.bookings.set(booking.id, booking);

    renderAllocationPanel();
    await waitFor(() => {
      expect(screen.getByText('SkyShow Events')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /select/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /allocate drones/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /allocate drones/i }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/drones allocated:/i)).toBeInTheDocument();
    });
  });

  it('shows shortfall warning when not enough drones available', async () => {
    const user = userEvent.setup();

    // Only 2 drones available, booking requests 10
    for (let i = 1; i <= 2; i++) {
      const drone = createMockAsset(DRONE_TYPE_ID, {
        serial_number: `DR-${String(i).padStart(4, '0')}`,
        status: 'available',
      });
      store.assets.set(drone.id, drone);
    }

    const booking = createMockBooking({
      operator_name: 'Big Show',
      status: 'pending',
      drone_count: 10,
      show_date: '2026-08-01T10:00:00.000Z',
      end_date: '2026-08-01T14:00:00.000Z',
    });
    store.bookings.set(booking.id, booking);

    renderAllocationPanel();
    await waitFor(() => {
      expect(screen.getByText('Big Show')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /select/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/shortfall/i)).toBeInTheDocument();
    });
  });
});

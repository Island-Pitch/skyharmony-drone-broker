import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Fleet } from '../Fleet';
import { AuthProvider } from '@/auth/AuthContext';
import { DataProvider } from '@/providers/DataProvider';
import { store } from '@/data/store';
import { createMockAsset, createMockAssetType } from '@/test/helpers';

function renderFleet() {
  const droneType = createMockAssetType({ name: 'drone' });
  store.assetTypes.set(droneType.id, droneType);

  const a1 = createMockAsset(droneType.id, {
    serial_number: 'VA-001',
    manufacturer: 'Verge Aero',
    model: 'X1',
    status: 'available',
  });
  const a2 = createMockAsset(droneType.id, {
    serial_number: 'VA-002',
    manufacturer: 'DJI',
    model: 'M30',
    status: 'maintenance',
  });
  store.assets.set(a1.id, a1);
  store.assets.set(a2.id, a2);

  return render(
    <MemoryRouter>
      <AuthProvider>
        <DataProvider>
          <Fleet />
        </DataProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('Fleet', () => {
  beforeEach(() => {
    store.reset();
  });

  it('renders a heading', async () => {
    renderFleet();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /fleet/i })).toBeInTheDocument();
    });
  });

  it('renders asset data from the store', async () => {
    renderFleet();
    await waitFor(() => {
      expect(screen.getByText('VA-001')).toBeInTheDocument();
      expect(screen.getByText('VA-002')).toBeInTheDocument();
    });
  });

  it('shows status badges', async () => {
    renderFleet();
    await waitFor(() => {
      expect(screen.getByText('available')).toBeInTheDocument();
      expect(screen.getByText('maintenance')).toBeInTheDocument();
    });
  });

  it('renders seeded assets when store starts empty', async () => {
    // DataProvider auto-seeds when store is empty
    store.reset();
    render(
      <MemoryRouter>
        <AuthProvider>
          <DataProvider>
            <Fleet />
          </DataProvider>
        </AuthProvider>
      </MemoryRouter>,
    );
    await waitFor(() => {
      // Should have seeded data, not empty state
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  it('renders asset type filter dropdown', async () => {
    renderFleet();
    await waitFor(() => {
      expect(screen.getByText(/filter by type/i)).toBeInTheDocument();
    });
  });

  it('renders type column in table', async () => {
    renderFleet();
    await waitFor(() => {
      expect(screen.getByText('Type')).toBeInTheDocument();
    });
  });
});

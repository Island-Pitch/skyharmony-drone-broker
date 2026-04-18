import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { MaintenanceAlerts } from '../MaintenanceAlerts';
import { AuthProvider } from '@/auth/AuthContext';
import { DataProvider } from '@/providers/DataProvider';
import { store } from '@/data/store';
import { seedStore } from '@/data/seed';

function renderMaintenanceAlerts(maxAlerts = 10) {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <DataProvider>
          <MaintenanceAlerts maxAlerts={maxAlerts} />
        </DataProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('MaintenanceAlerts', () => {
  beforeEach(() => {
    store.reset();
    seedStore();
  });

  it('renders the maintenance alerts container', async () => {
    renderMaintenanceAlerts();
    await waitFor(() => {
      expect(screen.getByTestId('maintenance-alerts')).toBeInTheDocument();
    });
  });

  it('shows heading with alert count', async () => {
    renderMaintenanceAlerts();
    await waitFor(() => {
      expect(screen.getByText(/maintenance alerts/i)).toBeInTheDocument();
    });
  });

  it('displays severity badges', async () => {
    renderMaintenanceAlerts();
    await waitFor(() => {
      // With 500 seeded drones, there should be some alerts
      const badges = screen.getAllByText(/(warning|critical)/i);
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  it('limits displayed alerts to maxAlerts', async () => {
    renderMaintenanceAlerts(3);
    await waitFor(() => {
      const alertCards = screen.getByTestId('maintenance-alerts').querySelectorAll('.alert-card');
      expect(alertCards.length).toBeLessThanOrEqual(3);
    });
  });

  it('shows overflow message when more alerts exist', async () => {
    renderMaintenanceAlerts(2);
    await waitFor(() => {
      expect(screen.getByText(/\+\d+ more alerts/)).toBeInTheDocument();
    });
  });
});

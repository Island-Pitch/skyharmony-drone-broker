import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { IncidentQueue } from '../IncidentQueue';
import { AuthProvider } from '@/auth/AuthContext';
import { DataProvider } from '@/providers/DataProvider';
import { store } from '@/data/store';
import { seedStore } from '@/data/seed';
import { Role } from '@/auth/roles';
import type { Incident } from '@/data/models/incident';

function renderQueue(role: Role = Role.CentralRepoAdmin) {
  return render(
    <MemoryRouter>
      <AuthProvider initialRole={role}>
        <DataProvider>
          <IncidentQueue />
        </DataProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

function seedIncident(overrides: Partial<Incident> = {}): Incident {
  const firstAsset = Array.from(store.assets.values())[0]!;
  const now = new Date().toISOString();
  const incident: Incident = {
    id: crypto.randomUUID(),
    asset_id: firstAsset.id,
    reporter_id: crypto.randomUUID(),
    severity: 'functional',
    description: 'Test incident',
    status: 'open',
    created_at: now,
    updated_at: now,
    ...overrides,
  };
  store.incidents.set(incident.id, incident);
  return incident;
}

describe('IncidentQueue', () => {
  beforeEach(() => {
    store.reset();
    seedStore();
  });

  it('shows empty state when no incidents', async () => {
    renderQueue();
    await waitFor(() => {
      expect(screen.getByText(/no incidents/i)).toBeInTheDocument();
    });
  });

  it('shows incidents in a table', async () => {
    seedIncident({ description: 'Motor overheat' });
    renderQueue();
    await waitFor(() => {
      expect(screen.getByText('Motor overheat')).toBeInTheDocument();
    });
  });

  it('shows severity badge with correct text', async () => {
    seedIncident({ severity: 'critical', description: 'Critical failure' });
    renderQueue();
    await waitFor(() => {
      expect(screen.getByText('critical')).toBeInTheDocument();
    });
  });

  it('sorts critical incidents to top', async () => {
    seedIncident({ severity: 'cosmetic', description: 'Minor scratch' });
    seedIncident({ severity: 'critical', description: 'Motor failure' });
    renderQueue();
    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      // row 0 is header, row 1 should be critical
      expect(rows[1]).toHaveTextContent('critical');
    });
  });

  it('filters by severity', async () => {
    seedIncident({ severity: 'cosmetic', description: 'Scratch' });
    seedIncident({ severity: 'critical', description: 'Motor failure' });
    const user = userEvent.setup();
    renderQueue();

    await waitFor(() => {
      expect(screen.getByText('Scratch')).toBeInTheDocument();
    });

    const severityFilter = screen.getByLabelText(/filter severity/i);
    await user.selectOptions(severityFilter, 'critical');

    expect(screen.queryByText('Scratch')).not.toBeInTheDocument();
    expect(screen.getByText('Motor failure')).toBeInTheDocument();
  });

  it('filters by status', async () => {
    seedIncident({ status: 'open', description: 'Open issue' });
    seedIncident({ status: 'resolved', description: 'Resolved issue' });
    const user = userEvent.setup();
    renderQueue();

    await waitFor(() => {
      expect(screen.getByText('Open issue')).toBeInTheDocument();
    });

    const statusFilter = screen.getByLabelText(/filter status/i);
    await user.selectOptions(statusFilter, 'resolved');

    expect(screen.queryByText('Open issue')).not.toBeInTheDocument();
    expect(screen.getByText('Resolved issue')).toBeInTheDocument();
  });

  it('shows Resolve button for open incidents', async () => {
    seedIncident({ status: 'open' });
    renderQueue();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /resolve/i })).toBeInTheDocument();
    });
  });

  it('does not show Resolve button for resolved incidents', async () => {
    seedIncident({ status: 'resolved' });
    renderQueue();
    await waitFor(() => {
      expect(screen.getByText('Test incident')).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /resolve/i })).not.toBeInTheDocument();
  });
});

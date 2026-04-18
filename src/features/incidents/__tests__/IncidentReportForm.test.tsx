import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { IncidentReportForm } from '../IncidentReportForm';
import { AuthProvider } from '@/auth/AuthContext';
import { DataProvider } from '@/providers/DataProvider';
import { store } from '@/data/store';
import { seedStore } from '@/data/seed';
import { Role } from '@/auth/roles';

function renderForm(role: Role = Role.OperatorStaff, assetId?: string) {
  return render(
    <MemoryRouter>
      <AuthProvider initialRole={role}>
        <DataProvider>
          <IncidentReportForm prefilledAssetId={assetId} />
        </DataProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('IncidentReportForm', () => {
  beforeEach(() => {
    store.reset();
    seedStore();
  });

  it('renders the form with all fields', async () => {
    renderForm();
    await waitFor(() => {
      expect(screen.getByLabelText(/severity/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/photo url/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit report/i })).toBeInTheDocument();
  });

  it('renders severity dropdown with all options', async () => {
    renderForm();
    await waitFor(() => {
      expect(screen.getByLabelText(/severity/i)).toBeInTheDocument();
    });
    expect(screen.getByText('Cosmetic')).toBeInTheDocument();
    expect(screen.getByText('Functional')).toBeInTheDocument();
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('renders asset selector', async () => {
    renderForm();
    await waitFor(() => {
      expect(screen.getByLabelText(/asset/i)).toBeInTheDocument();
    });
  });

  it('shows 403 for roles without IncidentReport permission', () => {
    renderForm(Role.LogisticsStaff);
    expect(screen.getByText(/403/)).toBeInTheDocument();
  });

  it('submits a valid report and shows confirmation', async () => {
    const user = userEvent.setup();
    const firstAsset = Array.from(store.assets.values())[0]!;
    renderForm(Role.OperatorStaff, firstAsset.id);

    await waitFor(() => {
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    const descInput = screen.getByLabelText(/description/i);
    await user.type(descInput, 'Propeller cracked during flight');

    const severitySelect = screen.getByLabelText(/severity/i);
    await user.selectOptions(severitySelect, 'functional');

    await user.click(screen.getByRole('button', { name: /submit report/i }));

    await waitFor(() => {
      expect(screen.getByTestId('incident-confirmation')).toBeInTheDocument();
      expect(screen.getByText(/incident reported/i)).toBeInTheDocument();
    });
  });

  it('shows validation error when description is empty', async () => {
    const user = userEvent.setup();
    const firstAsset = Array.from(store.assets.values())[0]!;
    renderForm(Role.OperatorStaff, firstAsset.id);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /submit report/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /submit report/i }));

    await waitFor(() => {
      expect(screen.getByText(/description is required/i)).toBeInTheDocument();
    });
  });
});

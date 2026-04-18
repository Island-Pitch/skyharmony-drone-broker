import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { IncidentsPage } from '../IncidentsPage';
import { AuthProvider } from '@/auth/AuthContext';
import { DataProvider } from '@/providers/DataProvider';
import { store } from '@/data/store';
import { seedStore } from '@/data/seed';
import { Role } from '@/auth/roles';

function renderPage(role: Role = Role.OperatorStaff) {
  return render(
    <MemoryRouter>
      <AuthProvider initialRole={role}>
        <DataProvider>
          <IncidentsPage />
        </DataProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('IncidentsPage', () => {
  beforeEach(() => {
    store.reset();
    seedStore();
  });

  it('renders with tab navigation', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /report incident/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /incident queue/i })).toBeInTheDocument();
  });

  it('shows report form by default', async () => {
    renderPage();
    // The form is wrapped with RouteGuard, which checks permissions.
    // OperatorStaff has IncidentReport permission.
    expect(screen.getByLabelText(/severity/i)).toBeInTheDocument();
  });

  it('switches to queue tab', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /incident queue/i }));
    expect(screen.getByText(/no incidents/i)).toBeInTheDocument();
  });

  it('shows page heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /incidents/i })).toBeInTheDocument();
  });
});

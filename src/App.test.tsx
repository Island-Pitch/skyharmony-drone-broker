import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders the sidebar with SkyHarmony branding', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText('SkyHarmony')).toBeInTheDocument();
    });
    expect(screen.getByText('Drone Broker')).toBeInTheDocument();
  });

  it('renders dashboard by default', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Total Assets')).toBeInTheDocument();
    });
  });

  it('renders navigation links for all routes', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText('Fleet')).toBeInTheDocument();
    });
    expect(screen.getByText('Missions')).toBeInTheDocument();
    expect(screen.getByText('Marketplace')).toBeInTheDocument();
  });
});

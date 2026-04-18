import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { OperatorBreakdown } from '../OperatorBreakdown';

describe('OperatorBreakdown', () => {
  it('renders the operator breakdown container', async () => {
    render(<OperatorBreakdown />);
    await waitFor(() => {
      expect(screen.getByTestId('operator-breakdown')).toBeInTheDocument();
    });
  });

  it('displays the heading', async () => {
    render(<OperatorBreakdown />);
    await waitFor(() => {
      expect(screen.getByText('Operator Allocation Breakdown')).toBeInTheDocument();
    });
  });

  it('shows operator names', async () => {
    render(<OperatorBreakdown />);
    await waitFor(() => {
      expect(screen.getByText('SkyShow Events')).toBeInTheDocument();
      expect(screen.getByText('DroneLight Co')).toBeInTheDocument();
      expect(screen.getByText('AeroSpectacle')).toBeInTheDocument();
      expect(screen.getByText('NightSky Drones')).toBeInTheDocument();
      expect(screen.getByText('StarFleet Shows')).toBeInTheDocument();
    });
  });

  it('shows allocation stats for each operator', async () => {
    render(<OperatorBreakdown />);
    await waitFor(() => {
      expect(screen.getByText(/50 drones/)).toBeInTheDocument();
      expect(screen.getByText(/78% util/)).toBeInTheDocument();
      expect(screen.getByText(/33% contribution/)).toBeInTheDocument();
    });
  });

  it('renders horizontal bar visualizations', async () => {
    render(<OperatorBreakdown />);
    await waitFor(() => {
      const bars = screen.getAllByRole('meter');
      expect(bars.length).toBe(5);
    });
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RevenueSummary } from '../RevenueSummary';

describe('RevenueSummary', () => {
  it('renders the revenue summary container', async () => {
    render(<RevenueSummary />);
    await waitFor(() => {
      expect(screen.getByTestId('revenue-summary')).toBeInTheDocument();
    });
  });

  it('displays the heading', async () => {
    render(<RevenueSummary />);
    await waitFor(() => {
      expect(screen.getByText('Revenue Summary')).toBeInTheDocument();
    });
  });

  it('shows total revenue', async () => {
    render(<RevenueSummary />);
    await waitFor(() => {
      expect(screen.getByText('$284,500')).toBeInTheDocument();
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    });
  });

  it('shows allocation fee revenue', async () => {
    render(<RevenueSummary />);
    await waitFor(() => {
      expect(screen.getByText('$198,150')).toBeInTheDocument();
      expect(screen.getByText('Allocation Fees')).toBeInTheDocument();
    });
  });

  it('shows standby fee revenue', async () => {
    render(<RevenueSummary />);
    await waitFor(() => {
      expect(screen.getByText('$86,350')).toBeInTheDocument();
      expect(screen.getByText('Standby Fees')).toBeInTheDocument();
    });
  });

  it('shows pending invoices count', async () => {
    render(<RevenueSummary />);
    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('Pending Invoices')).toBeInTheDocument();
    });
  });
});

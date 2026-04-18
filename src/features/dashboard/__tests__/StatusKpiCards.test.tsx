import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusKpiCards } from '../StatusKpiCards';
import type { FleetSummary } from '@/services/FleetSummaryService';

const mockSummary: FleetSummary = {
  total_assets: 530,
  by_status: {
    available: 300,
    allocated: 80,
    in_transit: 50,
    maintenance: 70,
    retired: 30,
  },
  by_type: {},
  by_manufacturer: {},
  utilization_pct: 25.5,
};

describe('StatusKpiCards', () => {
  it('renders the KPI grid container', () => {
    render(<StatusKpiCards summary={mockSummary} />);
    expect(screen.getByTestId('status-kpi-cards')).toBeInTheDocument();
  });

  it('displays the total assets count', () => {
    render(<StatusKpiCards summary={mockSummary} />);
    expect(screen.getByText('530')).toBeInTheDocument();
    expect(screen.getByText('Total Assets')).toBeInTheDocument();
  });

  it('displays all status counts', () => {
    render(<StatusKpiCards summary={mockSummary} />);
    expect(screen.getByText('300')).toBeInTheDocument(); // available
    expect(screen.getByText('80')).toBeInTheDocument();  // allocated
    expect(screen.getByText('50')).toBeInTheDocument();  // in_transit
    expect(screen.getByText('70')).toBeInTheDocument();  // maintenance
    expect(screen.getByText('30')).toBeInTheDocument();  // retired
  });

  it('displays status labels', () => {
    render(<StatusKpiCards summary={mockSummary} />);
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText('Allocated')).toBeInTheDocument();
    expect(screen.getByText('In Transit')).toBeInTheDocument();
    expect(screen.getByText('Maintenance')).toBeInTheDocument();
    expect(screen.getByText('Retired')).toBeInTheDocument();
  });

  it('displays utilization percentage', () => {
    render(<StatusKpiCards summary={mockSummary} />);
    expect(screen.getByText('25.5%')).toBeInTheDocument();
    expect(screen.getByText('Utilization')).toBeInTheDocument();
  });

  it('applies color classes to cards', () => {
    const { container } = render(<StatusKpiCards summary={mockSummary} />);
    expect(container.querySelector('.kpi-success')).toBeInTheDocument();
    expect(container.querySelector('.kpi-primary')).toBeInTheDocument();
    expect(container.querySelector('.kpi-warning')).toBeInTheDocument();
    expect(container.querySelector('.kpi-danger')).toBeInTheDocument();
    expect(container.querySelector('.kpi-muted')).toBeInTheDocument();
  });
});

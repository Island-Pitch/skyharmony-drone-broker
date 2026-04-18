import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SummaryCard } from '../SummaryCard';

describe('SummaryCard', () => {
  it('renders label and value', () => {
    render(<SummaryCard label="Active Drones" value={42} />);
    expect(screen.getByText('Active Drones')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders string value', () => {
    render(<SummaryCard label="Uptime" value="99.5%" />);
    expect(screen.getByText('99.5%')).toBeInTheDocument();
  });
});

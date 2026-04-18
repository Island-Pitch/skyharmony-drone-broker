import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FleetFilters } from '../FleetFilters';
import type { AssetType } from '@/data/models/asset';

describe('FleetFilters', () => {
  const assetTypes: AssetType[] = [
    {
      id: '1',
      name: 'drone',
      description: 'UAV',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'base_station',
      description: 'Ground control',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  it('renders filter controls', () => {
    render(
      <FleetFilters
        assetTypes={assetTypes}
        filters={{}}
        onFilterChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it('calls onFilterChange when type changes', () => {
    const onChange = vi.fn();
    render(
      <FleetFilters
        assetTypes={assetTypes}
        filters={{}}
        onFilterChange={onChange}
      />,
    );

    fireEvent.change(screen.getByLabelText(/type/i), {
      target: { value: '1' },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ type_id: '1' }),
    );
  });

  it('calls onFilterChange when status changes', () => {
    const onChange = vi.fn();
    render(
      <FleetFilters
        assetTypes={assetTypes}
        filters={{}}
        onFilterChange={onChange}
      />,
    );

    fireEvent.change(screen.getByLabelText(/status/i), {
      target: { value: 'maintenance' },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'maintenance' }),
    );
  });

  it('renders a clear button', () => {
    render(
      <FleetFilters
        assetTypes={assetTypes}
        filters={{ status: 'available' }}
        onFilterChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('clears filters when clear button clicked', () => {
    const onChange = vi.fn();
    render(
      <FleetFilters
        assetTypes={assetTypes}
        filters={{ status: 'available' }}
        onFilterChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(onChange).toHaveBeenCalledWith({});
  });
});

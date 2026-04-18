import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ScanResult } from '../ScanResult';
import type { Asset } from '@/data/models/asset';

describe('ScanResult', () => {
  const makeAsset = (overrides: Partial<Asset> = {}): Asset => ({
    id: crypto.randomUUID(),
    asset_type_id: crypto.randomUUID(),
    serial_number: 'VE-0001',
    manufacturer: 'Verge Aero',
    model: 'X1',
    status: 'available',
    firmware_version: '2.1.0',
    flight_hours: 150,
    battery_cycles: 42,
    typed_attributes: {},
    current_operator_id: null,
    parent_asset_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  });

  const defaultProps = {
    asset: null,
    notFound: false,
    error: null,
    lastAction: null as 'check_out' | 'check_in' | null,
    actionSuccess: false,
    onCheckOut: vi.fn(),
    onCheckIn: vi.fn(),
    onClear: vi.fn(),
  };

  function renderScanResult(props: Parameters<typeof ScanResult>[0]) {
    return render(
      <MemoryRouter>
        <ScanResult {...props} />
      </MemoryRouter>,
    );
  }

  it('renders nothing when no asset and no error', () => {
    const { container } = renderScanResult(defaultProps);
    expect(container.querySelector('.scan-result')).toBeNull();
  });

  it('shows unknown asset message when not found', () => {
    renderScanResult({ ...defaultProps, notFound: true });
    expect(screen.getByText(/unknown asset/i)).toBeInTheDocument();
  });

  it('shows error message', () => {
    renderScanResult({ ...defaultProps, error: 'Something went wrong' });
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('shows asset details when asset is provided', () => {
    const asset = makeAsset();
    renderScanResult({ ...defaultProps, asset });

    expect(screen.getByText('VE-0001')).toBeInTheDocument();
    expect(screen.getByText('Verge Aero')).toBeInTheDocument();
    expect(screen.getByText('X1')).toBeInTheDocument();
    expect(screen.getByText('2.1.0')).toBeInTheDocument();
    expect(screen.getByText('150 hrs')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('shows Check Out button for available assets', () => {
    const asset = makeAsset({ status: 'available' });
    renderScanResult({ ...defaultProps, asset });

    expect(
      screen.getByRole('button', { name: /check out/i }),
    ).toBeInTheDocument();
  });

  it('shows Check In button for allocated assets', () => {
    const asset = makeAsset({ status: 'allocated' });
    renderScanResult({ ...defaultProps, asset });

    expect(
      screen.getByRole('button', { name: /check in/i }),
    ).toBeInTheDocument();
  });

  it('shows Report Issue button for allocated assets', () => {
    const asset = makeAsset({ status: 'allocated' });
    renderScanResult({ ...defaultProps, asset });

    expect(
      screen.getByRole('button', { name: /report issue/i }),
    ).toBeInTheDocument();
  });

  it('calls onCheckOut when Check Out is clicked', () => {
    const onCheckOut = vi.fn();
    const asset = makeAsset({ status: 'available' });
    renderScanResult({ ...defaultProps, asset, onCheckOut });

    fireEvent.click(screen.getByRole('button', { name: /check out/i }));
    expect(onCheckOut).toHaveBeenCalledTimes(1);
  });

  it('calls onCheckIn when Check In is clicked', () => {
    const onCheckIn = vi.fn();
    const asset = makeAsset({ status: 'allocated' });
    renderScanResult({ ...defaultProps, asset, onCheckIn });

    fireEvent.click(screen.getByRole('button', { name: /check in/i }));
    expect(onCheckIn).toHaveBeenCalledTimes(1);
  });

  it('shows check-out confirmation', () => {
    const asset = makeAsset({ status: 'allocated' });
    renderScanResult({
      ...defaultProps,
      asset,
      lastAction: 'check_out',
      actionSuccess: true,
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      /checked out.*VE-0001/i,
    );
  });

  it('shows check-in confirmation', () => {
    const asset = makeAsset({ status: 'available' });
    renderScanResult({
      ...defaultProps,
      asset,
      lastAction: 'check_in',
      actionSuccess: true,
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      /checked in.*VE-0001/i,
    );
  });

  it('calls onClear when Clear is clicked', () => {
    const onClear = vi.fn();
    const asset = makeAsset();
    renderScanResult({ ...defaultProps, asset, onClear });

    fireEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('shows status badge', () => {
    const asset = makeAsset({ status: 'available' });
    renderScanResult({ ...defaultProps, asset });

    expect(screen.getByText('available')).toHaveClass('status-badge');
  });
});

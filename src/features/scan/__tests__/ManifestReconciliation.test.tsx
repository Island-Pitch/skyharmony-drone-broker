import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ManifestReconciliation } from '../ManifestReconciliation';
import { DataContext, type DataContextValue } from '@/providers/DataProvider';
import type { Asset } from '@/data/models/asset';

function makeAsset(serial: string): Asset {
  return {
    id: crypto.randomUUID(),
    asset_type_id: crypto.randomUUID(),
    serial_number: serial,
    manufacturer: 'Verge Aero',
    model: 'X1',
    status: 'available',
    typed_attributes: {},
    current_operator_id: null,
    parent_asset_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function createMockContext(assets: Asset[], scannedAssetIds: string[] = []): DataContextValue {
  return {
    assetRepo: {} as DataContextValue['assetRepo'],
    assetService: {
      listAssets: vi.fn().mockResolvedValue(assets),
    } as unknown as DataContextValue['assetService'],
    auditService: {} as DataContextValue['auditService'],
    bookingRepo: {} as DataContextValue['bookingRepo'],
    bookingService: {} as DataContextValue['bookingService'],
    incidentService: {} as DataContextValue['incidentService'],
    scanService: {
      getCustodyHistory: vi.fn().mockImplementation((assetId: string) => {
        if (scannedAssetIds.includes(assetId)) {
          return Promise.resolve([{ id: crypto.randomUUID() }]);
        }
        return Promise.resolve([]);
      }),
    } as unknown as DataContextValue['scanService'],
  };
}

describe('ManifestReconciliation', () => {
  const onScanSerial = vi.fn();
  const assets = [
    makeAsset('VE-0001'),
    makeAsset('DJ-0002'),
    makeAsset('SK-0003'),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders manifest reconciliation title', async () => {
    const ctx = createMockContext(assets);
    render(
      <DataContext.Provider value={ctx}>
        <ManifestReconciliation onScanSerial={onScanSerial} />
      </DataContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Manifest Reconciliation')).toBeInTheDocument();
    });
  });

  it('shows progress count', async () => {
    const ctx = createMockContext(assets);
    render(
      <DataContext.Provider value={ctx}>
        <ManifestReconciliation onScanSerial={onScanSerial} />
      </DataContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByText('0 / 3 scanned')).toBeInTheDocument();
    });
  });

  it('shows unscanned assets', async () => {
    const ctx = createMockContext(assets);
    render(
      <DataContext.Provider value={ctx}>
        <ManifestReconciliation onScanSerial={onScanSerial} />
      </DataContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByText('VE-0001')).toBeInTheDocument();
      expect(screen.getByText('DJ-0002')).toBeInTheDocument();
      expect(screen.getByText('SK-0003')).toBeInTheDocument();
    });
  });

  it('shows fully reconciled when all scanned', async () => {
    const ctx = createMockContext(
      assets,
      assets.map((a) => a.id),
    );
    render(
      <DataContext.Provider value={ctx}>
        <ManifestReconciliation onScanSerial={onScanSerial} />
      </DataContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Fully Reconciled')).toBeInTheDocument();
    });
  });

  it('renders progress bar', async () => {
    const ctx = createMockContext(assets);
    render(
      <DataContext.Provider value={ctx}>
        <ManifestReconciliation onScanSerial={onScanSerial} />
      </DataContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    const ctx = createMockContext(assets);
    // Mock a slow response
    (ctx.assetService.listAssets as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise(() => {}),
    );
    render(
      <DataContext.Provider value={ctx}>
        <ManifestReconciliation onScanSerial={onScanSerial} />
      </DataContext.Provider>,
    );

    expect(screen.getByText('Loading manifest...')).toBeInTheDocument();
  });
});

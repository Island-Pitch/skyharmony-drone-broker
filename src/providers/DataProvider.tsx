import { createContext, useMemo, useState, useEffect, type ReactNode } from 'react';
import { HttpAssetRepository } from '@/data/repositories/http/HttpAssetRepository';
import { HttpBookingRepository } from '@/data/repositories/http/HttpBookingRepository';
import { HttpAuditRepository } from '@/data/repositories/http/HttpAuditRepository';
import { HttpCustodyRepository } from '@/data/repositories/http/HttpCustodyRepository';
import { HttpIncidentRepository } from '@/data/repositories/http/HttpIncidentRepository';
import { AllocationService } from '@/services/AllocationService';
import { AssetService } from '@/services/AssetService';
import { AuditService } from '@/services/AuditService';
import { BookingService } from '@/services/BookingService';
import { IncidentService } from '@/services/IncidentService';
import { ScanService } from '@/services/ScanService';
import type { IAssetRepository } from '@/data/repositories/interfaces';
import type { IBookingRepository } from '@/data/repositories/InMemoryBookingRepository';

// Demo mode imports — only used in test environments
import { InMemoryAssetRepository } from '@/data/repositories/InMemoryAssetRepository';
import { InMemoryAuditRepository } from '@/data/repositories/InMemoryAuditRepository';
import { InMemoryBookingRepository } from '@/data/repositories/InMemoryBookingRepository';
import { InMemoryCustodyRepository } from '@/data/repositories/InMemoryCustodyRepository';
import { InMemoryIncidentRepository } from '@/data/repositories/InMemoryIncidentRepository';
import { seedStore } from '@/data/seed';
import { store } from '@/data/store';
import { apiUrl } from '@/data/repositories/http/apiClient';

export interface DataContextValue {
  assetRepo: IAssetRepository;
  allocationService: AllocationService;
  assetService: AssetService;
  auditService: AuditService;
  bookingRepo: IBookingRepository;
  bookingService: BookingService;
  incidentService: IncidentService;
  scanService: ScanService;
  mode: 'api' | 'demo';
}

export const DataContext = createContext<DataContextValue | null>(null);

interface DataProviderProps {
  children: ReactNode;
}

function createApiContext(): DataContextValue {
  const assetRepo = new HttpAssetRepository();
  const auditRepo = new HttpAuditRepository();
  const custodyRepo = new HttpCustodyRepository();
  const incidentRepo = new HttpIncidentRepository();
  const assetService = new AssetService(assetRepo);
  const auditService = new AuditService(auditRepo);
  const bookingRepo = new HttpBookingRepository();
  const bookingService = new BookingService(bookingRepo);
  const allocationService = new AllocationService(assetRepo, bookingRepo, bookingService, auditService);
  const incidentService = new IncidentService(incidentRepo, assetRepo, auditService);
  const scanService = new ScanService(assetRepo, custodyRepo, auditService);
  return { assetRepo, allocationService, assetService, auditService, bookingRepo, bookingService, incidentService, scanService, mode: 'api' };
}

function createDemoContext(): DataContextValue {
  if (store.assets.size === 0) seedStore();
  const assetRepo = new InMemoryAssetRepository();
  const auditRepo = new InMemoryAuditRepository();
  const custodyRepo = new InMemoryCustodyRepository();
  const incidentRepo = new InMemoryIncidentRepository();
  const assetService = new AssetService(assetRepo);
  const auditService = new AuditService(auditRepo);
  const bookingRepo = new InMemoryBookingRepository();
  const bookingService = new BookingService(bookingRepo);
  const allocationService = new AllocationService(assetRepo, bookingRepo, bookingService, auditService);
  const incidentService = new IncidentService(incidentRepo, assetRepo, auditService);
  const scanService = new ScanService(assetRepo, custodyRepo, auditService);
  return { assetRepo, allocationService, assetService, auditService, bookingRepo, bookingService, incidentService, scanService, mode: 'demo' };
}

const isTestEnv = typeof window !== 'undefined' && window.navigator.userAgent.includes('jsdom');

export function DataProvider({ children }: DataProviderProps) {
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(isTestEnv ? false : null);

  useEffect(() => {
    if (apiAvailable !== null) return;
    fetch(apiUrl('/api/health'))
      .then(async (res) => {
        if (!res.ok) {
          setApiAvailable(false);
          return;
        }
        const ct = res.headers.get('content-type') ?? '';
        if (!ct.includes('application/json')) {
          setApiAvailable(false);
          return;
        }
        await res.json().catch(() => null);
        setApiAvailable(true);
      })
      .catch(() => setApiAvailable(false));
  }, [apiAvailable]);

  const value = useMemo(() => {
    if (apiAvailable === null) return null;
    return apiAvailable ? createApiContext() : createDemoContext();
  }, [apiAvailable]);

  if (!value) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#D4A843', flexDirection: 'column', gap: '1rem' }}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><path d="M24 44C24 44 8 36 8 22C8 13.2 14.4 6 24 6C33.6 6 40 13.2 40 22C40 28 36 32 30 32C24 32 21 28 21 24C21 20 23 18 26 18C29 18 30 20 30 22" stroke="#D4A843" strokeWidth="2.5" strokeLinecap="round" fill="none" /></svg>
        <span>Connecting to SkyHarmony...</span>
      </div>
    );
  }

  return (
    <DataContext.Provider value={value}>{children}</DataContext.Provider>
  );
}

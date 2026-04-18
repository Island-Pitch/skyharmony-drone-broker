import { createContext, useMemo, useState, useEffect, type ReactNode } from 'react';
import { InMemoryAssetRepository } from '@/data/repositories/InMemoryAssetRepository';
import { InMemoryAuditRepository } from '@/data/repositories/InMemoryAuditRepository';
import { InMemoryBookingRepository } from '@/data/repositories/InMemoryBookingRepository';
import { InMemoryCustodyRepository } from '@/data/repositories/InMemoryCustodyRepository';
import { InMemoryIncidentRepository } from '@/data/repositories/InMemoryIncidentRepository';
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
import { seedStore } from '@/data/seed';
import { store } from '@/data/store';
import type { IAssetRepository } from '@/data/repositories/interfaces';
import type { IBookingRepository } from '@/data/repositories/InMemoryBookingRepository';

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

function createDemoContext(): DataContextValue {
  if (store.assets.size === 0) {
    seedStore();
  }
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

export function DataProvider({ children }: DataProviderProps) {
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(
    // In test environments (vitest/jsdom), skip the health check and go straight to demo
    typeof window !== 'undefined' && window.navigator.userAgent.includes('jsdom') ? false : null,
  );

  useEffect(() => {
    if (apiAvailable !== null) return; // Already determined
    fetch('/api/health')
      .then((res) => setApiAvailable(res.ok))
      .catch(() => setApiAvailable(false));
  }, [apiAvailable]);

  const value = useMemo(() => {
    if (apiAvailable === null) return null;
    return apiAvailable ? createApiContext() : createDemoContext();
  }, [apiAvailable]);

  if (!value) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#D4A843' }}>
        Connecting...
      </div>
    );
  }

  return (
    <DataContext.Provider value={value}>{children}</DataContext.Provider>
  );
}

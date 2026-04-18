import { createContext, useMemo, type ReactNode } from 'react';
import { InMemoryAssetRepository } from '@/data/repositories/InMemoryAssetRepository';
import { InMemoryAuditRepository } from '@/data/repositories/InMemoryAuditRepository';
import { InMemoryBookingRepository } from '@/data/repositories/InMemoryBookingRepository';
import { InMemoryCustodyRepository } from '@/data/repositories/InMemoryCustodyRepository';
import { InMemoryIncidentRepository } from '@/data/repositories/InMemoryIncidentRepository';
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
}

export const DataContext = createContext<DataContextValue | null>(null);

interface DataProviderProps {
  children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const value = useMemo(() => {
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
    return { assetRepo, allocationService, assetService, auditService, bookingRepo, bookingService, incidentService, scanService };
  }, []);

  return (
    <DataContext.Provider value={value}>{children}</DataContext.Provider>
  );
}

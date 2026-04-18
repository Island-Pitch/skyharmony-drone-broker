import { createContext, useMemo, type ReactNode } from 'react';
import { InMemoryAssetRepository } from '@/data/repositories/InMemoryAssetRepository';
import { InMemoryAuditRepository } from '@/data/repositories/InMemoryAuditRepository';
import { InMemoryBookingRepository } from '@/data/repositories/InMemoryBookingRepository';
import { InMemoryCustodyRepository } from '@/data/repositories/InMemoryCustodyRepository';
import { AssetService } from '@/services/AssetService';
import { AuditService } from '@/services/AuditService';
import { BookingService } from '@/services/BookingService';
import { ScanService } from '@/services/ScanService';
import { seedStore } from '@/data/seed';
import { store } from '@/data/store';
import type { IAssetRepository } from '@/data/repositories/interfaces';
import type { IBookingRepository } from '@/data/repositories/InMemoryBookingRepository';

export interface DataContextValue {
  assetRepo: IAssetRepository;
  assetService: AssetService;
  auditService: AuditService;
  bookingRepo: IBookingRepository;
  bookingService: BookingService;
  scanService: ScanService;
}

export const DataContext = createContext<DataContextValue | null>(null);

interface DataProviderProps {
  children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const value = useMemo(() => {
    // Seed data if store is empty
    if (store.assets.size === 0) {
      seedStore();
    }
    const assetRepo = new InMemoryAssetRepository();
    const auditRepo = new InMemoryAuditRepository();
    const custodyRepo = new InMemoryCustodyRepository();
    const assetService = new AssetService(assetRepo);
    const auditService = new AuditService(auditRepo);
    const bookingRepo = new InMemoryBookingRepository();
    const bookingService = new BookingService(bookingRepo);
    const scanService = new ScanService(assetRepo, custodyRepo, auditService);
    return { assetRepo, assetService, auditService, bookingRepo, bookingService, scanService };
  }, []);

  return (
    <DataContext.Provider value={value}>{children}</DataContext.Provider>
  );
}

import { createContext, useMemo, type ReactNode } from 'react';
import { InMemoryAssetRepository } from '@/data/repositories/InMemoryAssetRepository';
import { AssetService } from '@/services/AssetService';
import { seedStore } from '@/data/seed';
import { store } from '@/data/store';
import type { IAssetRepository } from '@/data/repositories/interfaces';

export interface DataContextValue {
  assetRepo: IAssetRepository;
  assetService: AssetService;
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
    const assetService = new AssetService(assetRepo);
    return { assetRepo, assetService };
  }, []);

  return (
    <DataContext.Provider value={value}>{children}</DataContext.Provider>
  );
}

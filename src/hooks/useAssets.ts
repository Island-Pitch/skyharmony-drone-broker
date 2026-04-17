import { useState, useEffect, useCallback, useContext } from 'react';
import { DataContext } from '@/providers/DataProvider';
import type { Asset, CreateAssetInput, UpdateAssetInput } from '@/data/models/asset';

export function useAssets() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useAssets must be used within a DataProvider');

  const { assetService } = ctx;
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshAssets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await assetService.listAssets();
      setAssets(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, [assetService]);

  useEffect(() => {
    refreshAssets();
  }, [refreshAssets]);

  const createAsset = useCallback(
    async (input: CreateAssetInput) => {
      const created = await assetService.createAsset(input);
      await refreshAssets();
      return created;
    },
    [assetService, refreshAssets],
  );

  const updateAsset = useCallback(
    async (id: string, input: UpdateAssetInput) => {
      const updated = await assetService.updateAsset(id, input);
      await refreshAssets();
      return updated;
    },
    [assetService, refreshAssets],
  );

  return { assets, loading, error, createAsset, updateAsset, refreshAssets };
}

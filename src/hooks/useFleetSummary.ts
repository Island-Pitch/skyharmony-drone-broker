import { useState, useEffect, useCallback, useContext } from 'react';
import { DataContext } from '@/providers/DataProvider';
import { FleetSummaryService } from '@/services/FleetSummaryService';
import type { FleetSummary } from '@/services/FleetSummaryService';
import { apiGet } from '@/data/repositories/http/apiClient';

/** Hook providing fleet summary statistics. Uses API endpoint directly when available. */
export function useFleetSummary() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useFleetSummary must be used within a DataProvider');

  const [summary, setSummary] = useState<FleetSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (ctx.mode === 'api') {
        const res = await apiGet<FleetSummary>('/fleet/summary');
        setSummary(res.data);
      } else {
        const service = new FleetSummaryService(ctx.assetRepo);
        const data = await service.getSummary();
        setSummary(data);
      }
    } catch {
      // Fallback to client-side aggregation
      const service = new FleetSummaryService(ctx.assetRepo);
      const data = await service.getSummary();
      setSummary(data);
    }
    setLoading(false);
  }, [ctx.assetRepo, ctx.mode]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { summary, loading, refresh };
}

import { useState, useEffect, useCallback, useContext } from 'react';
import { DataContext } from '@/providers/DataProvider';
import { FleetSummaryService } from '@/services/FleetSummaryService';
import type { FleetSummary } from '@/services/FleetSummaryService';

/** Hook providing fleet summary statistics. Reads from DataProvider context. */
export function useFleetSummary() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useFleetSummary must be used within a DataProvider');

  const [summary, setSummary] = useState<FleetSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const service = new FleetSummaryService(ctx.assetRepo);
    const data = await service.getSummary();
    setSummary(data);
    setLoading(false);
  }, [ctx.assetRepo]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { summary, loading, refresh };
}

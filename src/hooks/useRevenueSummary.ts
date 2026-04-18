import { useState, useEffect, useCallback } from 'react';
import { RevenueService } from '@/services/RevenueService';
import type { RevenueSummary } from '@/services/RevenueService';

/** Hook providing revenue summary statistics. */
export function useRevenueSummary() {
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const service = new RevenueService();
    const data = await service.getSummary();
    setSummary(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { summary, loading, refresh };
}

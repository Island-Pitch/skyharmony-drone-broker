import { useState, useEffect, useCallback } from 'react';
import { OperatorBreakdownService } from '@/services/OperatorBreakdownService';
import type { OperatorStats } from '@/services/OperatorBreakdownService';

/** Hook providing per-operator allocation breakdown. */
export function useOperatorBreakdown() {
  const [operators, setOperators] = useState<OperatorStats[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const service = new OperatorBreakdownService();
    const data = await service.getBreakdown();
    setOperators(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { operators, loading, refresh };
}

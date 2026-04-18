import { useState, useEffect, useCallback, useContext } from 'react';
import { DataContext } from '@/providers/DataProvider';
import { apiGet, apiPost } from '@/data/repositories/http/apiClient';

export interface CooperativeTerms {
  id: string;
  version: number;
  brokerage_pct: string;
  allocation_fee_per_drone: string;
  standby_fee_per_drone: string;
  insurance_pool_pct: string;
  net_payment_days: number;
  damage_policy: string | null;
  effective_date: string;
  created_by: string | null;
  created_at: string;
}

export interface CreateTermsPayload {
  brokerage_pct: number;
  allocation_fee_per_drone: number;
  standby_fee_per_drone: number;
  insurance_pool_pct: number;
  net_payment_days: number;
  damage_policy?: string;
  effective_date: string;
}

const DEMO_TERMS: CooperativeTerms = {
  id: 'demo-terms-1',
  version: 1,
  brokerage_pct: '15.00',
  allocation_fee_per_drone: '350.00',
  standby_fee_per_drone: '150.00',
  insurance_pool_pct: '7.00',
  net_payment_days: 30,
  damage_policy:
    'Operators are liable for damage to allocated assets during custody. Damage assessment performed by SkyHarmony technicians within 48 hours of return. Repair costs deducted from next settlement. Total loss valued at fair market depreciated value. Force majeure events reviewed case-by-case by the cooperative board.',
  effective_date: '2026-01-01',
  created_by: null,
  created_at: '2026-01-01T00:00:00.000Z',
};

export function useTerms() {
  const ctx = useContext(DataContext);
  const [current, setCurrent] = useState<CooperativeTerms | null>(null);
  const [history, setHistory] = useState<CooperativeTerms[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrent = useCallback(async () => {
    if (ctx?.mode !== 'api') {
      setCurrent(DEMO_TERMS);
      setLoading(false);
      return;
    }
    try {
      const res = await apiGet<CooperativeTerms>('/terms/current');
      setCurrent(res.data);
    } catch (err) {
      setCurrent(DEMO_TERMS);
    } finally {
      setLoading(false);
    }
  }, [ctx?.mode]);

  const fetchHistory = useCallback(async () => {
    if (ctx?.mode !== 'api') {
      setHistory([DEMO_TERMS]);
      return;
    }
    try {
      const res = await apiGet<CooperativeTerms[]>('/terms/history');
      setHistory(res.data);
    } catch {
      setHistory([]);
    }
  }, [ctx?.mode]);

  const createTerms = useCallback(
    async (payload: CreateTermsPayload) => {
      setError(null);
      try {
        const res = await apiPost<CooperativeTerms>('/terms', payload);
        setCurrent(res.data);
        await fetchHistory();
        return res.data;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to update terms';
        setError(msg);
        throw err;
      }
    },
    [fetchHistory],
  );

  useEffect(() => {
    fetchCurrent();
    fetchHistory();
  }, [fetchCurrent, fetchHistory]);

  return { current, history, loading, error, createTerms, refresh: fetchCurrent };
}

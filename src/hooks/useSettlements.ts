import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost } from '@/data/repositories/http/apiClient';

export interface SettlementDeductions {
  insurance_pool: number;
  damage_charges: number;
  total_deductions: number;
}

export interface Settlement {
  id: string;
  operator_id: string;
  operator_name?: string;
  period_start: string;
  period_end: string;
  status: string;
  total_due: string;
  total_payable: string;
  net_amount: string;
  deductions: SettlementDeductions;
  payment_reference: string | null;
  approved_by: string | null;
  approved_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SettlementDetail extends Settlement {
  invoices: {
    id: string;
    booking_id: string | null;
    operator_name: string | null;
    total: string;
    paid_date: string | null;
  }[];
}

export function useSettlements() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshSettlements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<Settlement[]>('/settlements');
      setSettlements(res.data);
    } catch {
      // Silently fail — demo mode may not have API
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettlements();
  }, [refreshSettlements]);

  const getSettlement = useCallback(async (id: string) => {
    const res = await apiGet<SettlementDetail>(`/settlements/${id}`);
    return res.data;
  }, []);

  const approveSettlement = useCallback(
    async (id: string) => {
      const res = await apiPost<Settlement>(`/settlements/${id}/approve`, {});
      await refreshSettlements();
      return res.data;
    },
    [refreshSettlements],
  );

  const paySettlement = useCallback(
    async (id: string, paymentReference: string) => {
      const res = await apiPost<Settlement>(`/settlements/${id}/pay`, {
        payment_reference: paymentReference,
      });
      await refreshSettlements();
      return res.data;
    },
    [refreshSettlements],
  );

  const generateSettlements = useCallback(
    async (periodStart: string, periodEnd: string) => {
      const res = await apiPost<Settlement[]>('/settlements/generate', {
        period_start: periodStart,
        period_end: periodEnd,
      });
      await refreshSettlements();
      return res.data;
    },
    [refreshSettlements],
  );

  return {
    settlements,
    loading,
    refreshSettlements,
    getSettlement,
    approveSettlement,
    paySettlement,
    generateSettlements,
  };
}

import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPatch } from '@/data/repositories/http/apiClient';

/* ---------- Types ---------- */

export interface MaintenanceRule {
  id: string;
  asset_type_id: string | null;
  rule_name: string;
  field: string;
  operator: string;
  threshold_value: string;
  severity: string;
  enabled: boolean;
  created_at: string;
}

export interface MaintenanceTicket {
  id: string;
  asset_id: string | null;
  rule_id: string | null;
  ticket_type: string;
  status: string;
  severity: string;
  description: string;
  assigned_to: string | null;
  parts_needed: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface EvaluateResult {
  tickets_created: number;
  tickets: MaintenanceTicket[];
}

/* ---------- Hook ---------- */

export function useMaintenance() {
  const [rules, setRules] = useState<MaintenanceRule[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [loadingRules, setLoadingRules] = useState(true);
  const [loadingTickets, setLoadingTickets] = useState(true);

  const refreshRules = useCallback(async () => {
    setLoadingRules(true);
    try {
      const res = await apiGet<MaintenanceRule[]>('/maintenance/rules');
      setRules(res.data);
    } finally {
      setLoadingRules(false);
    }
  }, []);

  const refreshTickets = useCallback(async (filters?: { status?: string; severity?: string }) => {
    setLoadingTickets(true);
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.severity) params.set('severity', filters.severity);
      const qs = params.toString();
      const res = await apiGet<MaintenanceTicket[]>(`/maintenance/tickets${qs ? `?${qs}` : ''}`);
      setTickets(res.data);
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  useEffect(() => {
    refreshRules();
    refreshTickets();
  }, [refreshRules, refreshTickets]);

  const createRule = useCallback(async (input: Omit<MaintenanceRule, 'id' | 'created_at'>) => {
    const res = await apiPost<MaintenanceRule>('/maintenance/rules', input);
    await refreshRules();
    return res.data;
  }, [refreshRules]);

  const updateRule = useCallback(async (id: string, input: Partial<Pick<MaintenanceRule, 'enabled' | 'rule_name' | 'threshold_value' | 'severity'>>) => {
    const res = await apiPatch<MaintenanceRule>(`/maintenance/rules/${id}`, input);
    await refreshRules();
    return res.data;
  }, [refreshRules]);

  const evaluate = useCallback(async () => {
    const res = await apiPost<EvaluateResult>('/maintenance/evaluate', {});
    await refreshTickets();
    return res.data;
  }, [refreshTickets]);

  const updateTicket = useCallback(async (id: string, input: Partial<MaintenanceTicket>) => {
    const res = await apiPatch<MaintenanceTicket>(`/maintenance/tickets/${id}`, input);
    await refreshTickets();
    return res.data;
  }, [refreshTickets]);

  const completeTicket = useCallback(async (id: string, resolutionNotes?: string) => {
    const res = await apiPost<MaintenanceTicket>(`/maintenance/tickets/${id}/complete`, {
      resolution_notes: resolutionNotes,
    });
    await refreshTickets();
    return res.data;
  }, [refreshTickets]);

  return {
    rules,
    tickets,
    loadingRules,
    loadingTickets,
    refreshRules,
    refreshTickets,
    createRule,
    updateRule,
    evaluate,
    updateTicket,
    completeTicket,
  };
}

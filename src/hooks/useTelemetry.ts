import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost } from '@/data/repositories/http/apiClient';

/* ---------- Types ---------- */

export interface TelemetrySync {
  id: string;
  asset_id: string | null;
  source: string;
  flight_hours_delta: string | null;
  battery_cycles_delta: number | null;
  firmware_version: string | null;
  fault_codes: string[];
  synced_at: string;
  raw_payload: Record<string, unknown>;
}

export interface TelemetryCoverage {
  total_active: number;
  synced_last_24h: number;
  coverage_pct: number;
  fault_alerts: TelemetrySync[];
}

export interface SimulateResult {
  synced: number;
  faulted: number;
  results: {
    serial_number: string;
    flight_hours_delta: number;
    battery_cycles_delta: number;
    fault_codes: string[];
  }[];
}

/* ---------- Hook ---------- */

export function useTelemetry() {
  const [coverage, setCoverage] = useState<TelemetryCoverage | null>(null);
  const [history, setHistory] = useState<TelemetrySync[]>([]);
  const [loadingCoverage, setLoadingCoverage] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const refreshCoverage = useCallback(async () => {
    setLoadingCoverage(true);
    try {
      const res = await apiGet<TelemetryCoverage>('/telemetry/coverage');
      setCoverage(res.data);
    } finally {
      setLoadingCoverage(false);
    }
  }, []);

  const fetchHistory = useCallback(async (assetId: string) => {
    setLoadingHistory(true);
    try {
      const res = await apiGet<TelemetrySync[]>(`/telemetry/history/${assetId}`);
      setHistory(res.data);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const simulate = useCallback(async () => {
    const res = await apiPost<SimulateResult>('/telemetry/simulate', {});
    await refreshCoverage();
    return res.data;
  }, [refreshCoverage]);

  useEffect(() => {
    refreshCoverage();
  }, [refreshCoverage]);

  return {
    coverage,
    history,
    loadingCoverage,
    loadingHistory,
    refreshCoverage,
    fetchHistory,
    simulate,
  };
}

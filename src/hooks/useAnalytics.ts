import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost } from '@/data/repositories/http/apiClient';

/* ---------- Types ---------- */

export interface Anomaly {
  id: string;
  asset_id: string | null;
  asset_serial: string | null;
  anomaly_type: 'sigma_deviation' | 'usage_spike' | 'operator_anomaly';
  field: string;
  expected_value: string | null;
  actual_value: string | null;
  sigma_distance: string | null;
  status: 'pending' | 'accepted' | 'dismissed';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface Baseline {
  id: string;
  asset_id: string;
  avg_flight_hours_per_show: string | null;
  stddev_flight_hours: string | null;
  avg_battery_drain_per_show: string | null;
  stddev_battery_drain: string | null;
  sample_count: number;
  last_computed: string;
}

export interface BaselinesData {
  baselines: Baseline[];
  total_baselines: number;
  total_active_assets: number;
  fleet_coverage_pct: number;
}

export interface ComputeBaselinesResult {
  baselines_computed: number;
  total_baselines: number;
  fleet_coverage_pct: number;
}

export interface DetectAnomaliesResult {
  anomalies_created: number;
  anomalies: Anomaly[];
}

/* ---------- Hook ---------- */

export function useAnalytics() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [baselinesData, setBaselinesData] = useState<BaselinesData | null>(null);
  const [loadingAnomalies, setLoadingAnomalies] = useState(true);
  const [loadingBaselines, setLoadingBaselines] = useState(true);

  const refreshAnomalies = useCallback(async (filters?: { status?: string; anomaly_type?: string }) => {
    setLoadingAnomalies(true);
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.anomaly_type) params.set('anomaly_type', filters.anomaly_type);
      const qs = params.toString();
      const res = await apiGet<Anomaly[]>(`/analytics/anomalies${qs ? `?${qs}` : ''}`);
      setAnomalies(res.data);
    } finally {
      setLoadingAnomalies(false);
    }
  }, []);

  const refreshBaselines = useCallback(async () => {
    setLoadingBaselines(true);
    try {
      const res = await apiGet<BaselinesData>('/analytics/baselines');
      setBaselinesData(res.data);
    } finally {
      setLoadingBaselines(false);
    }
  }, []);

  useEffect(() => {
    refreshAnomalies();
    refreshBaselines();
  }, [refreshAnomalies, refreshBaselines]);

  const computeBaselines = useCallback(async () => {
    const res = await apiPost<ComputeBaselinesResult>('/analytics/compute-baselines', {});
    await refreshBaselines();
    return res.data;
  }, [refreshBaselines]);

  const detectAnomalies = useCallback(async () => {
    const res = await apiPost<DetectAnomaliesResult>('/analytics/detect-anomalies', {});
    await refreshAnomalies();
    return res.data;
  }, [refreshAnomalies]);

  const reviewAnomaly = useCallback(async (id: string, status: 'accepted' | 'dismissed') => {
    const res = await apiPost<Anomaly>(`/analytics/anomalies/${id}/review`, { status });
    await refreshAnomalies();
    return res.data;
  }, [refreshAnomalies]);

  return {
    anomalies,
    baselinesData,
    loadingAnomalies,
    loadingBaselines,
    refreshAnomalies,
    refreshBaselines,
    computeBaselines,
    detectAnomalies,
    reviewAnomaly,
  };
}

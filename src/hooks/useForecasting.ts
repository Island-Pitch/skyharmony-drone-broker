import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '@/data/repositories/http/apiClient';

export interface ForecastEntry {
  month: string;
  region: string;
  predicted_drone_demand: number;
  confidence: number;
}

export interface HeatmapRegion {
  name: string;
  lat: number;
  lng: number;
  demand_score: number;
  supply_count: number;
  balance: number;
}

export interface SupplyAlert {
  region: string;
  demand: number;
  supply: number;
  utilization_pct: number;
  severity: 'warning' | 'critical';
  message: string;
}

/** Hook providing demand forecasting data from the API. */
export function useForecasting() {
  const [forecasts, setForecasts] = useState<ForecastEntry[]>([]);
  const [regions, setRegions] = useState<HeatmapRegion[]>([]);
  const [alerts, setAlerts] = useState<SupplyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [demandRes, heatmapRes, alertsRes] = await Promise.all([
        apiGet<{ forecasts: ForecastEntry[] }>('/forecasting/demand'),
        apiGet<{ regions: HeatmapRegion[] }>('/forecasting/heatmap'),
        apiGet<{ alerts: SupplyAlert[] }>('/forecasting/alerts'),
      ]);
      setForecasts(demandRes.data.forecasts);
      setRegions(heatmapRes.data.regions);
      setAlerts(alertsRes.data.alerts);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { forecasts, regions, alerts, loading, error, refresh };
}

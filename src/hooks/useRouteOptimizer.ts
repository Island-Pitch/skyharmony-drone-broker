import { useState, useCallback } from 'react';
import { apiPost } from '@/data/repositories/http/apiClient';

export interface RouteLeg {
  from: string;
  to: string;
  distance: number;
}

export interface OptimizedRoute {
  optimized_order: string[];
  total_distance_miles: number;
  legs: RouteLeg[];
}

/** Known locations available for route optimization. */
export const ROUTE_LOCATIONS = [
  'Los Angeles',
  'San Diego',
  'Las Vegas',
  'Phoenix',
  'San Francisco',
  'Scottsdale',
  'Anaheim',
  'Sacramento',
  'Long Beach',
  'Seal Beach',
] as const;

export type RouteLocation = (typeof ROUTE_LOCATIONS)[number];

/** Hook for route optimization API calls. */
export function useRouteOptimizer() {
  const [result, setResult] = useState<OptimizedRoute | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optimize = useCallback(async (pickup: string, deliveries: string[]) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiPost<OptimizedRoute>('/routes/optimize', { pickup, deliveries });
      setResult(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Route optimization failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, optimize, reset };
}

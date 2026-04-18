import { useState, useCallback, useContext } from 'react';
import { DataContext } from '@/providers/DataProvider';
import type { Asset } from '@/data/models/asset';
import type {
  ConflictResult,
  AlternativeDate,
  AllocationResult,
} from '@/services/AllocationService';

export interface UseAllocationReturn {
  available: Asset[];
  conflicts: ConflictResult | null;
  allocationResult: AllocationResult | null;
  alternatives: AlternativeDate[];
  loading: boolean;
  error: Error | null;
  checkAvailability: (date: string, endDate?: string) => Promise<void>;
  checkConflicts: (bookingId: string) => Promise<void>;
  suggestAlternatives: (
    droneCount: number,
    preferredDate: string,
    windowDays?: number,
  ) => Promise<void>;
  allocate: (bookingId: string, actorId: string) => Promise<AllocationResult>;
}

/** Hook wrapping AllocationService methods with React state management. */
export function useAllocation(): UseAllocationReturn {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useAllocation must be used within a DataProvider');

  const { allocationService } = ctx;
  const [available, setAvailable] = useState<Asset[]>([]);
  const [conflicts, setConflicts] = useState<ConflictResult | null>(null);
  const [allocationResult, setAllocationResult] =
    useState<AllocationResult | null>(null);
  const [alternatives, setAlternatives] = useState<AlternativeDate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const checkAvailability = useCallback(
    async (date: string, endDate?: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await allocationService.getAvailableDrones(date, endDate);
        setAvailable(result);
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setLoading(false);
      }
    },
    [allocationService],
  );

  const checkConflicts = useCallback(
    async (bookingId: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await allocationService.detectConflicts(bookingId);
        setConflicts(result);
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setLoading(false);
      }
    },
    [allocationService],
  );

  const suggestAlternatives = useCallback(
    async (droneCount: number, preferredDate: string, windowDays?: number) => {
      setLoading(true);
      setError(null);
      try {
        const result = await allocationService.suggestAlternativeDates(
          droneCount,
          preferredDate,
          windowDays,
        );
        setAlternatives(result);
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setLoading(false);
      }
    },
    [allocationService],
  );

  const allocate = useCallback(
    async (bookingId: string, actorId: string): Promise<AllocationResult> => {
      setLoading(true);
      setError(null);
      try {
        const result = await allocationService.allocate(bookingId, actorId);
        setAllocationResult(result);
        return result;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [allocationService],
  );

  return {
    available,
    conflicts,
    allocationResult,
    alternatives,
    loading,
    error,
    checkAvailability,
    checkConflicts,
    suggestAlternatives,
    allocate,
  };
}

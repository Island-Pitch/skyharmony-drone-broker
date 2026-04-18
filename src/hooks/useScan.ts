import { useState, useCallback, useContext } from 'react';
import { DataContext } from '@/providers/DataProvider';
import type { Asset } from '@/data/models/asset';

export interface ScanState {
  scanResult: Asset | null;
  scanning: boolean;
  error: string | null;
  notFound: boolean;
  lastAction: 'check_out' | 'check_in' | null;
  actionSuccess: boolean;
}

/** Hook providing scan-based asset lookup and check-in/check-out operations. */
export function useScan() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useScan must be used within a DataProvider');

  const { scanService } = ctx;

  const [scanResult, setScanResult] = useState<Asset | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [lastAction, setLastAction] = useState<'check_out' | 'check_in' | null>(null);
  const [actionSuccess, setActionSuccess] = useState(false);

  const scan = useCallback(
    async (serial: string) => {
      setScanning(true);
      setError(null);
      setNotFound(false);
      setLastAction(null);
      setActionSuccess(false);

      try {
        const asset = await scanService.lookupBySerial(serial);
        if (!asset) {
          setNotFound(true);
          setScanResult(null);
        } else {
          setScanResult(asset);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setScanResult(null);
      } finally {
        setScanning(false);
      }
    },
    [scanService],
  );

  const checkOut = useCallback(
    async (serial: string, actorId: string, bookingId?: string) => {
      setError(null);
      setActionSuccess(false);

      try {
        const result = await scanService.checkOut(serial, actorId, bookingId);
        setScanResult(result.asset);
        setLastAction('check_out');
        setActionSuccess(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [scanService],
  );

  const checkIn = useCallback(
    async (serial: string, actorId: string) => {
      setError(null);
      setActionSuccess(false);

      try {
        const result = await scanService.checkIn(serial, actorId);
        setScanResult(result.asset);
        setLastAction('check_in');
        setActionSuccess(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [scanService],
  );

  const clearResult = useCallback(() => {
    setScanResult(null);
    setError(null);
    setNotFound(false);
    setLastAction(null);
    setActionSuccess(false);
  }, []);

  return {
    scanResult,
    scanning,
    error,
    notFound,
    lastAction,
    actionSuccess,
    scan,
    checkOut,
    checkIn,
    clearResult,
  };
}

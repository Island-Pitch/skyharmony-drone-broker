import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { useScan } from '../useScan';
import { DataProvider } from '@/providers/DataProvider';
import { store } from '@/data/store';
import { seedStore } from '@/data/seed';

function wrapper({ children }: { children: ReactNode }) {
  return <DataProvider>{children}</DataProvider>;
}

describe('useScan', () => {
  beforeEach(() => {
    store.reset();
    seedStore();
  });

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useScan(), { wrapper });

    expect(result.current.scanResult).toBeNull();
    expect(result.current.scanning).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.notFound).toBe(false);
  });

  it('scans and finds an existing asset', async () => {
    const { result } = renderHook(() => useScan(), { wrapper });

    // Use a serial from seeded data (first drone)
    const firstAsset = Array.from(store.assets.values()).find(
      (a) => /^[A-Z]{2}-\d{4}$/.test(a.serial_number),
    )!;

    await act(async () => {
      await result.current.scan(firstAsset.serial_number);
    });

    expect(result.current.scanResult).toBeDefined();
    expect(result.current.scanResult?.serial_number).toBe(firstAsset.serial_number);
    expect(result.current.notFound).toBe(false);
  });

  it('sets notFound when serial does not exist', async () => {
    const { result } = renderHook(() => useScan(), { wrapper });

    await act(async () => {
      await result.current.scan('NONEXISTENT-9999');
    });

    expect(result.current.scanResult).toBeNull();
    expect(result.current.notFound).toBe(true);
  });

  it('clears result', async () => {
    const { result } = renderHook(() => useScan(), { wrapper });

    const firstAsset = Array.from(store.assets.values()).find(
      (a) => /^[A-Z]{2}-\d{4}$/.test(a.serial_number),
    )!;

    await act(async () => {
      await result.current.scan(firstAsset.serial_number);
    });

    expect(result.current.scanResult).not.toBeNull();

    act(() => {
      result.current.clearResult();
    });

    expect(result.current.scanResult).toBeNull();
    expect(result.current.notFound).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('throws when used outside DataProvider', () => {
    expect(() => {
      renderHook(() => useScan());
    }).toThrow('useScan must be used within a DataProvider');
  });
});

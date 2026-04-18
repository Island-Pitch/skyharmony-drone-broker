import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { useIncidents } from '../useIncidents';
import { DataProvider } from '@/providers/DataProvider';
import { store } from '@/data/store';
import { seedStore } from '@/data/seed';

function wrapper({ children }: { children: ReactNode }) {
  return <DataProvider>{children}</DataProvider>;
}

describe('useIncidents', () => {
  beforeEach(() => {
    store.reset();
    seedStore();
  });

  it('initializes with empty incidents and loading false after mount', async () => {
    const { result } = renderHook(() => useIncidents(), { wrapper });

    // After initial render, loading should resolve
    await act(async () => {});

    expect(result.current.incidents).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('reports an incident and refreshes the list', async () => {
    const { result } = renderHook(() => useIncidents(), { wrapper });
    await act(async () => {});

    const firstAsset = Array.from(store.assets.values())[0]!;

    let reported;
    await act(async () => {
      reported = await result.current.reportIncident({
        asset_id: firstAsset.id,
        reporter_id: crypto.randomUUID(),
        severity: 'functional',
        description: 'Test incident from hook',
      });
    });

    expect(reported).toBeDefined();
    expect(result.current.incidents).toHaveLength(1);
  });

  it('resolves an incident and refreshes the list', async () => {
    const { result } = renderHook(() => useIncidents(), { wrapper });
    await act(async () => {});

    const firstAsset = Array.from(store.assets.values())[0]!;

    let incident;
    await act(async () => {
      incident = await result.current.reportIncident({
        asset_id: firstAsset.id,
        reporter_id: crypto.randomUUID(),
        severity: 'cosmetic',
        description: 'Minor issue',
      });
    });

    await act(async () => {
      await result.current.resolveIncident(incident!.id, 'All good now');
    });

    expect(result.current.incidents[0]?.status).toBe('resolved');
  });

  it('throws when used outside DataProvider', () => {
    expect(() => {
      renderHook(() => useIncidents());
    }).toThrow('useIncidents must be used within a DataProvider');
  });
});

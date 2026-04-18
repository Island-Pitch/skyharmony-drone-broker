import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPatch } from '@/data/repositories/http/apiClient';
import type {
  Manifest,
  ManifestDetail,
  CreateManifestInput,
  CreateLegInput,
  UpdateLegInput,
  TransportLeg,
} from '@/data/models/manifest';

/** Hook providing logistics manifest CRUD operations with loading state. */
export function useLogistics() {
  const [manifests, setManifests] = useState<Manifest[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshManifests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<Manifest[]>('/logistics/manifests');
      setManifests(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshManifests();
  }, [refreshManifests]);

  const getManifest = useCallback(async (id: string): Promise<ManifestDetail> => {
    const res = await apiGet<ManifestDetail>(`/logistics/manifest/${id}`);
    return res.data;
  }, []);

  const createManifest = useCallback(
    async (input: CreateManifestInput): Promise<Manifest> => {
      const res = await apiPost<Manifest>('/logistics/manifest', input);
      await refreshManifests();
      return res.data;
    },
    [refreshManifests],
  );

  const addLeg = useCallback(
    async (manifestId: string, input: CreateLegInput): Promise<TransportLeg> => {
      const res = await apiPost<TransportLeg>(
        `/logistics/manifest/${manifestId}/leg`,
        input,
      );
      return res.data;
    },
    [],
  );

  const updateLeg = useCallback(
    async (legId: string, input: UpdateLegInput): Promise<TransportLeg> => {
      const res = await apiPatch<TransportLeg>(`/logistics/leg/${legId}`, input);
      return res.data;
    },
    [],
  );

  return { manifests, loading, createManifest, getManifest, addLeg, updateLeg, refreshManifests };
}

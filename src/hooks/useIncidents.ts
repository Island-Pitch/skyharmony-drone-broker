import { useState, useEffect, useCallback, useContext } from 'react';
import { DataContext } from '@/providers/DataProvider';
import type { Incident, CreateIncidentInput } from '@/data/models/incident';

/** Hook providing incident CRUD operations with loading state. Reads from DataProvider context. */
export function useIncidents() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useIncidents must be used within a DataProvider');

  const { incidentService } = ctx;
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await incidentService.listIncidents();
      setIncidents(data);
    } finally {
      setLoading(false);
    }
  }, [incidentService]);

  useEffect(() => {
    refreshIncidents();
  }, [refreshIncidents]);

  const reportIncident = useCallback(
    async (input: CreateIncidentInput) => {
      const created = await incidentService.reportIncident(input);
      await refreshIncidents();
      return created;
    },
    [incidentService, refreshIncidents],
  );

  const resolveIncident = useCallback(
    async (id: string, resolutionNotes: string) => {
      const resolved = await incidentService.resolveIncident(id, resolutionNotes);
      await refreshIncidents();
      return resolved;
    },
    [incidentService, refreshIncidents],
  );

  return { incidents, loading, reportIncident, resolveIncident, refreshIncidents };
}

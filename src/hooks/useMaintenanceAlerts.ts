import { useState, useEffect, useCallback, useContext } from 'react';
import { DataContext } from '@/providers/DataProvider';
import { MaintenanceService } from '@/services/MaintenanceService';
import type { MaintenanceAlert } from '@/services/MaintenanceService';

/** Hook providing maintenance alerts by scanning fleet assets. */
export function useMaintenanceAlerts() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useMaintenanceAlerts must be used within a DataProvider');

  const [alerts, setAlerts] = useState<MaintenanceAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const service = new MaintenanceService(ctx.assetRepo);
    const data = await service.getAlerts();
    setAlerts(data);
    setLoading(false);
  }, [ctx.assetRepo]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { alerts, loading, refresh };
}

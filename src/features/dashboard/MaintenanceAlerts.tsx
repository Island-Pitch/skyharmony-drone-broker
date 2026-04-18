import { useMaintenanceAlerts } from '@/hooks/useMaintenanceAlerts';

/** Shows up to maxAlerts maintenance alerts, sorted by severity (critical first). */
export function MaintenanceAlerts({ maxAlerts = 10 }: { maxAlerts?: number }) {
  const { alerts, loading } = useMaintenanceAlerts();

  if (loading) {
    return <p>Scanning fleet for alerts...</p>;
  }

  const displayed = alerts.slice(0, maxAlerts);

  return (
    <div className="dashboard-widget" data-testid="maintenance-alerts">
      <h3>Maintenance Alerts ({alerts.length})</h3>
      {displayed.length === 0 ? (
        <p className="empty-state">No maintenance alerts</p>
      ) : (
        <div className="alert-list">
          {displayed.map((alert) => (
            <div
              key={`${alert.asset_id}-${alert.category}`}
              className={`alert-card alert-${alert.severity}`}
            >
              <div className="alert-header">
                <span className={`severity-badge severity-${alert.severity}`}>
                  {alert.severity}
                </span>
                <span className="alert-serial">{alert.serial_number}</span>
              </div>
              <p className="alert-message">{alert.message}</p>
              <span className="alert-meta">
                {alert.manufacturer} {alert.model}
              </span>
            </div>
          ))}
          {alerts.length > maxAlerts && (
            <p className="alert-overflow">
              +{alerts.length - maxAlerts} more alerts
            </p>
          )}
        </div>
      )}
    </div>
  );
}

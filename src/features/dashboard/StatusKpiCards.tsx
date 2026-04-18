import type { FleetSummary } from '@/services/FleetSummaryService';

interface StatusKpiCardsProps {
  summary: FleetSummary;
}

const STATUS_CONFIG: { key: string; label: string; colorClass: string }[] = [
  { key: 'available', label: 'Available', colorClass: 'kpi-success' },
  { key: 'allocated', label: 'Allocated', colorClass: 'kpi-primary' },
  { key: 'in_transit', label: 'In Transit', colorClass: 'kpi-warning' },
  { key: 'maintenance', label: 'Maintenance', colorClass: 'kpi-danger' },
  { key: 'retired', label: 'Retired', colorClass: 'kpi-muted' },
];

/** Fleet status KPI cards with color-coded status indicators. */
export function StatusKpiCards({ summary }: StatusKpiCardsProps) {
  return (
    <div className="kpi-grid" data-testid="status-kpi-cards">
      <div className="stat-card kpi-card">
        <span className="stat-value">{summary.total_assets}</span>
        <span className="stat-label">Total Assets</span>
      </div>
      {STATUS_CONFIG.map(({ key, label, colorClass }) => (
        <div key={key} className={`stat-card kpi-card ${colorClass}`}>
          <div className="kpi-indicator" />
          <span className="stat-value">{summary.by_status[key] ?? 0}</span>
          <span className="stat-label">{label}</span>
        </div>
      ))}
      <div className="stat-card kpi-card kpi-primary">
        <span className="stat-value">{summary.utilization_pct}%</span>
        <span className="stat-label">Utilization</span>
      </div>
    </div>
  );
}

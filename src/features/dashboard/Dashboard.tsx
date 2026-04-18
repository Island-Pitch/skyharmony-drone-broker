import { useFleetSummary } from '@/hooks/useFleetSummary';
import { StatusKpiCards } from './StatusKpiCards';
import { BookingsQueue } from './BookingsQueue';
import { MaintenanceAlerts } from './MaintenanceAlerts';
import { RevenueSummary } from './RevenueSummary';
import { OperatorBreakdown } from './OperatorBreakdown';

export function Dashboard() {
  const { summary, loading } = useFleetSummary();

  if (loading || !summary) {
    return (
      <div className="page dashboard">
        <h2>Dashboard</h2>
        <p>Loading summary...</p>
      </div>
    );
  }

  return (
    <div className="page dashboard">
      <h2>Dashboard</h2>
      <StatusKpiCards summary={summary} />
      <div className="dashboard-grid">
        <div className="dashboard-widget dashboard-grid-wide">
          <BookingsQueue />
        </div>
        <div className="dashboard-widget">
          <MaintenanceAlerts maxAlerts={5} />
        </div>
        <div className="dashboard-widget">
          <RevenueSummary />
        </div>
        <div className="dashboard-widget dashboard-grid-wide">
          <OperatorBreakdown />
        </div>
        <div className="dashboard-widget dashboard-grid-wide">
          <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '0.75rem' }}>
              <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" /><path d="M8 2v16" /><path d="M16 6v16" />
            </svg>
            <h3 style={{ marginBottom: '0.5rem' }}>Fleet Map</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Geographic fleet visualization — Coming in Phase 2</p>
          </div>
        </div>
      </div>
    </div>
  );
}

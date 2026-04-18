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
      </div>
    </div>
  );
}

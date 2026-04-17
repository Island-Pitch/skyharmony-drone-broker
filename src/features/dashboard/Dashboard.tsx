import { useFleetSummary } from '@/hooks/useFleetSummary';
import { SummaryCard } from './SummaryCard';

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
      <div className="stats-grid">
        <SummaryCard label="Total Assets" value={summary.total_assets} />
        <SummaryCard
          label="Available"
          value={summary.by_status['available'] ?? 0}
        />
        <SummaryCard
          label="Allocated"
          value={summary.by_status['allocated'] ?? 0}
        />
        <SummaryCard
          label="In Maintenance"
          value={summary.by_status['maintenance'] ?? 0}
        />
        <SummaryCard
          label="Utilization"
          value={`${summary.utilization_pct}%`}
        />
        <SummaryCard
          label="Manufacturers"
          value={Object.keys(summary.by_manufacturer).length}
        />
      </div>
    </div>
  );
}

import { useFleetSummary } from '@/hooks/useFleetSummary';
import { useBookings } from '@/hooks/useBookings';
import { SummaryCard } from '@/features/dashboard/SummaryCard';

/** Simplified dashboard for OperatorAdmin role — shows only operator-relevant data. */
export function OperatorDashboard() {
  const { summary, loading: summaryLoading } = useFleetSummary();
  const { bookings, loading: bookingsLoading } = useBookings();

  const loading = summaryLoading || bookingsLoading;

  if (loading || !summary) {
    return (
      <div className="page dashboard">
        <h2>Operator Dashboard</h2>
        <p>Loading...</p>
      </div>
    );
  }

  const activeBookings = bookings.filter(
    (b) => b.status !== 'completed' && b.status !== 'cancelled',
  );

  return (
    <div className="page dashboard" data-testid="operator-dashboard">
      <h2>Operator Dashboard</h2>
      <div className="stats-grid">
        <SummaryCard label="Available Drones" value={summary.by_status['available'] ?? 0} />
        <SummaryCard label="Your Bookings" value={activeBookings.length} />
        <SummaryCard label="Utilization" value={`${summary.utilization_pct}%`} />
      </div>
      {activeBookings.length > 0 && (
        <div className="dashboard-widget" style={{ marginTop: '1.5rem' }}>
          <h3>Your Active Bookings</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Show Date</th>
                <th>Location</th>
                <th>Drones</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {activeBookings.map((b) => (
                <tr key={b.id}>
                  <td>{new Date(b.show_date).toLocaleDateString()}</td>
                  <td>{b.location}</td>
                  <td>{b.drone_count}</td>
                  <td>
                    <span className="status-badge active">{b.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

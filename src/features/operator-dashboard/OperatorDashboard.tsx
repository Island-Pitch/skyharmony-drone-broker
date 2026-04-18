import { useFleetSummary } from '@/hooks/useFleetSummary';
import { useBookings } from '@/hooks/useBookings';
import { useOperatorOverview } from '@/hooks/useOperatorOverview';
import { useAuth } from '@/auth/useAuth';
import { Role } from '@/auth/roles';
import { TeamManager } from './TeamManager';

const STATUS_COLORS: Record<string, string> = {
  available: 'var(--color-success)',
  allocated: '#5BA3D9',
  in_transit: 'var(--color-warning)',
  maintenance: 'var(--color-whenua)',
  retired: 'var(--color-text-muted)',
};

const STATUS_LABELS: Record<string, string> = {
  available: 'Available',
  allocated: 'Allocated',
  in_transit: 'In Transit',
  maintenance: 'Maintenance',
  retired: 'Retired',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Rich operator self-service dashboard — the first thing operators see. */
export function OperatorDashboard() {
  const { summary, loading: summaryLoading } = useFleetSummary();
  const { bookings, loading: bookingsLoading } = useBookings();
  const { role } = useAuth();
  const {
    overview,
    team,
    loading: overviewLoading,
    teamLoading,
    inviteTeamMember,
    removeTeamMember,
  } = useOperatorOverview();

  const loading = summaryLoading || bookingsLoading || overviewLoading;

  if (loading || !summary) {
    return (
      <div className="page dashboard">
        <h2 className="op-hero-heading">Operator Dashboard</h2>
        <p>Loading...</p>
      </div>
    );
  }

  const activeBookings = bookings.filter(
    (b) => b.status !== 'completed' && b.status !== 'cancelled',
  );

  const upcomingBookings = overview?.upcoming_bookings ?? activeBookings.slice(0, 5).map((b) => ({
    id: b.id,
    show_date: b.show_date,
    location: b.location,
    drone_count: b.drone_count,
    status: b.status ?? 'pending',
  }));

  const orgName = overview?.organization || 'your fleet';
  const fleetTotal = overview?.fleet_total ?? summary.by_status['available'] ?? 0;
  const revenueThisMonth = overview?.revenue_this_month ?? 0;
  const outstandingBalance = overview?.outstanding_balance ?? 0;
  const fleetByStatus = overview?.fleet_by_status ?? summary.by_status;
  const recentInvoices = overview?.recent_invoices ?? [];

  // Fleet health bar segments
  const statusOrder = ['available', 'allocated', 'in_transit', 'maintenance', 'retired'];
  const healthSegments = statusOrder
    .filter((s) => (fleetByStatus[s] ?? 0) > 0)
    .map((s) => ({
      status: s,
      count: fleetByStatus[s] ?? 0,
      pct: fleetTotal > 0 ? ((fleetByStatus[s] ?? 0) / fleetTotal) * 100 : 0,
      color: STATUS_COLORS[s] ?? 'var(--color-text-muted)',
      label: STATUS_LABELS[s] ?? s,
    }));

  const isAdmin = role === Role.OperatorAdmin;

  return (
    <div className="page dashboard" data-testid="operator-dashboard">
      {/* Hero heading */}
      <h2 className="op-hero-heading">
        Welcome back, <em>{orgName}</em>
      </h2>

      {/* Hero stat cards */}
      <div className="stats-grid op-stats-grid">
        <div className="stat-card op-stat-fleet">
          <span className="stat-value">{fleetTotal}</span>
          <span className="stat-label">My Fleet</span>
        </div>
        <div className="stat-card op-stat-shows">
          <span className="stat-value">{overview?.upcoming_bookings_count ?? activeBookings.length}</span>
          <span className="stat-label">Active Shows</span>
        </div>
        <div className="stat-card op-stat-revenue">
          <span className="stat-value">
            {formatCurrency(revenueThisMonth)}
            <span className="op-trend op-trend--up" aria-label="trending up" />
          </span>
          <span className="stat-label">This Month Revenue</span>
        </div>
        <div className="stat-card op-stat-balance">
          <span className="stat-value op-balance-value">
            {formatCurrency(outstandingBalance)}
          </span>
          <span className="stat-label">Outstanding Balance</span>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Upcoming Shows */}
        <div className="dashboard-widget dashboard-grid-narrow">
          <h3>Upcoming Shows</h3>
          {upcomingBookings.length === 0 ? (
            <p className="empty-state">No upcoming shows scheduled.</p>
          ) : (
            <table className="data-table op-shows-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Drones</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {upcomingBookings.slice(0, 5).map((b) => (
                  <tr key={b.id}>
                    <td>{new Date(b.show_date).toLocaleDateString()}</td>
                    <td>{b.location}</td>
                    <td>{b.drone_count}</td>
                    <td>
                      <span className={`status-badge ${b.status}`}>{b.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Fleet Health */}
        <div className="dashboard-widget dashboard-grid-narrow">
          <h3>Fleet Health</h3>
          {fleetTotal === 0 ? (
            <p className="empty-state">No fleet data available.</p>
          ) : (
            <>
              <div className="op-health-bar" role="img" aria-label="Fleet status breakdown">
                {healthSegments.map((seg) => (
                  <div
                    key={seg.status}
                    className="op-health-segment"
                    style={{
                      width: `${seg.pct}%`,
                      backgroundColor: seg.color,
                    }}
                    title={`${seg.label}: ${seg.count}`}
                  />
                ))}
              </div>
              <div className="op-health-legend">
                {healthSegments.map((seg) => (
                  <span key={seg.status} className="op-legend-item">
                    <span
                      className="op-legend-dot"
                      style={{ backgroundColor: seg.color }}
                    />
                    {seg.label} ({seg.count})
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="dashboard-widget dashboard-grid-narrow">
          <h3>Recent Invoices</h3>
          {recentInvoices.length === 0 ? (
            <p className="empty-state">No invoices yet.</p>
          ) : (
            <div className="op-invoice-list">
              {recentInvoices.map((inv) => (
                <div key={inv.id} className="op-invoice-row">
                  <span className="op-invoice-amount">
                    {formatCurrency(Number(inv.total))}
                  </span>
                  <span className={`status-badge ${inv.status}`}>{inv.status}</span>
                  <span className="op-invoice-date">
                    {inv.due_date
                      ? new Date(inv.due_date).toLocaleDateString()
                      : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Team Section */}
        <div className="dashboard-grid-narrow">
          {teamLoading ? (
            <div className="dashboard-widget">
              <h3>Team</h3>
              <p>Loading team...</p>
            </div>
          ) : (
            <TeamManager
              team={team}
              isAdmin={isAdmin}
              onInvite={async (email, name, r) => {
                await inviteTeamMember(email, name, r);
              }}
              onRemove={removeTeamMember}
            />
          )}
        </div>
      </div>
    </div>
  );
}

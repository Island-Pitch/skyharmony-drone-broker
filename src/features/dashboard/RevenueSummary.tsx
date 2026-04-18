import { useRevenueSummary } from '@/hooks/useRevenueSummary';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Revenue summary card with allocation fees, standby fees, and pending invoices. */
export function RevenueSummary() {
  const { summary, loading } = useRevenueSummary();

  if (loading || !summary) {
    return <p>Loading revenue data...</p>;
  }

  return (
    <div className="dashboard-widget" data-testid="revenue-summary">
      <h3>Revenue Summary</h3>
      <div className="revenue-grid">
        <div className="stat-card">
          <span className="stat-value revenue-total">
            {formatCurrency(summary.total_revenue)}
          </span>
          <span className="stat-label">Total Revenue</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">
            {formatCurrency(summary.allocation_fee_revenue)}
          </span>
          <span className="stat-label">Allocation Fees</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">
            {formatCurrency(summary.standby_fee_revenue)}
          </span>
          <span className="stat-label">Standby Fees</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{summary.pending_invoices}</span>
          <span className="stat-label">Pending Invoices</span>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { RevenueService, type RevenueSummary, type OperatorRevenue } from '@/services/RevenueService';

const service = new RevenueService();

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

export function BillingDashboard() {
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [operators, setOperators] = useState<OperatorRevenue[]>([]);

  useEffect(() => {
    (async () => {
      const [s, o] = await Promise.all([
        service.getSummary(),
        service.getOperatorBreakdown(),
      ]);
      setSummary(s);
      setOperators(o);
    })();
  }, []);

  if (!summary) {
    return (
      <div className="page">
        <h2>Billing &amp; Revenue</h2>
        <p>Loading...</p>
      </div>
    );
  }

  const maxTotal = Math.max(...operators.map((o) => o.total));

  return (
    <div className="page">
      <h2>Billing &amp; Revenue</h2>

      {/* Revenue breakdown cards */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <span className="stat-value revenue-total">{formatCurrency(summary.total_revenue)}</span>
          <span className="stat-label">Total Revenue</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{formatCurrency(summary.allocation_fee_revenue)}</span>
          <span className="stat-label">Allocation Fee Revenue</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{formatCurrency(summary.standby_fee_revenue)}</span>
          <span className="stat-label">Standby Fee Revenue</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{summary.pending_invoices}</span>
          <span className="stat-label">Pending Invoices</span>
        </div>
      </div>

      {/* Insurance pool total */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <span className="stat-value">
            {formatCurrency(operators.reduce((s, o) => s + o.insurance_pool, 0))}
          </span>
          <span className="stat-label">Insurance Pool Contributions</span>
        </div>
      </div>

      {/* Per-operator revenue bar chart (pure CSS) */}
      <div className="dashboard-widget">
        <h3>Per-Operator Revenue Split</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {operators.map((op) => (
            <div key={op.operator_name} className="operator-row">
              <div className="operator-info">
                <span className="operator-name">{op.operator_name}</span>
                <span className="operator-stats">{formatCurrency(op.total)}</span>
              </div>
              <div
                data-testid="revenue-bar"
                style={{
                  display: 'flex',
                  height: '24px',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  width: `${(op.total / maxTotal) * 100}%`,
                  minWidth: '40px',
                }}
              >
                <div
                  style={{
                    width: `${(op.allocation_fee / op.total) * 100}%`,
                    background: 'var(--color-primary)',
                  }}
                  title={`Allocation Fee: ${formatCurrency(op.allocation_fee)}`}
                />
                <div
                  style={{
                    width: `${(op.standby_fee / op.total) * 100}%`,
                    background: 'var(--color-warning)',
                  }}
                  title={`Standby Fee: ${formatCurrency(op.standby_fee)}`}
                />
                <div
                  style={{
                    width: `${(op.insurance_pool / op.total) * 100}%`,
                    background: 'var(--color-success)',
                  }}
                  title={`Insurance Pool: ${formatCurrency(op.insurance_pool)}`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', fontSize: '0.8rem' }}>
          <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'var(--color-primary)', borderRadius: '2px', marginRight: '4px', verticalAlign: 'middle' }} /> Allocation Fee</span>
          <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'var(--color-warning)', borderRadius: '2px', marginRight: '4px', verticalAlign: 'middle' }} /> Standby Fee</span>
          <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'var(--color-success)', borderRadius: '2px', marginRight: '4px', verticalAlign: 'middle' }} /> Insurance Pool</span>
        </div>
      </div>

      {/* Detail table */}
      <table className="data-table" style={{ marginTop: '1.5rem' }}>
        <thead>
          <tr>
            <th>Operator</th>
            <th>Allocation Fee</th>
            <th>Standby Fee</th>
            <th>Insurance Pool</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {operators.map((op) => (
            <tr key={op.operator_name}>
              <td>{op.operator_name}</td>
              <td>{formatCurrency(op.allocation_fee)}</td>
              <td>{formatCurrency(op.standby_fee)}</td>
              <td>{formatCurrency(op.insurance_pool)}</td>
              <td><strong>{formatCurrency(op.total)}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

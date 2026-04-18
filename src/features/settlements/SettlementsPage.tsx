import { useState } from 'react';
import { useSettlements } from '@/hooks/useSettlements';
import { SettlementDetail } from './SettlementDetail';
import type { Settlement } from '@/hooks/useSettlements';

function formatCurrency(amount: number | string): string {
  return `$${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString();
}

function statusBadge(status: string) {
  const colors: Record<string, { bg: string; color: string }> = {
    draft: { bg: 'var(--color-surface, #e2e8f0)', color: 'var(--color-text, #333)' },
    pending: { bg: 'var(--color-warning-bg, #fff3cd)', color: 'var(--color-warning, #856404)' },
    approved: { bg: 'var(--color-info-bg, #cce5ff)', color: 'var(--color-info, #004085)' },
    paid: { bg: 'var(--color-success-bg, #d4edda)', color: 'var(--color-success, #155724)' },
  };
  const style = colors[status] ?? colors.draft;
  return (
    <span
      style={{
        padding: '0.2rem 0.6rem',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        backgroundColor: style!.bg,
        color: style!.color,
      }}
    >
      {status}
    </span>
  );
}

export function SettlementsPage() {
  const { settlements, loading, approveSettlement, paySettlement } = useSettlements();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="page">
        <h2>Settlements</h2>
        <p>Loading settlement data...</p>
      </div>
    );
  }

  if (selectedId) {
    return (
      <div className="page">
        <h2>Settlements</h2>
        <SettlementDetail
          settlementId={selectedId}
          onBack={() => setSelectedId(null)}
          onApprove={async () => {
            await approveSettlement(selectedId);
          }}
          onPay={async (ref: string) => {
            await paySettlement(selectedId, ref);
          }}
        />
      </div>
    );
  }

  // Summary stats
  const totalNet = settlements.reduce((sum, s) => sum + Number(s.net_amount), 0);
  const paidCount = settlements.filter((s) => s.status === 'paid').length;
  const pendingApproval = settlements.filter((s) => s.status === 'draft' || s.status === 'pending').length;

  return (
    <div className="page">
      <h2>Settlements</h2>

      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <span className="stat-value">{settlements.length}</span>
          <span className="stat-label">Total Settlements</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{ color: 'var(--color-success, #198754)' }}>{formatCurrency(totalNet)}</span>
          <span className="stat-label">Total Net Payable</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{paidCount}</span>
          <span className="stat-label">Paid</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{ color: 'var(--color-warning, #ffc107)' }}>{pendingApproval}</span>
          <span className="stat-label">Pending Approval</span>
        </div>
      </div>

      {settlements.length === 0 ? (
        <div className="dashboard-widget" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ fontSize: '1.1rem', color: 'var(--color-text-muted, #666)' }}>No settlements found</p>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted, #999)' }}>
            Settlements are generated from paid invoices for each operator billing period.
          </p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Operator</th>
              <th>Period</th>
              <th>Gross Revenue</th>
              <th>Deductions</th>
              <th>Net Payable</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {settlements.map((s: Settlement) => {
              const deductions = s.deductions as { total_deductions?: number } | null;
              return (
                <tr
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{s.operator_name ?? 'Unknown'}</td>
                  <td>
                    {formatDate(s.period_start)} - {formatDate(s.period_end)}
                  </td>
                  <td>{formatCurrency(s.total_due)}</td>
                  <td style={{ color: 'var(--color-danger, #dc3545)' }}>
                    -{formatCurrency(deductions?.total_deductions ?? 0)}
                  </td>
                  <td>
                    <strong>{formatCurrency(s.net_amount)}</strong>
                  </td>
                  <td>{statusBadge(s.status)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

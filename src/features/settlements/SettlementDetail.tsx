import { useState, useEffect } from 'react';
import { useSettlements } from '@/hooks/useSettlements';
import type { SettlementDetail as SettlementDetailType } from '@/hooks/useSettlements';

interface SettlementDetailProps {
  settlementId: string;
  onBack: () => void;
  onApprove: () => Promise<void>;
  onPay: (ref: string) => Promise<void>;
}

function formatCurrency(amount: number | string): string {
  return `$${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString();
}

export function SettlementDetail({ settlementId, onBack, onApprove, onPay }: SettlementDetailProps) {
  const { getSettlement } = useSettlements();
  const [detail, setDetail] = useState<SettlementDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [payRef, setPayRef] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getSettlement(settlementId)
      .then((data) => setDetail(data))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [settlementId, getSettlement]);

  if (loading || !detail) {
    return <p>Loading settlement details...</p>;
  }

  const deductions = detail.deductions;

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await onApprove();
      const updated = await getSettlement(settlementId);
      setDetail(updated);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePay = async () => {
    if (!payRef.trim()) return;
    setActionLoading(true);
    try {
      await onPay(payRef);
      const updated = await getSettlement(settlementId);
      setDetail(updated);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          marginBottom: '1rem',
          background: 'transparent',
          border: '1px solid var(--color-border, #ccc)',
          padding: '0.4rem 1rem',
          borderRadius: '6px',
          cursor: 'pointer',
        }}
      >
        Back to Settlements
      </button>

      <div className="dashboard-widget" style={{ marginBottom: '1.5rem' }}>
        <h3>
          Settlement for {detail.operator_name ?? 'Unknown Operator'}
        </h3>
        <p style={{ color: 'var(--color-text-muted, #666)', marginTop: '0.25rem' }}>
          Period: {formatDate(detail.period_start)} - {formatDate(detail.period_end)}
        </p>
      </div>

      {/* Financial Breakdown */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <span className="stat-value">{formatCurrency(detail.total_due)}</span>
          <span className="stat-label">Gross Revenue</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{ color: 'var(--color-danger, #dc3545)' }}>
            -{formatCurrency(deductions.total_deductions)}
          </span>
          <span className="stat-label">Total Deductions</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{ color: 'var(--color-success, #198754)' }}>
            {formatCurrency(detail.net_amount)}
          </span>
          <span className="stat-label">Net Payable</span>
        </div>
      </div>

      {/* Deduction Breakdown */}
      <div className="dashboard-widget" style={{ marginBottom: '1.5rem' }}>
        <h3>Deductions</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Insurance Pool (7%)</td>
              <td style={{ color: 'var(--color-danger, #dc3545)' }}>
                -{formatCurrency(deductions.insurance_pool)}
              </td>
            </tr>
            <tr>
              <td>Damage Charges</td>
              <td style={{ color: 'var(--color-danger, #dc3545)' }}>
                -{formatCurrency(deductions.damage_charges)}
              </td>
            </tr>
            <tr>
              <td>
                <strong>Total Deductions</strong>
              </td>
              <td style={{ color: 'var(--color-danger, #dc3545)' }}>
                <strong>-{formatCurrency(deductions.total_deductions)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Status & Actions */}
      <div className="dashboard-widget" style={{ marginBottom: '1.5rem' }}>
        <h3>Status</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
          <div>
            <strong>Current Status:</strong>{' '}
            <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{detail.status}</span>
          </div>

          {detail.approved_at && (
            <div>
              <strong>Approved:</strong> {formatDate(detail.approved_at)}
            </div>
          )}

          {detail.paid_at && (
            <div>
              <strong>Paid:</strong> {formatDate(detail.paid_at)}
            </div>
          )}

          {detail.payment_reference && (
            <div>
              <strong>Payment Reference:</strong> {detail.payment_reference}
            </div>
          )}

          {/* Approve action */}
          {(detail.status === 'draft' || detail.status === 'pending') && (
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              style={{
                padding: '0.5rem 1.5rem',
                background: 'var(--color-primary, #0d6efd)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                alignSelf: 'flex-start',
                minHeight: '44px',
              }}
            >
              {actionLoading ? 'Processing...' : 'Approve Settlement'}
            </button>
          )}

          {/* Pay action */}
          {detail.status === 'approved' && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <label htmlFor="payment-ref" style={{ fontWeight: 600 }}>
                Payment Reference:
              </label>
              <input
                id="payment-ref"
                type="text"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                placeholder="e.g. ACH-2026-0417-XX"
                style={{
                  padding: '0.5rem',
                  border: '1px solid var(--color-border, #ccc)',
                  borderRadius: '6px',
                  minHeight: '44px',
                  fontSize: '16px',
                  minWidth: '220px',
                }}
              />
              <button
                onClick={handlePay}
                disabled={actionLoading || !payRef.trim()}
                style={{
                  padding: '0.5rem 1.5rem',
                  background: 'var(--color-success, #198754)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  minHeight: '44px',
                }}
              >
                {actionLoading ? 'Processing...' : 'Mark as Paid'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Related Invoices */}
      {detail.invoices && detail.invoices.length > 0 && (
        <div className="dashboard-widget">
          <h3>Included Invoices</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Operator</th>
                <th>Amount</th>
                <th>Paid Date</th>
              </tr>
            </thead>
            <tbody>
              {detail.invoices.map((inv) => (
                <tr key={inv.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {inv.id.substring(0, 8)}...
                  </td>
                  <td>{inv.operator_name ?? '-'}</td>
                  <td>{formatCurrency(inv.total)}</td>
                  <td>{formatDate(inv.paid_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

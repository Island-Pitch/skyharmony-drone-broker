import { useState, useEffect, useContext } from 'react';
import { DataContext } from '@/providers/DataProvider';
import { apiGet } from '@/data/repositories/http/apiClient';
import { useInvoices } from '@/hooks/useInvoices';
import { InvoiceList } from './InvoiceList';
import { InvoiceDetail } from './InvoiceDetail';
import type { Invoice } from '@/hooks/useInvoices';

interface OperatorBilling {
  operator_id: string;
  operator_name: string;
  allocation_revenue: number;
  standby_revenue: number;
  total_revenue: number;
  booking_count: number;
}

interface BillingSummary {
  total_revenue: number;
  allocation_fee_revenue: number;
  standby_fee_revenue: number;
  insurance_pool: number;
  pending_invoices: number;
  operators: OperatorBilling[];
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

export function BillingDashboard() {
  const ctx = useContext(DataContext);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoices, setShowInvoices] = useState(false);

  const { invoices, summary: invoiceSummary, loading: invoicesLoading, payInvoice } = useInvoices();

  useEffect(() => {
    if (ctx?.mode === 'api') {
      apiGet<BillingSummary>('/billing/summary')
        .then((res) => setSummary(res.data))
        .catch(() => setSummary(null))
        .finally(() => setLoading(false));
    } else {
      // Demo mode fallback
      setSummary({
        total_revenue: 284500,
        allocation_fee_revenue: 198150,
        standby_fee_revenue: 86350,
        insurance_pool: 13871,
        pending_invoices: 8,
        operators: [
          { operator_id: '1', operator_name: 'NightBrite Drones', allocation_revenue: 56000, standby_revenue: 25500, total_revenue: 81500, booking_count: 5 },
          { operator_id: '2', operator_name: 'Orion Skies', allocation_revenue: 49000, standby_revenue: 20750, total_revenue: 69750, booking_count: 5 },
          { operator_id: '3', operator_name: 'Vegas Drone Works', allocation_revenue: 42000, standby_revenue: 22750, total_revenue: 64750, booking_count: 5 },
          { operator_id: '4', operator_name: 'Patriotic Air', allocation_revenue: 28000, standby_revenue: 12250, total_revenue: 40250, booking_count: 5 },
          { operator_id: '5', operator_name: 'Sky Harmony Fleet', allocation_revenue: 23150, standby_revenue: 5100, total_revenue: 28250, booking_count: 4 },
        ],
      });
      setLoading(false);
    }
  }, [ctx?.mode]);

  if (loading || !summary) {
    return (
      <div className="page">
        <h2>Billing &amp; Revenue</h2>
        <p>Loading billing data...</p>
      </div>
    );
  }

  // Invoice detail view
  if (selectedInvoice) {
    return (
      <div className="page">
        <h2>Billing &amp; Revenue</h2>
        <InvoiceDetail
          invoice={selectedInvoice}
          onPay={async (invoiceId, paymentMethod) => {
            await payInvoice(invoiceId, paymentMethod);
            // Update the selected invoice after payment
            const updated = invoices.find((i) => i.id === invoiceId);
            if (updated) setSelectedInvoice(updated);
            else setSelectedInvoice(null);
          }}
          onBack={() => setSelectedInvoice(null)}
        />
      </div>
    );
  }

  // Invoice list view
  if (showInvoices) {
    return (
      <div className="page">
        <h2>Billing &amp; Revenue</h2>
        <button
          onClick={() => setShowInvoices(false)}
          style={{ marginBottom: '1rem', background: 'transparent', border: '1px solid var(--color-border, #ccc)', padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer' }}
        >
          Back to Summary
        </button>
        <h3>All Invoices</h3>
        {invoicesLoading ? (
          <p>Loading invoices...</p>
        ) : (
          <InvoiceList invoices={invoices} onSelect={setSelectedInvoice} />
        )}
      </div>
    );
  }

  const maxTotal = Math.max(...summary.operators.map((o) => o.total_revenue), 1);

  return (
    <div className="page">
      <h2>Billing &amp; Revenue</h2>

      {/* Invoice Summary Cards */}
      {invoiceSummary && (
        <div className="stats-grid" style={{ marginBottom: '2rem' }}>
          <div className="stat-card">
            <span className="stat-value">{formatCurrency(invoiceSummary.total_billed)}</span>
            <span className="stat-label">Total Billed</span>
          </div>
          <div className="stat-card">
            <span className="stat-value" style={{ color: 'var(--color-success, #198754)' }}>{formatCurrency(invoiceSummary.total_paid)}</span>
            <span className="stat-label">Total Paid</span>
          </div>
          <div className="stat-card">
            <span className="stat-value" style={{ color: 'var(--color-danger, #dc3545)' }}>{formatCurrency(invoiceSummary.total_outstanding)}</span>
            <span className="stat-label">Outstanding</span>
          </div>
          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setShowInvoices(true)}>
            <span className="stat-value">{invoiceSummary.invoice_count}</span>
            <span className="stat-label">View Invoices</span>
          </div>
        </div>
      )}

      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <span className="stat-value revenue-total">{formatCurrency(summary.total_revenue)}</span>
          <span className="stat-label">Total Revenue</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{formatCurrency(summary.allocation_fee_revenue)}</span>
          <span className="stat-label">Allocation Fees</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{formatCurrency(summary.standby_fee_revenue)}</span>
          <span className="stat-label">Standby Fees</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{summary.pending_invoices}</span>
          <span className="stat-label">Pending Invoices</span>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <span className="stat-value">{formatCurrency(summary.insurance_pool)}</span>
          <span className="stat-label">Insurance Pool (7%)</span>
        </div>
      </div>

      <div className="dashboard-widget">
        <h3>Per-Operator Revenue Split</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {summary.operators.map((op) => (
            <div key={op.operator_id} className="operator-row">
              <div className="operator-info">
                <span className="operator-name">{op.operator_name}</span>
                <span className="operator-stats">{formatCurrency(op.total_revenue)} ({op.booking_count} bookings)</span>
              </div>
              <div style={{ display: 'flex', height: '24px', borderRadius: '4px', overflow: 'hidden', width: `${(op.total_revenue / maxTotal) * 100}%`, minWidth: '40px' }}>
                <div style={{ width: `${(op.allocation_revenue / op.total_revenue) * 100}%`, background: 'var(--color-primary)' }} title={`Allocation: ${formatCurrency(op.allocation_revenue)}`} />
                <div style={{ width: `${(op.standby_revenue / op.total_revenue) * 100}%`, background: 'var(--color-warning)' }} title={`Standby: ${formatCurrency(op.standby_revenue)}`} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', fontSize: '0.8rem' }}>
          <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'var(--color-primary)', borderRadius: '2px', marginRight: '4px', verticalAlign: 'middle' }} /> Allocation</span>
          <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'var(--color-warning)', borderRadius: '2px', marginRight: '4px', verticalAlign: 'middle' }} /> Standby</span>
        </div>
      </div>

      <table className="data-table" style={{ marginTop: '1.5rem' }}>
        <thead>
          <tr>
            <th>Operator</th>
            <th>Bookings</th>
            <th>Allocation Fees</th>
            <th>Standby Fees</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {summary.operators.map((op) => (
            <tr key={op.operator_id}>
              <td>{op.operator_name}</td>
              <td>{op.booking_count}</td>
              <td>{formatCurrency(op.allocation_revenue)}</td>
              <td>{formatCurrency(op.standby_revenue)}</td>
              <td><strong>{formatCurrency(op.total_revenue)}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { useState } from 'react';
import type { Invoice } from '@/hooks/useInvoices';

interface InvoiceDetailProps {
  invoice: Invoice;
  onPay: (invoiceId: string, paymentMethod: string) => Promise<void>;
  onBack: () => void;
}

function formatCurrency(amount: string | number): string {
  return `$${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString();
}

export function InvoiceDetail({ invoice, onPay, onBack }: InvoiceDetailProps) {
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [paying, setPaying] = useState(false);

  const lineItems = Array.isArray(invoice.line_items) ? invoice.line_items : [];

  async function handlePay() {
    setPaying(true);
    try {
      await onPay(invoice.id, paymentMethod);
    } finally {
      setPaying(false);
    }
  }

  return (
    <div>
      <button
        onClick={onBack}
        style={{ marginBottom: '1rem', background: 'transparent', border: '1px solid var(--color-border, #ccc)', padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer' }}
      >
        Back to Invoices
      </button>

      <h3>Invoice Detail</h3>

      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <span className="stat-label">Operator</span>
          <span className="stat-value" style={{ fontSize: '1rem' }}>{invoice.operator_name ?? 'Unknown'}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Status</span>
          <span className="stat-value" style={{ fontSize: '1rem', textTransform: 'capitalize' }}>{invoice.status}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Due Date</span>
          <span className="stat-value" style={{ fontSize: '1rem' }}>{formatDate(invoice.due_date)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Payment Method</span>
          <span className="stat-value" style={{ fontSize: '1rem' }}>{invoice.payment_method ?? 'pending'}</span>
        </div>
      </div>

      <table className="data-table" style={{ marginBottom: '1.5rem' }}>
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((li, idx) => (
            <tr key={idx}>
              <td>{li.description}</td>
              <td>{li.quantity}</td>
              <td>{formatCurrency(li.unit_price)}</td>
              <td>{formatCurrency(li.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} style={{ textAlign: 'right', fontWeight: 600 }}>Subtotal</td>
            <td>{formatCurrency(invoice.subtotal)}</td>
          </tr>
          <tr>
            <td colSpan={3} style={{ textAlign: 'right', fontWeight: 600 }}>Tax</td>
            <td>{formatCurrency(invoice.tax)}</td>
          </tr>
          <tr>
            <td colSpan={3} style={{ textAlign: 'right', fontWeight: 700, fontSize: '1.1rem' }}>Total</td>
            <td style={{ fontWeight: 700, fontSize: '1.1rem' }}>{formatCurrency(invoice.total)}</td>
          </tr>
        </tfoot>
      </table>

      {invoice.status !== 'paid' && (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border, #ccc)' }}
          >
            <option value="credit_card">Credit Card</option>
            <option value="ach">ACH Transfer</option>
          </select>
          <button
            onClick={handlePay}
            disabled={paying}
            className="btn-primary"
            style={{ padding: '0.5rem 1.5rem', borderRadius: '6px', cursor: 'pointer' }}
          >
            {paying ? 'Processing...' : 'Mark as Paid'}
          </button>
        </div>
      )}

      {invoice.paid_date && (
        <p style={{ marginTop: '1rem', color: 'var(--color-success, #198754)' }}>
          Paid on {formatDate(invoice.paid_date)} via {invoice.payment_method}
        </p>
      )}
    </div>
  );
}

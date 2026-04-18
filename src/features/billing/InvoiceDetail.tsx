import { useState } from 'react';
import { useAuth } from '@/auth/useAuth';
import { Role } from '@/auth/roles';
import { apiPost } from '@/data/repositories/http/apiClient';
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
  const { role } = useAuth();
  const isAdmin = role === Role.CentralRepoAdmin;

  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'ach' | 'wire'>('credit_card');
  const [paying, setPaying] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  const lineItems = Array.isArray(invoice.line_items) ? invoice.line_items : [];

  async function handlePay() {
    setPaying(true);
    try {
      await onPay(invoice.id, paymentMethod);
    } finally {
      setPaying(false);
    }
  }

  async function handleSend() {
    setSending(true);
    setSendResult(null);
    try {
      const res = await apiPost<{ sent: boolean; method: string; message: string }>(
        `/invoices/${invoice.id}/send`,
        {},
      );
      setSendResult(res.data.message);
    } catch {
      setSendResult('Failed to send invoice');
    } finally {
      setSending(false);
    }
  }

  function handleDownloadPdf() {
    window.open(`/api/invoices/${invoice.id}/pdf`, '_blank');
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

      {/* Action buttons: Download PDF, Send to Operator (admin) */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <button
          onClick={handleDownloadPdf}
          style={{ padding: '0.5rem 1.2rem', borderRadius: '6px', cursor: 'pointer', background: 'var(--color-surface, #f8f9fa)', border: '1px solid var(--color-border, #ccc)' }}
        >
          Download Invoice
        </button>

        {isAdmin && invoice.status !== 'paid' && (
          <button
            onClick={handleSend}
            disabled={sending}
            style={{ padding: '0.5rem 1.2rem', borderRadius: '6px', cursor: 'pointer', background: 'var(--color-surface, #f8f9fa)', border: '1px solid var(--color-border, #ccc)' }}
          >
            {sending ? 'Sending...' : 'Send to Operator'}
          </button>
        )}
      </div>

      {sendResult && (
        <p style={{ marginBottom: '1rem', color: 'var(--color-info, #0dcaf0)', fontSize: '0.9rem' }}>
          {sendResult}
        </p>
      )}

      {/* Payment form with radio buttons */}
      {invoice.status !== 'paid' && (
        <div style={{ border: '1px solid var(--color-border, #ccc)', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
          <h4 style={{ margin: '0 0 0.75rem' }}>Payment</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="payment_method"
                value="credit_card"
                checked={paymentMethod === 'credit_card'}
                onChange={() => setPaymentMethod('credit_card')}
              />
              Credit Card
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="payment_method"
                value="ach"
                checked={paymentMethod === 'ach'}
                onChange={() => setPaymentMethod('ach')}
              />
              ACH Transfer
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="payment_method"
                value="wire"
                checked={paymentMethod === 'wire'}
                onChange={() => setPaymentMethod('wire')}
              />
              Wire Transfer
            </label>
          </div>
          <button
            onClick={handlePay}
            disabled={paying}
            className="btn-primary"
            style={{ padding: '0.5rem 1.5rem', borderRadius: '6px', cursor: 'pointer' }}
          >
            {paying ? 'Processing...' : 'Mark as Paid'}
          </button>
          <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#888' }}>
            Stripe integration pending — payment will be recorded manually.
          </p>
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

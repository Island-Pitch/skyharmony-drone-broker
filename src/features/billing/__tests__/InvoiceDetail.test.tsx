import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { InvoiceDetail } from '../InvoiceDetail';
import type { Invoice } from '@/hooks/useInvoices';

const paidInvoice: Invoice = {
  id: 'inv-1',
  booking_id: 'bk-1',
  operator_id: 'op-1',
  operator_name: 'NightBrite Drones',
  status: 'paid',
  line_items: [
    { description: 'Drone allocation fee', quantity: 50, unit_price: 350, total: 17500 },
    { description: 'Drone insurance coverage', quantity: 1, unit_price: 1225, total: 1225 },
  ],
  subtotal: '18725',
  tax: '1591.63',
  total: '20316.63',
  due_date: '2026-05-01T00:00:00.000Z',
  paid_date: '2026-04-15T00:00:00.000Z',
  payment_method: 'credit_card',
  stripe_payment_id: null,
  created_at: '2026-04-01T00:00:00.000Z',
  updated_at: '2026-04-15T00:00:00.000Z',
};

const draftInvoice: Invoice = {
  ...paidInvoice,
  id: 'inv-2',
  status: 'draft',
  paid_date: null,
  payment_method: 'pending',
};

describe('InvoiceDetail', () => {
  it('renders line items table', () => {
    render(<InvoiceDetail invoice={paidInvoice} onPay={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('Drone allocation fee')).toBeInTheDocument();
    expect(screen.getByText('Drone insurance coverage')).toBeInTheDocument();
  });

  it('shows subtotal, tax, and total', () => {
    render(<InvoiceDetail invoice={paidInvoice} onPay={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('Subtotal')).toBeInTheDocument();
    expect(screen.getByText('Tax')).toBeInTheDocument();
    // "Total" appears in both the line items header and the footer
    expect(screen.getAllByText('Total').length).toBeGreaterThanOrEqual(2);
  });

  it('does not show payment button for paid invoices', () => {
    render(<InvoiceDetail invoice={paidInvoice} onPay={vi.fn()} onBack={vi.fn()} />);
    expect(screen.queryByText('Mark as Paid')).not.toBeInTheDocument();
  });

  it('shows payment button for unpaid invoices', () => {
    render(<InvoiceDetail invoice={draftInvoice} onPay={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('Mark as Paid')).toBeInTheDocument();
  });

  it('calls onPay when payment button is clicked', async () => {
    const onPay = vi.fn().mockResolvedValue(undefined);
    render(<InvoiceDetail invoice={draftInvoice} onPay={onPay} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText('Mark as Paid'));
    await waitFor(() => {
      expect(onPay).toHaveBeenCalledWith('inv-2', 'credit_card');
    });
  });

  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn();
    render(<InvoiceDetail invoice={paidInvoice} onPay={vi.fn()} onBack={onBack} />);
    fireEvent.click(screen.getByText('Back to Invoices'));
    expect(onBack).toHaveBeenCalled();
  });

  it('shows invoice status transitions — draft displayed', () => {
    render(<InvoiceDetail invoice={draftInvoice} onPay={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('draft')).toBeInTheDocument();
  });
});
